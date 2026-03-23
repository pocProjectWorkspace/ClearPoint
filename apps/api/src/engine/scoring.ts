import type { Domain, InterventionType, InterventionWeights, ConfidenceLevel } from '@mindssparc/shared-types'
import { CONFIDENCE_MULTIPLIERS, MATURITY_BANDS } from '@mindssparc/shared-types'
import type { Question } from '@mindssparc/shared-types'

// Answer shape from DB (Prisma)
type AnswerRow = {
  questionId: string
  rawScore: number
  confidence: string
  weightedScore: number
  notes?: string | null
}

export function getInterventionWeightMultiplier(
  signal: InterventionType,
  weights: InterventionWeights
): number {
  let raw: number
  switch (signal) {
    case 'PROCESS': raw = weights.process; break
    case 'DIGITIZE': case 'INTEGRATE': case 'AUTOMATE': raw = weights.automation; break
    case 'ANALYTICS': raw = weights.analytics; break
    case 'AI': raw = weights.ai; break
    default: raw = 25
  }
  return 0.8 + (raw / 100) * 0.4
}

export function calculateWeightedScore(
  rawScore: number,
  confidence: ConfidenceLevel,
  baseWeight: number,
  signal: InterventionType,
  weights: InterventionWeights
): number {
  const confMult = CONFIDENCE_MULTIPLIERS[confidence]
  const iwMult = getInterventionWeightMultiplier(signal, weights)
  return Math.round(rawScore * confMult * baseWeight * iwMult * 100) / 100
}

export function getMaturityBand(score: number): string {
  if (score >= 80) return 'Leading'
  if (score >= 60) return 'Advanced'
  if (score >= 40) return 'Developing'
  if (score >= 20) return 'Emerging'
  return 'Foundational'
}

export type DomainScoreResult = {
  domain: Domain
  score: number           // 0-100, 1 decimal
  maturityBand: string
  questionCount: number
  answeredCount: number
  breakdown: {
    byInterventionType: Record<string, { score: number; count: number }>
    byCapabilityArea: Record<string, { score: number; count: number }>
    highestScoring: Array<{ questionId: string; score: number; text: string }>
    lowestScoring: Array<{ questionId: string; score: number; text: string }>
  }
}

export function calculateDomainScore(
  domain: Domain,
  answers: AnswerRow[],
  questions: Question[],
  weights: InterventionWeights
): DomainScoreResult {
  const domainQuestions = questions.filter(q => q.domain === domain)
  if (domainQuestions.length === 0) {
    return {
      domain, score: 0, maturityBand: 'Foundational',
      questionCount: 0, answeredCount: 0,
      breakdown: { byInterventionType: {}, byCapabilityArea: {}, highestScoring: [], lowestScoring: [] }
    }
  }

  const answerMap = new Map(answers.map(a => [a.questionId, a]))
  let totalWeighted = 0
  let totalMaxPossible = 0

  const questionScores: Array<{ questionId: string; score: number; text: string; signal: InterventionType; capability: string }> = []

  for (const q of domainQuestions) {
    const iwMult = getInterventionWeightMultiplier(q.interventionSignal, weights)
    const maxPossible = 5 * q.baseWeight * 1.0 * iwMult  // max rawScore=5, confidence=high(1.0)
    totalMaxPossible += maxPossible

    const ans = answerMap.get(q.id)
    if (ans) {
      totalWeighted += ans.weightedScore
      questionScores.push({
        questionId: q.id,
        score: ans.weightedScore,
        text: q.text,
        signal: q.interventionSignal,
        capability: q.capabilityArea,
      })
    }
  }

  const score = totalMaxPossible > 0 ? Math.round((totalWeighted / totalMaxPossible) * 100 * 10) / 10 : 0

  // Breakdown by intervention type
  const byInterventionType: Record<string, { score: number; count: number }> = {}
  for (const qs of questionScores) {
    if (!byInterventionType[qs.signal]) byInterventionType[qs.signal] = { score: 0, count: 0 }
    byInterventionType[qs.signal].score += qs.score
    byInterventionType[qs.signal].count += 1
  }

  // Breakdown by capability area
  const byCapabilityArea: Record<string, { score: number; count: number }> = {}
  for (const qs of questionScores) {
    if (!byCapabilityArea[qs.capability]) byCapabilityArea[qs.capability] = { score: 0, count: 0 }
    byCapabilityArea[qs.capability].score += qs.score
    byCapabilityArea[qs.capability].count += 1
  }

  // Top 3 highest and bottom 3 lowest
  const sorted = [...questionScores].sort((a, b) => b.score - a.score)
  const highestScoring = sorted.slice(0, 3).map(s => ({ questionId: s.questionId, score: s.score, text: s.text }))
  const lowestScoring = sorted.slice(-3).reverse().map(s => ({ questionId: s.questionId, score: s.score, text: s.text }))

  return {
    domain,
    score,
    maturityBand: getMaturityBand(score),
    questionCount: domainQuestions.length,
    answeredCount: questionScores.length,
    breakdown: { byInterventionType, byCapabilityArea, highestScoring, lowestScoring },
  }
}

export type InterventionMapEntryResult = {
  domain: Domain
  interventionType: InterventionType
  score: number
  questionCount: number
}

export function calculateInterventionTierScores(
  domainScores: DomainScoreResult[],
  answers: AnswerRow[],
  questions: Question[],
  weights: InterventionWeights
): InterventionMapEntryResult[] {
  const entries: InterventionMapEntryResult[] = []
  const signals: InterventionType[] = ['PROCESS', 'DIGITIZE', 'INTEGRATE', 'AUTOMATE', 'ANALYTICS', 'AI']
  const answerMap = new Map(answers.map(a => [a.questionId, a]))

  for (const ds of domainScores) {
    const domainQs = questions.filter(q => q.domain === ds.domain)
    for (const signal of signals) {
      const signalQs = domainQs.filter(q => q.interventionSignal === signal)
      if (signalQs.length === 0) continue

      let totalWeighted = 0
      let totalMax = 0
      for (const q of signalQs) {
        const iwm = getInterventionWeightMultiplier(q.interventionSignal, weights)
        totalMax += 5 * q.baseWeight * 1.0 * iwm
        const ans = answerMap.get(q.id)
        if (ans) totalWeighted += ans.weightedScore
      }

      entries.push({
        domain: ds.domain,
        interventionType: signal,
        score: totalMax > 0 ? Math.round((totalWeighted / totalMax) * 100 * 10) / 10 : 0,
        questionCount: signalQs.length,
      })
    }
  }

  return entries
}
