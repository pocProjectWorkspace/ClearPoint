import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { authMiddleware } from '../middleware/auth'
import { loadQuestions, getQuestionById } from '@mindssparc/question-bank'
import type { Domain, InterventionType, Question } from '@mindssparc/shared-types'

const prisma = new PrismaClient()
export const sessionRouter = Router()

sessionRouter.use(authMiddleware)

// ── Adaptive question prioritisation ────────────────────────────

const SIGNAL_PRIORITY: InterventionType[] = ['PROCESS', 'DIGITIZE', 'INTEGRATE', 'AUTOMATE', 'ANALYTICS', 'AI']
const SIGNAL_QUESTIONS_PER_DOMAIN = 8

type QuestionPriority = 'signal' | 'detail' | 'depth'

function assignPriority(questions: Question[], domain: Domain): Map<string, QuestionPriority> {
  const domainQs = questions
    .filter(q => q.domain === domain)
    .sort((a, b) => b.baseWeight - a.baseWeight) // highest weight first

  const priorities = new Map<string, QuestionPriority>()
  domainQs.forEach((q, i) => {
    if (i < SIGNAL_QUESTIONS_PER_DOMAIN) priorities.set(q.id, 'signal')
    else if (i < SIGNAL_QUESTIONS_PER_DOMAIN * 2) priorities.set(q.id, 'detail')
    else priorities.set(q.id, 'depth')
  })
  return priorities
}

function generateAdaptiveQuestionOrder(domainsInScope: Domain[]): {
  signalIds: string[]
  detailIds: string[]
  depthIds: string[]
  allIds: string[]
  priorityMap: Record<string, QuestionPriority>
} {
  const allQuestions = loadQuestions()
  const signalIds: string[] = []
  const detailIds: string[] = []
  const depthIds: string[] = []
  const priorityMap: Record<string, QuestionPriority> = {}

  for (const domain of domainsInScope) {
    const priorities = assignPriority(allQuestions, domain)
    const domainQs = allQuestions.filter(q => q.domain === domain)

    // Smart ordering within each tier: by signal priority, then baseWeight desc
    const sortWithin = (qs: Question[]) =>
      qs.sort((a, b) => {
        const sigDiff = SIGNAL_PRIORITY.indexOf(a.interventionSignal) - SIGNAL_PRIORITY.indexOf(b.interventionSignal)
        if (sigDiff !== 0) return sigDiff
        return b.baseWeight - a.baseWeight
      })

    const signal = sortWithin(domainQs.filter(q => priorities.get(q.id) === 'signal'))
    const detail = sortWithin(domainQs.filter(q => priorities.get(q.id) === 'detail'))
    const depth = sortWithin(domainQs.filter(q => priorities.get(q.id) === 'depth'))

    signalIds.push(...signal.map(q => q.id))
    detailIds.push(...detail.map(q => q.id))
    depthIds.push(...depth.map(q => q.id))

    for (const q of domainQs) {
      priorityMap[q.id] = priorities.get(q.id) || 'depth'
    }
  }

  // Initial session: signal questions only
  return { signalIds, detailIds, depthIds, allIds: [...signalIds, ...detailIds, ...depthIds], priorityMap }
}

// ── Adaptive expansion logic ────────────────────────────────────

function evaluateDomainForExpansion(
  domain: Domain,
  answers: Array<{ questionId: string; rawScore: number }>,
  questionIds: string[]
): { needsExpansion: boolean; reason: string } {
  const domainAnswers = answers.filter(a => {
    const q = getQuestionById(a.questionId)
    return q?.domain === domain
  })

  if (domainAnswers.length < 3) {
    return { needsExpansion: false, reason: 'Not enough signal answers yet' }
  }

  const scores = domainAnswers.map(a => a.rawScore)
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length
  const variance = scores.reduce((s, v) => s + (v - avg) ** 2, 0) / scores.length

  // Diagnosis is clear — skip detail questions
  if (avg < 2.0) {
    return { needsExpansion: false, reason: `Low scores (avg ${avg.toFixed(1)}) — diagnosis clear, process gaps evident` }
  }
  if (avg > 4.0) {
    return { needsExpansion: false, reason: `High scores (avg ${avg.toFixed(1)}) — domain is mature, no deep dive needed` }
  }

  // Scores are mixed — need detail questions to understand why
  if (variance > 1.0) {
    return { needsExpansion: true, reason: `Mixed signals (variance ${variance.toFixed(1)}) — detail questions will clarify` }
  }

  // Moderate scores with low variance — signal is enough
  if (avg >= 2.0 && avg <= 4.0 && variance <= 1.0) {
    return { needsExpansion: false, reason: `Consistent moderate scores (avg ${avg.toFixed(1)}) — signal is sufficient` }
  }

  return { needsExpansion: false, reason: 'Default — signal sufficient' }
}

