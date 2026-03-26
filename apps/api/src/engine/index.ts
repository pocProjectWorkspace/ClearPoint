import { PrismaClient } from '@prisma/client'
import { loadQuestions } from '@mindssparc/question-bank'
import type { Domain, InterventionWeights, MaturityBand } from '@mindssparc/shared-types'
import { calculateDomainScore, calculateInterventionTierScores } from './scoring'
import type { DomainScoreResult } from './scoring'
import { matchPatterns } from './patternMatcher'
import type { PatternMatchResult } from './patternMatcher'
import { generateRootCauses } from './rootCauseGenerator'
import { buildRoadmap } from './roadmapBuilder'
import { calculateBusinessCase } from './businessCase'
import type { BusinessCaseResult } from './businessCase'
import { generateReasoningLog } from './reasoningLog'

const prisma = new PrismaClient()

// ── Transform engine types to shared frontend types ──────────────

const MATURITY_BAND_MAP: Record<string, MaturityBand> = {
  'Leading': 'leading',
  'Advanced': 'advanced',
  'Developing': 'established',
  'Emerging': 'developing',
  'Foundational': 'nascent',
}

function transformDomainScores(scores: DomainScoreResult[]) {
  return scores.map(ds => ({
    domain: ds.domain,
    rawScore: ds.score,
    weightedScore: ds.score,
    maxPossible: 100,
    percentage: ds.score,
    maturityBand: MATURITY_BAND_MAP[ds.maturityBand] || 'nascent',
    questionCount: ds.questionCount,
    answeredCount: ds.answeredCount,
    breakdown: ds.breakdown,
  }))
}

function transformPatterns(patterns: PatternMatchResult[]) {
  return patterns.map(p => ({
    patternId: p.ruleId,
    patternName: p.ruleName,
    fired: p.fired,
    evidenceQuestionIds: p.evidenceQuestionIds,
    severity: p.severity,
    description: p.description,
    confidence: p.confidence,
    contrastDelta: p.contrastDelta,
    diagnosis: p.diagnosis,
    recommendedActions: p.recommendedActions,
    explanationTemplate: p.explanationTemplate,
    evidenceScores: p.evidenceScores,
  }))
}

function transformBusinessCase(bc: BusinessCaseResult) {
  return {
    problemCost: bc.totalProblemCost,
    tier01Value: bc.valueByTier.tier01,
    tier2Value: bc.valueByTier.tier2,
    tier3Value: bc.valueByTier.tier3 + bc.valueByTier.tier4,
    totalValue: bc.totalValue,
    conservative12Month: bc.conservative12Month,
    realistic24Month: bc.realistic24Month,
    priorityScores: bc.prioritizedInitiatives.map(pi => ({
      roadmapItemId: pi.roadmapItemId,
      revenueImpact: 0,
      feasibility: 0,
      dataReadiness: 0,
      timeToValue: 0,
      crossDomainReuse: 0,
      totalScore: pi.priorityScore,
    })),
    problemCostByDomain: bc.problemCostByDomain,
    formulaInputs: bc.formulaInputs,
  }
}

export type DiagnosticOutput = {
  engagementId: string
  domainScores: ReturnType<typeof transformDomainScores>
  patterns: ReturnType<typeof transformPatterns>
  rootCauses: ReturnType<typeof generateRootCauses>
  interventionMap: ReturnType<typeof calculateInterventionTierScores>
  roadmap: ReturnType<typeof buildRoadmap>
  businessCase: ReturnType<typeof transformBusinessCase>
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
  const rawDomainScores = domainsInScope.map(domain =>
    calculateDomainScore(domain, answers, allQuestions, interventionWeights)
  )

  // 4. Intervention map
  const interventionMap = calculateInterventionTierScores(rawDomainScores, answers, allQuestions, interventionWeights)

  // 5. Pattern matching
  const rawPatterns = matchPatterns(answers)

  // 6. Root causes
  const rootCauses = generateRootCauses(rawPatterns, {
    confidenceLevel: engagement.confidenceLevel,
  })

  // 7. Roadmap
  const roadmap = buildRoadmap(rootCauses, {
    industry: engagement.industry,
    companySize: engagement.companySize,
  })

  // 8. Business case
  const rawBusinessCase = calculateBusinessCase(rawDomainScores, roadmap, {
    revenueRange: engagement.revenueRange,
    interventionWeights,
    domainsInScope,
  })

  // 9. Reasoning log
  const reasoningLog = await generateReasoningLog(
    rawDomainScores,
    rawPatterns,
    rootCauses,
    roadmap,
    rawBusinessCase,
    answers,
    {
      industry: engagement.industry,
      companySize: engagement.companySize,
      domainsInScope: domainsInScope as string[],
      clientName: engagement.clientName,
    }
  )

  // 10. Transform to frontend-expected shapes
  const domainScores = transformDomainScores(rawDomainScores)
  const patterns = transformPatterns(rawPatterns)
  const businessCase = transformBusinessCase(rawBusinessCase)

  const generatedAt = new Date()

  // 11. Save to DB (upsert) — save transformed shapes
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
