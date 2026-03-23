// ── Domain & Enums ──────────────────────────────────────────────

export type Domain = 'CRV' | 'MKT' | 'SVC' | 'OPS' | 'PPL' | 'FIN' | 'TEC' | 'PRD'

export type Industry =
  | 'technology'
  | 'financial_services'
  | 'healthcare'
  | 'manufacturing'
  | 'retail'
  | 'energy'
  | 'telecommunications'
  | 'professional_services'
  | 'government'
  | 'education'
  | 'other'

export type CompanySize =
  | 'startup'       // < 50 employees
  | 'small'         // 50–200
  | 'mid_market'    // 200–1000
  | 'enterprise'    // 1000–10000
  | 'large_enterprise' // 10000+

export type RevenueRange =
  | 'under_1m'
  | '1m_10m'
  | '10m_50m'
  | '50m_200m'
  | '200m_1b'
  | 'over_1b'

export type InterventionType = 'PROCESS' | 'DIGITIZE' | 'INTEGRATE' | 'AUTOMATE' | 'ANALYTICS' | 'AI'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export type Severity = 'critical' | 'high' | 'medium' | 'low'

export type EngagementStatus = 'setup' | 'in_progress' | 'complete'

export type RoadmapPhase = 30 | 60 | 90

export type EffortEstimate = 'days' | 'weeks' | 'months'

// ── Intervention Weights ────────────────────────────────────────

export type InterventionWeights = {
  process: number
  automation: number
  analytics: number
  ai: number
}

// ── Ambition Targets ────────────────────────────────────────────

export type AmbitionTargets = {
  costReductionPct: number
  productivityGainPct: number
  revenueImpactPct: number
  customMetric?: string
  customTarget?: number
}

// ── Engagement ──────────────────────────────────────────────────

export type Engagement = {
  id: string
  clientName: string
  industry: Industry
  companySize: CompanySize
  revenueRange: RevenueRange
  geography: string
  strategicPriorities: string
  consultantHypothesis: string
  confidenceLevel: ConfidenceLevel
  domainsInScope: Domain[]
  interventionWeights: InterventionWeights
  ambitionTargets: AmbitionTargets
  status: EngagementStatus
  createdAt: Date
  updatedAt: Date
}

// ── Question Bank ───────────────────────────────────────────────

export type ScaleAnchor = {
  value: 1 | 2 | 3 | 4 | 5
  label: string
  description: string
}

export type Question = {
  id: string
  text: string
  preAnswerContext: string
  domain: Domain
  capabilityArea: string
  interventionSignal: InterventionType
  diagnosticPatterns: string[]
  baseWeight: number
  anchors: ScaleAnchor[]
}

// ── Answer ──────────────────────────────────────────────────────

export type Answer = {
  engagementId: string
  questionId: string
  rawScore: 1 | 2 | 3 | 4 | 5
  confidence: ConfidenceLevel
  notes?: string
  weightedScore: number
  timestamp: Date
}

// ── Diagnostic Result ───────────────────────────────────────────

export type DomainScore = {
  domain: Domain
  rawScore: number
  weightedScore: number
  maxPossible: number
  percentage: number
  maturityBand: MaturityBand
  questionCount: number
}

export type MaturityBand = 'nascent' | 'developing' | 'established' | 'advanced' | 'leading'

export type PatternMatch = {
  patternId: string
  patternName: string
  fired: boolean
  evidenceQuestionIds: string[]
  severity: Severity
  description: string
}

export type RootCause = {
  id: string
  name: string
  description: string
  domain: Domain
  severity: Severity
  evidenceQuestionIds: string[]
  evidencePattern: string
  recommendedInterventionTier: InterventionType
  prevalence?: string
}

export type RoadmapItem = {
  id: string
  phase: RoadmapPhase
  title: string
  description: string
  rootCauseIds: string[]
  questionIds: string[]
  interventionType: InterventionType
  estimatedEffort: EffortEstimate
  expectedOutcome: string
  prerequisiteIds: string[]
}

export type InterventionMapEntry = {
  domain: Domain
  interventionType: InterventionType
  score: number
  intensity: 'none' | 'low' | 'medium' | 'high' | 'critical'
}

export type BusinessCase = {
  problemCost: number
  tier01Value: number
  tier2Value: number
  tier3Value: number
  totalValue: number
  conservative12Month: number
  realistic24Month: number
  priorityScores: PriorityScore[]
}

export type PriorityScore = {
  roadmapItemId: string
  revenueImpact: number
  feasibility: number
  dataReadiness: number
  timeToValue: number
  crossDomainReuse: number
  totalScore: number
}

export type ReasoningEntry = {
  outputType: 'score' | 'pattern' | 'rootCause' | 'roadmapItem' | 'businessCase'
  outputId: string
  explanation: string
  contributingFactors: ContributingFactor[]
}

export type ContributingFactor = {
  questionId?: string
  patternId?: string
  weight: number
  direction: 'positive' | 'negative'
  description: string
}

export type DiagnosticResult = {
  engagementId: string
  domainScores: DomainScore[]
  patterns: PatternMatch[]
  rootCauses: RootCause[]
  interventionMap: InterventionMapEntry[]
  roadmap: RoadmapItem[]
  businessCase: BusinessCase
  reasoningLog: ReasoningEntry[]
  generatedAt: Date
}

// ── Diagnostic Rule (for rules package) ─────────────────────────

export type TriggerCondition = {
  questionIds: string[]
  operator: 'AND' | 'OR' | 'AVG_BELOW' | 'CONTRAST'
  threshold?: number
  contrastGroup?: string[]
}

export type DiagnosticRule = {
  id: string
  name: string
  description: string
  triggerConditions: TriggerCondition[]
  firesWhen: string
  diagnosis: string
  severity: Severity
  recommendedActions: string[]
  explanationTemplate: string
}

// ── Confidence Multipliers ──────────────────────────────────────

export const CONFIDENCE_MULTIPLIERS: Record<ConfidenceLevel, number> = {
  high: 1.0,
  medium: 0.85,
  low: 0.70,
}

// ── Maturity Band Thresholds ────────────────────────────────────

export const MATURITY_BANDS: { band: MaturityBand; min: number; max: number }[] = [
  { band: 'nascent', min: 0, max: 20 },
  { band: 'developing', min: 20, max: 40 },
  { band: 'established', min: 40, max: 60 },
  { band: 'advanced', min: 60, max: 80 },
  { band: 'leading', min: 80, max: 100 },
]

// ── Re-exports ──────────────────────────────────────────────────

export { INDUSTRY_TEMPLATES } from './templates'
export type { IndustryTemplate } from './templates'
