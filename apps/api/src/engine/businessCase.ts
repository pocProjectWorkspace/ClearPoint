import type { InterventionWeights, Domain } from '@mindssparc/shared-types'
import type { DomainScoreResult } from './scoring'
import type { RoadmapItemResult } from './roadmapBuilder'

type EngagementLike = {
  revenueRange: string
  interventionWeights: InterventionWeights
  domainsInScope: Domain[]
}

const REVENUE_MIDPOINTS: Record<string, number> = {
  'under_1m': 0.5,
  '1m_10m': 5,
  '10m_50m': 30,
  '50m_200m': 125,
  '200m_1b': 350,
  'over_1b': 750,
}

const DOMAIN_RISK_PCT: Record<string, number> = {
  CRV: 0.18, MKT: 0.12, SVC: 0.15, OPS: 0.20,
  PPL: 0.08, FIN: 0.10, TEC: 0.10, PRD: 0.12,
}

function problemIntensityFactor(score: number): number {
  if (score < 20) return 1.0
  if (score < 40) return 0.8
  if (score < 60) return 0.6
  if (score < 80) return 0.3
  return 0.1
}

const FEASIBILITY_SCORES: Record<string, number> = {
  PROCESS: 80, DIGITIZE: 75, INTEGRATE: 60, AUTOMATE: 60, ANALYTICS: 50, AI: 30,
}

export type BusinessCaseResult = {
  problemCostByDomain: Record<string, number>
  totalProblemCost: number
  valueByTier: { tier01: number; tier2: number; tier3: number; tier4: number }
  totalValue: number
  conservative12Month: number
  realistic24Month: number
  prioritizedInitiatives: Array<{ roadmapItemId: string; priorityScore: number; rank: number }>
  formulaInputs: {
    revenueMidpoint: number
    revenueRange: string
    interventionWeights: InterventionWeights
  }
}

export function calculateBusinessCase(
  domainScores: DomainScoreResult[],
  roadmap: RoadmapItemResult[],
  engagement: EngagementLike
): BusinessCaseResult {
  const revenueMidpoint = REVENUE_MIDPOINTS[engagement.revenueRange] || 125
  const weights = engagement.interventionWeights

  // Problem cost per domain
  const problemCostByDomain: Record<string, number> = {}
  let totalProblemCost = 0

  for (const ds of domainScores) {
    const riskPct = DOMAIN_RISK_PCT[ds.domain] || 0.10
    const intensity = problemIntensityFactor(ds.score)
    const cost = revenueMidpoint * riskPct * intensity
    problemCostByDomain[ds.domain] = Math.round(cost * 100) / 100
    totalProblemCost += cost
  }

  totalProblemCost = Math.round(totalProblemCost * 100) / 100

  // Value by tier
  const tier01 = totalProblemCost * 0.25
  const tier2 = totalProblemCost * 0.35
  const tier3 = totalProblemCost * 0.15
  const tier4 = totalProblemCost * 0.25 * (weights.ai / 100)

  const totalValue = Math.round((tier01 + tier2 + tier3 + tier4) * 100) / 100
  const conservative12Month = Math.round(totalValue * 0.65 * 100) / 100
  const realistic24Month = Math.round(totalValue * 1.30 * 100) / 100

  // Priority scoring per roadmap item
  const avgDomainScore = domainScores.length > 0
    ? domainScores.reduce((s, d) => s + d.score, 0) / domainScores.length
    : 0

  const prioritizedInitiatives = roadmap.map(item => {
    const revenueImpact = totalValue > 0
      ? ((item.phase === 30 ? tier01 : item.phase === 60 ? tier2 : tier3 + tier4) / totalValue) * 100
      : 0
    const feasibility = FEASIBILITY_SCORES[item.interventionType] || 50
    const dataReadiness = avgDomainScore
    const timeToValue = item.phase === 30 ? 90 : item.phase === 60 ? 60 : 30
    const uniqueDomains = new Set(item.rootCauseIds).size
    const crossDomainReuse = Math.min(uniqueDomains * 25, 100)

    const priorityScore = Math.round(
      revenueImpact * 0.40 + feasibility * 0.25 + dataReadiness * 0.15 +
      timeToValue * 0.10 + crossDomainReuse * 0.10
    )

    return { roadmapItemId: item.id, priorityScore, rank: 0 }
  })

  // Assign ranks
  prioritizedInitiatives.sort((a, b) => b.priorityScore - a.priorityScore)
  prioritizedInitiatives.forEach((item, i) => { item.rank = i + 1 })

  return {
    problemCostByDomain,
    totalProblemCost,
    valueByTier: {
      tier01: Math.round(tier01 * 100) / 100,
      tier2: Math.round(tier2 * 100) / 100,
      tier3: Math.round(tier3 * 100) / 100,
      tier4: Math.round(tier4 * 100) / 100,
    },
    totalValue,
    conservative12Month,
    realistic24Month,
    prioritizedInitiatives,
    formulaInputs: {
      revenueMidpoint,
      revenueRange: engagement.revenueRange,
      interventionWeights: weights,
    },
  }
}
