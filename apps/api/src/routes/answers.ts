import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth'
import { getQuestionById, loadQuestions } from '@mindssparc/question-bank'
import type { ConfidenceLevel, InterventionType, Domain } from '@mindssparc/shared-types'
import { CONFIDENCE_MULTIPLIERS } from '@mindssparc/shared-types'

const prisma = new PrismaClient()
export const answersRouter = Router()

answersRouter.use(authMiddleware)

const MATURITY_BANDS = [
  { min: 0, max: 20, label: 'Foundational' },
  { min: 20, max: 40, label: 'Emerging' },
  { min: 40, max: 60, label: 'Developing' },
  { min: 60, max: 80, label: 'Advanced' },
  { min: 80, max: 101, label: 'Leading' },
]

function getMaturityBand(score: number): string {
  return MATURITY_BANDS.find((b) => score >= b.min && score < b.max)?.label ?? 'Foundational'
}

function getInterventionWeightMultiplier(
  signal: InterventionType,
  weights: { process: number; automation: number; analytics: number; ai: number }
): number {
  let raw: number
  switch (signal) {
    case 'PROCESS':
      raw = weights.process
      break
    case 'DIGITIZE':
    case 'INTEGRATE':
    case 'AUTOMATE':
      raw = weights.automation
      break
    case 'ANALYTICS':
      raw = weights.analytics
      break
    case 'AI':
      raw = weights.ai
      break
    default:
      raw = 25
  }
  // Normalise to 0.8–1.2 range: 0% → 0.8, 100% → 1.2
  return 0.8 + (raw / 100) * 0.4
}

// POST /api/engagements/:id/answers
answersRouter.post('/:id/answers', async (req, res) => {
  const consultantId = req.auth!.consultantId
  const engagementId = req.params.id

  const engagement = await prisma.engagement.findFirst({
    where: { id: engagementId, consultantId },
  })

  if (!engagement) {
    res.status(404).json({ data: null, error: 'Engagement not found' })
    return
  }

  const { questionId, rawScore, confidence, notes } = req.body

  if (!questionId || !rawScore || rawScore < 1 || rawScore > 5) {
    res.status(400).json({ data: null, error: 'questionId and rawScore (1-5) required' })
    return
  }

  const question = getQuestionById(questionId)
  if (!question) {
    res.status(400).json({ data: null, error: `Question ${questionId} not found` })
    return
  }

  const conf = (confidence || 'medium') as ConfidenceLevel
  const interventionWeights = JSON.parse(engagement.interventionWeights)
  const iwMultiplier = getInterventionWeightMultiplier(question.interventionSignal, interventionWeights)
  const confMultiplier = CONFIDENCE_MULTIPLIERS[conf]

  const weightedScore = Math.round(rawScore * confMultiplier * question.baseWeight * iwMultiplier * 100) / 100

  // Upsert: update if exists, create if not
  const answer = await prisma.answer.upsert({
    where: {
      engagementId_questionId: { engagementId, questionId },
    },
    update: {
      rawScore,
      confidence: conf,
      notes: notes ?? null,
      weightedScore,
      timestamp: new Date(),
    },
    create: {
      engagementId,
      questionId,
      rawScore,
      confidence: conf,
      notes: notes ?? null,
      weightedScore,
    },
  })

  // Compute running domain score
  const domain = question.domain
  const session = await prisma.session.findUnique({ where: { engagementId } })
  let runningDomainScore = 0
  if (session) {
    const allQids = JSON.parse(session.questionIds) as string[]
    const domainQids = allQids.filter((qid) => {
      const q = getQuestionById(qid)
      return q?.domain === domain
    })
    const domainAnswers = await prisma.answer.findMany({
      where: { engagementId, questionId: { in: domainQids } },
    })
    const totalWeighted = domainAnswers.reduce((s, a) => s + a.weightedScore, 0)
    const maxPossible = domainQids.reduce((s, qid) => {
      const q = getQuestionById(qid)
      const qIwMultiplier = q ? getInterventionWeightMultiplier(q.interventionSignal, interventionWeights) : 1
      return s + 5 * (q?.baseWeight ?? 1) * 1.0 * qIwMultiplier
    }, 0)
    runningDomainScore = maxPossible > 0 ? Math.round((totalWeighted / maxPossible) * 100 * 10) / 10 : 0
  }

  const maturityBand = getMaturityBand(runningDomainScore)

  // Update session current index
  if (session) {
    const qids = JSON.parse(session.questionIds) as string[]
    const idx = qids.indexOf(questionId)
    if (idx >= 0 && idx >= session.currentIndex) {
      await prisma.session.update({
        where: { id: session.id },
        data: { currentIndex: idx + 1 },
      })
    }
  }

  res.json({
    data: {
      answer,
      runningDomainScore,
      currentDomainMaturityBand: maturityBand,
    },
  })
})