// ── Session metadata stored alongside questionIds ──────────────

type SessionMeta = {
  signalIds: string[]
  detailIds: string[]
  depthIds: string[]
  priorityMap: Record<string, QuestionPriority>
  expandedDomains: string[]
}

function buildQuestionsResponse(questionIds: string[]) {
  return questionIds.map(id => getQuestionById(id)).filter(Boolean)
}

// POST /api/engagements/:id/session/start
sessionRouter.post('/:id/session/start', async (req, res) => {
  const consultantId = req.auth!.consultantId
  const engagementId = req.params.id

  const engagement = await prisma.engagement.findFirst({
    where: { id: engagementId, consultantId },
    include: { session: true },
  })

  if (!engagement) {
    res.status(404).json({ data: null, error: 'Engagement not found' })
    return
  }

  // Idempotent: return existing active/paused session
  if (engagement.session && ['active', 'paused'].includes(engagement.session.status)) {
    const questionIds = JSON.parse(engagement.session.questionIds) as string[]
    const domainsInScope = JSON.parse(engagement.domainsInScope) as Domain[]
    const questions = buildQuestionsResponse(questionIds)

    // Parse meta if stored, or reconstruct
    let meta: SessionMeta | null = null
    try {
      const raw = (engagement.session as any).meta
      if (raw) meta = JSON.parse(raw)
    } catch {}

    res.json({
      data: {
        sessionId: engagement.session.id,
        questionIds,
        currentIndex: engagement.session.currentIndex,
        status: engagement.session.status,
        questions,
        domainsInScope,
        totalQuestions: questionIds.length,
        adaptive: meta ? {
          priorityMap: meta.priorityMap,
          expandedDomains: meta.expandedDomains,
          totalAvailable: meta.signalIds.length + meta.detailIds.length + meta.depthIds.length,
        } : null,
      },
    })
    return
  }

  if (engagement.status === 'complete') {
    res.status(400).json({ data: null, error: 'Engagement already complete' })
    return
  }

  const domainsInScope = JSON.parse(engagement.domainsInScope) as Domain[]
  const adaptive = generateAdaptiveQuestionOrder(domainsInScope)

  // Start with signal questions only
  const initialQuestionIds = adaptive.signalIds

  if (initialQuestionIds.length === 0) {
    res.status(400).json({ data: null, error: 'No questions found for selected domains' })
    return
  }

  const session = await prisma.session.create({
    data: {
      engagementId,
      questionIds: JSON.stringify(initialQuestionIds),
      currentIndex: 0,
      status: 'active',
    },
  })

  await prisma.engagement.update({
    where: { id: engagementId },
    data: { status: 'in_progress' },
  })

  const questions = buildQuestionsResponse(initialQuestionIds)

  res.status(201).json({
    data: {
      sessionId: session.id,
      questionIds: initialQuestionIds,
      currentIndex: 0,
      status: 'active',
      questions,
      domainsInScope,
      totalQuestions: initialQuestionIds.length,
      adaptive: {
        priorityMap: adaptive.priorityMap,
        expandedDomains: [],
        totalAvailable: adaptive.allIds.length,
      },
    },
  })
})

// POST /api/engagements/:id/session/expand-domain
// Called after signal questions for a domain are complete
// Evaluates whether detail questions should be added
sessionRouter.post('/:id/session/expand-domain', async (req, res) => {
  const consultantId = req.auth!.consultantId
  const engagementId = req.params.id
  const { domain, forceExpand } = req.body as { domain: Domain; forceExpand?: boolean }

  const engagement = await prisma.engagement.findFirst({
    where: { id: engagementId, consultantId },
    include: { session: true, answers: true },
  })

  if (!engagement?.session) {
    res.status(404).json({ data: null, error: 'Session not found' })
    return
  }

  const currentQuestionIds = JSON.parse(engagement.session.questionIds) as string[]
  const domainsInScope = JSON.parse(engagement.domainsInScope) as Domain[]

  const evaluation = evaluateDomainForExpansion(
    domain,
    engagement.answers.map((a: any) => ({ questionId: a.questionId, rawScore: a.rawScore })),
    currentQuestionIds
  )

  const shouldExpand = forceExpand || evaluation.needsExpansion

  if (shouldExpand) {
    // Add detail questions for this domain
    const allQuestions = loadQuestions()
    const priorities = assignPriority(allQuestions, domain)
    const detailQs = allQuestions
      .filter(q => q.domain === domain && priorities.get(q.id) === 'detail')
      .sort((a, b) => b.baseWeight - a.baseWeight)
      .map(q => q.id)

    // Insert detail questions after the last signal question for this domain
    const lastSignalIndex = currentQuestionIds.reduce((last, qid, i) => {
      const q = getQuestionById(qid)
      if (q?.domain === domain) return i
      return last
    }, -1)

    const expandedIds = [...currentQuestionIds]
    expandedIds.splice(lastSignalIndex + 1, 0, ...detailQs)

    await prisma.session.update({
      where: { id: engagement.session.id },
      data: { questionIds: JSON.stringify(expandedIds) },
    })

    const newQuestions = buildQuestionsResponse(detailQs)

    res.json({
      data: {
        expanded: true,
        reason: evaluation.reason,
        addedQuestions: newQuestions,
        addedCount: detailQs.length,
        newTotalQuestions: expandedIds.length,
        questionIds: expandedIds,
      },
    })
  } else {
    res.json({
      data: {
        expanded: false,
        reason: evaluation.reason,
        addedCount: 0,
        newTotalQuestions: currentQuestionIds.length,
        questionIds: currentQuestionIds,
      },
    })
  }
})

