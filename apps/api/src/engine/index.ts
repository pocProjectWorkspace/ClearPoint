import { PrismaClient } from '@prisma/client'
import { loadQuestions } from '@mindssparc/question-bank'
import type { Domain, InterventionWeights } from '@mindssparc/shared-types'
import { calculateDomainScore, calculateInterventionTierScores } from './scoring'
import { matchPatterns } from './patternMatcher'
import { generateRootCauses } from './rootCauseGenerator'
import { buildRoadmap } from './roadmapBuilder'
import { calculateBusinessCase } from './businessCase'
import { generateReasoningLog } from './reasoningLog'

const prisma = new PrismaClient()

export type DiagnosticOutput = {
  engagementId: string
  domainScores: ReturnType<typeof calculateDomainScore>[]
  patterns: ReturnType<typeof matchPatterns>
  rootCauses: ReturnType<typeof generateRootCauses>
  interventionMap: ReturnType<typeof calculateInterventionTierScores>
  roadmap: ReturnType<typeof buildRoadmap>
  businessCase: ReturnType<typeof calculateBusinessCase>
  reasoningLog: Awaited<ReturnType<typeof generateReasoningLog>>
  generatedAt: string
}

export async function runDiagnostic(
  engagementId: string,
  consultantId: string,
  forceRerun = false
): Promise<DiagnosticOutput> {
  const startTime = Date.now()

  // Check for cached result
  if (!forceRerun) {
    const cached = await prisma.diagnosticResult.findUnique({ where: { engagementId } })
    if (cached) {
      console.log(`Returning cached diagnostic for ${engagementId}`)
      return {
        engagementId,
        domainScores: JSON.parse(cached.domainScores),
        patterns: JSON.parse(cached.patterns),
        rootCauses: JSON.parse(cached.rootCauses),
        interventionMap: JSON.parse(cached.interventionMap),
        roadmap: JSON.parse(cached.roadmap),
        businessCase: JSON.parse(cached.businessCase),
        reasoningLog: JSON.parse(cached.reasoningLog),
        generatedAt: cached.generatedAt.toISOString(),
      }
    }
  }

  // 1. Load engagement + answers
  const engagement = await prisma.engagement.findFirst({
    where: { id: engagementId, consultantId },
    include: { answers: true, session: true },
  })

  if (!engagement) throw new Error('Engagement not found')
  if (engagement.answers.length === 0) throw new Error('No answers recorded — cannot run diagnostic')

  const domainsInScope = JSON.parse(engagement.domainsInScope) as Domain[]
  const interventionWeights = JSON.parse(engagement.interventionWeights) as InterventionWeights
  const allQuestions = loadQuestions()
  const answers = engagement.answers.map(a => ({
    questionId: a.questionId,
    rawScore: a.rawScore,
    confidence: a.confidence,
    weightedScore: a.weightedScore,
    notes: a.notes,
  }))

  // 2. Warn for domains with < 50% answered
  for (const domain of domainsInScope) {
    const domainQs = allQuestions.filter(q => q.domain === domain)
    const domainAnswers = answers.filter(a => domainQs.some(q => q.id === a.questionId))
    if (domainQs.length > 0 && domainAnswers.length < domainQs.length * 0.5) {
      console.warn(`Warning: ${domain} has only ${domainAnswers.length}/${domainQs.length} questions answered (< 50%)`)
    }
  }

  // 3. Scoring
  const domainScores = domainsInScope.map(domain =>
    calculateDomainScore(domain, answers, allQuestions, interventionWeights)
  )

  // 4. Intervention map
  const interventionMap = calculateInterventionTierScores(domainScores, answers, allQuestions, interventionWeights)

  // 5. Pattern matching
  const patterns = matchPatterns(answers)

  // 6. Root causes
  const rootCauses = generateRootCauses(patterns, {
    confidenceLevel: engagement.confidenceLevel,
  })

  // 7. Roadmap
  const roadmap = buildRoadmap(rootCauses, {
    industry: engagement.industry,
    companySize: engagement.companySize,
  })

  // 8. Business case
  const businessCase = calculateBusinessCase(domainScores, roadmap, {
    revenueRange: engagement.revenueRange,
    interventionWeights,
    domainsInScope,
  })

  // 9. Reasoning log
  const reasoningLog = await generateReasoningLog(
    domainScores,
    patterns,
    rootCauses,
    roadmap,
    businessCase,
    answers,
    {
      industry: engagement.industry,
      companySize: engagement.companySize,
      domainsInScope: domainsInScope as string[],
      clientName: engagement.clientName,
    }
  )

  const generatedAt = new Date()

  // 10. Save to DB (upsert)
  await prisma.diagnosticResult.upsert({
    where: { engagementId },
    update: {
      domainScores: JSON.stringify(domainScores),
      patterns: JSON.stringify(patterns),
      rootCauses: JSON.stringify(rootCauses),
      interventionMap: JSON.stringify(interventionMap),
      roadmap: JSON.stringify(roadmap),
      businessCase: JSON.stringify(businessCase),
      reasoningLog: JSON.stringify(reasoningLog),
      generatedAt,
    },
    create: {
      engagementId,
      domainScores: JSON.stringify(domainScores),
      patterns: JSON.stringify(patterns),
      rootCauses: JSON.stringify(rootCauses),
      interventionMap: JSON.stringify(interventionMap),
      roadmap: JSON.stringify(roadmap),
      businessCase: JSON.stringify(businessCase),
      reasoningLog: JSON.stringify(reasoningLog),
      generatedAt,
    },
  })

  const elapsed = Date.now() - startTime
  console.log(`Diagnostic completed for ${engagementId} in ${elapsed}ms`)

  return {
    engagementId,
    domainScores,
    patterns,
    rootCauses,
    interventionMap,
    roadmap,
    businessCase,
    reasoningLog,
    generatedAt: generatedAt.toISOString(),
  }
}