// GET /api/engagements/:id/answers
answersRouter.get('/:id/answers', async (req, res) => {
  const consultantId = req.auth!.consultantId
  const engagementId = req.params.id

  const engagement = await prisma.engagement.findFirst({
    where: { id: engagementId, consultantId },
  })
  if (!engagement) {
    res.status(404).json({ data: null, error: 'Engagement not found' })
    return
  }

  const answers = await prisma.answer.findMany({
    where: { engagementId },
    orderBy: { timestamp: 'asc' },
  })

  // Join with question data
  const items = answers.map((a) => {
    const q = getQuestionById(a.questionId)
    return {
      ...a,
      question: q ? { id: q.id, text: q.text, domain: q.domain, capabilityArea: q.capabilityArea } : null,
    }
  })

  res.json({ data: { items, total: items.length } })
})

// GET /api/engagements/:id/progress
answersRouter.get('/:id/progress', async (req, res) => {
  const consultantId = req.auth!.consultantId
  const engagementId = req.params.id

  const engagement = await prisma.engagement.findFirst({
    where: { id: engagementId, consultantId },
    include: { session: true, answers: true },
  })
  if (!engagement) {
    res.status(404).json({ data: null, error: 'Engagement not found' })
    return
  }
  if (!engagement.session) {
    res.status(404).json({ data: null, error: 'No session started' })
    return
  }

  const questionIds = JSON.parse(engagement.session.questionIds) as string[]
  const domainsInScope = JSON.parse(engagement.domainsInScope) as Domain[]
  const interventionWeights = JSON.parse(engagement.interventionWeights)
  const answeredIds = new Set(engagement.answers.map((a) => a.questionId))

  const domainProgress: Record<string, { total: number; answered: number; runningScore: number; maturityBand: string }> = {}

  for (const domain of domainsInScope) {
    const domainQids = questionIds.filter((qid) => {
      const q = getQuestionById(qid)
      return q?.domain === domain
    })
    const domainAnswers = engagement.answers.filter((a) => domainQids.includes(a.questionId))
    const totalWeighted = domainAnswers.reduce((s, a) => s + a.weightedScore, 0)
    const maxPossible = domainQids.reduce((s, qid) => {
      const q = getQuestionById(qid)
      const iwm = q ? getInterventionWeightMultiplier(q.interventionSignal, interventionWeights) : 1
      return s + 5 * (q?.baseWeight ?? 1) * 1.0 * iwm
    }, 0)
    const score = maxPossible > 0 ? Math.round((totalWeighted / maxPossible) * 100 * 10) / 10 : 0

    domainProgress[domain] = {
      total: domainQids.length,
      answered: domainAnswers.length,
      runningScore: score,
      maturityBand: getMaturityBand(score),
    }
  }

  const totalQuestions = questionIds.length
  const answeredQuestions = engagement.answers.length

  res.json({
    data: {
      totalQuestions,
      answeredQuestions,
      percentComplete: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
      domainProgress,
      estimatedMinutesRemaining: Math.round((totalQuestions - answeredQuestions) * 1.5),
    },
  })
})