// POST /api/engagements/:id/session/pause
sessionRouter.post('/:id/session/pause', async (req, res) => {
  const consultantId = req.auth!.consultantId
  const engagementId = req.params.id

  const engagement = await prisma.engagement.findFirst({
    where: { id: engagementId, consultantId },
    include: { session: true },
  })

  if (!engagement?.session) {
    res.status(404).json({ data: null, error: 'Session not found' })
    return
  }

  const resumeToken = jwt.sign(
    { sessionId: engagement.session.id, engagementId },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  )

  await prisma.session.update({
    where: { id: engagement.session.id },
    data: {
      status: 'paused',
      pausedAt: new Date(),
      resumeToken,
    },
  })

  res.json({ data: { resumeToken } })
})

// GET /api/engagements/:id/session/resume
sessionRouter.get('/:id/session/resume', async (req, res) => {
  const consultantId = req.auth!.consultantId
  const engagementId = req.params.id

  const engagement = await prisma.engagement.findFirst({
    where: { id: engagementId, consultantId },
    include: { session: true, answers: true },
  })

  if (!engagement?.session) {
    res.status(404).json({ data: null, error: 'Session not found' })
    return
  }

  const questionIds = JSON.parse(engagement.session.questionIds) as string[]
  const answeredIds = new Set(engagement.answers.map((a: any) => a.questionId))

  let nextIndex = 0
  for (let i = 0; i < questionIds.length; i++) {
    if (!answeredIds.has(questionIds[i])) {
      nextIndex = i
      break
    }
    if (i === questionIds.length - 1) nextIndex = questionIds.length
  }

  const domainsInScope = JSON.parse(engagement.domainsInScope) as Domain[]
  const domainProgress: Record<string, { total: number; answered: number; runningScore: number }> = {}

  for (const domain of domainsInScope) {
    const domainQuestionIds = questionIds.filter((qid) => {
      const q = getQuestionById(qid)
      return q?.domain === domain
    })
    const domainAnswers = engagement.answers.filter((a: any) =>
      domainQuestionIds.includes(a.questionId)
    )
    const totalWeighted = domainAnswers.reduce((s: number, a: any) => s + a.weightedScore, 0)
    const maxPossible = domainQuestionIds.reduce((s, qid) => {
      const q = getQuestionById(qid)
      return s + (q ? 5 * q.baseWeight : 5)
    }, 0)

    domainProgress[domain] = {
      total: domainQuestionIds.length,
      answered: domainAnswers.length,
      runningScore: maxPossible > 0 ? Math.round((totalWeighted / maxPossible) * 100 * 10) / 10 : 0,
    }
  }

  if (engagement.session.status === 'paused') {
    await prisma.session.update({
      where: { id: engagement.session.id },
      data: { status: 'active', currentIndex: nextIndex },
    })
  }

  const questions = buildQuestionsResponse(questionIds)

  res.json({
    data: {
      sessionId: engagement.session.id,
      questionIds,
      currentIndex: nextIndex,
      status: engagement.session.status === 'paused' ? 'active' : engagement.session.status,
      questions,
      domainsInScope,
      answers: engagement.answers,
      domainProgress,
      totalQuestions: questionIds.length,
    },
  })
})

// POST /api/engagements/:id/session/complete
sessionRouter.post('/:id/session/complete', async (req, res) => {
  const consultantId = req.auth!.consultantId
  const engagementId = req.params.id

  const engagement = await prisma.engagement.findFirst({
    where: { id: engagementId, consultantId },
    include: { session: true },
  })

  if (!engagement?.session) {
    res.status(404).json({ data: null, error: 'Session not found' })
    return
  }

  const session = await prisma.session.update({
    where: { id: engagement.session.id },
    data: { status: 'complete', completedAt: new Date() },
  })

  await prisma.engagement.update({
    where: { id: engagementId },
    data: { status: 'complete' },
  })

  res.json({ data: { session } })
})
