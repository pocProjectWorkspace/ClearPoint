import { CONFIDENCE_MULTIPLIERS, MATURITY_BANDS } from '@mindssparc/shared-types'
import type { ConfidenceLevel, MaturityBand } from '@mindssparc/shared-types'

export function computeWeightedScore(
  rawScore: number,
  confidence: ConfidenceLevel,
  baseWeight: number
): number {
  return rawScore * CONFIDENCE_MULTIPLIERS[confidence] * baseWeight
}

export function percentageToMaturityBand(pct: number): MaturityBand {
  const band = MATURITY_BANDS.find((b) => pct >= b.min && pct < b.max)
  return band?.band ?? 'nascent'
}

export function formatScore(score: number): string {
  return score.toFixed(1)
}
