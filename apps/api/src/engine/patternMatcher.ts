import type { DiagnosticRule } from '@mindssparc/shared-types'
import { loadRules } from '@mindssparc/diagnostic-rules'
import { loadQuestions } from '@mindssparc/question-bank'
import type { Domain } from '@mindssparc/shared-types'

type AnswerRow = {
  questionId: string
  rawScore: number
  confidence: string
}

export type PatternMatchResult = {
  ruleId: string
  ruleName: string
  description: string
  fired: boolean
  confidence: 'high' | 'medium' | 'low'
  evidenceQuestionIds: string[]
  evidenceScores: number[]
  contrastDelta?: number
  severity: string
  diagnosis: string
  recommendedActions: string[]
  explanationTemplate: string
}

// Only return scores for questions that were actually answered
function getScore(questionId: string, answers: AnswerRow[]): number {
  const a = answers.find(ans => ans.questionId === questionId)
  return a ? a.rawScore : 0
}

function getAnswered(questionIds: string[], answers: AnswerRow[]): AnswerRow[] {
  return questionIds
    .map(id => answers.find(a => a.questionId === id))
    .filter((a): a is AnswerRow => a !== undefined && a.rawScore > 0)
}

function getAvgAnswered(questionIds: string[], answers: AnswerRow[]): { avg: number; count: number } {
  const answered = getAnswered(questionIds, answers)
  if (answered.length === 0) return { avg: 0, count: 0 }
  const avg = answered.reduce((s, a) => s + a.rawScore, 0) / answered.length
  return { avg, count: answered.length }
}

function getStdDevAnswered(questionIds: string[], answers: AnswerRow[]): { stdDev: number; count: number } {
  const answered = getAnswered(questionIds, answers)
  if (answered.length < 2) return { stdDev: 0, count: answered.length }
  const scores = answered.map(a => a.rawScore)
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length
  const variance = scores.reduce((s, v) => s + (v - avg) ** 2, 0) / scores.length
  return { stdDev: Math.sqrt(variance), count: answered.length }
}

// Match patterns across ALL domains, not just CRV
function expandRuleToDomains(rule: DiagnosticRule, domainsAnswered: Domain[]): DiagnosticRule[] {
  // Check if the rule only references CRV questions
  const allQIds = rule.triggerConditions.flatMap(c => [...c.questionIds, ...(c.contrastGroup || [])])
  const onlyCRV = allQIds.every(id => id.startsWith('CRV-'))

  if (!onlyCRV) return [rule] // Rule already references multiple domains

  // For each answered domain, create a version of the rule with domain-mapped question IDs
  const allQuestions = loadQuestions()
  const expanded: DiagnosticRule[] = []

  for (const domain of domainsAnswered) {
    if (domain === 'CRV') {
      expanded.push(rule) // Original rule for CRV
      continue
    }

    // Get questions for this domain, sorted by baseWeight descending
    const domainQs = allQuestions
      .filter(q => q.domain === domain)
      .sort((a, b) => b.baseWeight - a.baseWeight)

    if (domainQs.length < 5) continue // Not enough questions to map

    // Create a mapping from CRV question indices to domain question IDs
    const crvQs = allQuestions
      .filter(q => q.domain === 'CRV')
      .sort((a, b) => b.baseWeight - a.baseWeight)

    const crvIdToIndex = new Map<string, number>()
    crvQs.forEach((q, i) => crvIdToIndex.set(q.id, i))

    function mapId(crvId: string): string | null {
      const idx = crvIdToIndex.get(crvId)
      if (idx === undefined || idx >= domainQs.length) return null
      return domainQs[idx].id
    }

    // Map all conditions
    const mappedConditions = rule.triggerConditions.map(cond => {
      const mappedQIds = cond.questionIds.map(mapId).filter((id): id is string => id !== null)
      const mappedContrast = cond.contrastGroup?.map(mapId).filter((id): id is string => id !== null)

      return {
        ...cond,
        questionIds: mappedQIds,
        contrastGroup: mappedContrast,
      }
    })

    // Only add if we mapped enough questions (at least 60% of original)
    const originalCount = rule.triggerConditions.reduce((s, c) => s + c.questionIds.length, 0)
    const mappedCount = mappedConditions.reduce((s, c) => s + c.questionIds.length, 0)

    if (mappedCount >= originalCount * 0.6) {
      expanded.push({
        ...rule,
        id: `${rule.id}--${domain}`,
        triggerConditions: mappedConditions,
      })
    }
  }

  return expanded
}

export function matchPatterns(answers: AnswerRow[]): PatternMatchResult[] {
  const rules = loadRules()

  // Determine which domains have answers
  const allQuestions = loadQuestions()
  const answeredQIds = new Set(answers.filter(a => a.rawScore > 0).map(a => a.questionId))
  const domainsAnswered = [...new Set(
    allQuestions.filter(q => answeredQIds.has(q.id)).map(q => q.domain)
  )] as Domain[]

  // Expand rules to cover all answered domains
  const expandedRules = rules.flatMap(rule => expandRuleToDomains(rule, domainsAnswered))

  return expandedRules.map(rule => evaluateRule(rule, answers))
}

function evaluateRule(rule: DiagnosticRule, answers: AnswerRow[]): PatternMatchResult {
  const base: PatternMatchResult = {
    ruleId: rule.id,
    ruleName: rule.name,
    description: rule.description,
    fired: false,
    confidence: 'low',
    evidenceQuestionIds: [],
    evidenceScores: [],
    severity: rule.severity,
    diagnosis: rule.diagnosis,
    recommendedActions: rule.recommendedActions,
    explanationTemplate: rule.explanationTemplate,
  }

  // Special case: data-trust-deficit checks confidence levels, not just scores
  if (rule.id.startsWith('data-trust-deficit')) {
    return evaluateDataTrustDeficit(rule, answers, base)
  }

  // Special case: inconsistency-signal uses standard deviation
  if (rule.id.startsWith('inconsistency-signal')) {
    return evaluateInconsistencySignal(rule, answers, base)
  }

  // Standard evaluation: all conditions must pass
  let allConditionsMet = true
  const allEvidenceIds: string[] = []
  const allEvidenceScores: number[] = []

  for (const condition of rule.triggerConditions) {
    const { questionIds, operator, threshold, contrastGroup } = condition
    const answered = getAnswered(questionIds, answers)

    // Need at least 50% of questions answered for a condition to be evaluable
    if (answered.length < Math.max(1, Math.ceil(questionIds.length * 0.5))) {
      allConditionsMet = false
      break
    }

    switch (operator) {
      case 'AND': {
        const t = threshold ?? 3.5
        const scores = answered.map(a => a.rawScore)

        // AND with threshold >= 3.0 means "all must score above threshold"
        // AND with threshold < 3.0 means "all must score at or below threshold"
        const isAboveThreshold = t >= 3.0
        const met = isAboveThreshold
          ? scores.every(s => s >= t)
          : scores.every(s => s <= t)

        if (!met) {
          allConditionsMet = false
        } else {
          allEvidenceIds.push(...answered.map(a => a.questionId))
          allEvidenceScores.push(...scores)
        }
        break
      }

      case 'OR': {
        const t = threshold ?? 2.5
        const belowAnswers = answered.filter(a => a.rawScore <= t)
        if (belowAnswers.length === 0) {
          allConditionsMet = false
        } else {
          allEvidenceIds.push(...belowAnswers.map(a => a.questionId))
          allEvidenceScores.push(...belowAnswers.map(a => a.rawScore))
        }
        break
      }

      case 'AVG_BELOW': {
        const t = threshold ?? 2.0
        const { avg, count } = getAvgAnswered(questionIds, answers)
        if (count === 0 || avg >= t) {
          allConditionsMet = false
        } else {
          allEvidenceIds.push(...answered.map(a => a.questionId))
          allEvidenceScores.push(...answered.map(a => a.rawScore))
          // Set confidence based on how far below threshold
          if (avg < t * 0.7) base.confidence = 'high'
          else if (avg < t * 0.85) base.confidence = 'medium'
          else base.confidence = 'low'
        }
        break
      }

      case 'CONTRAST': {
        if (!contrastGroup || contrastGroup.length === 0) {
          allConditionsMet = false
          break
        }

        const groupA = getAvgAnswered(questionIds, answers)
        const groupB = getAvgAnswered(contrastGroup, answers)

        // Need at least 1 answered question in each group
        if (groupA.count === 0 || groupB.count === 0) {
          allConditionsMet = false
          break
        }

        const delta = groupA.avg - groupB.avg
        base.contrastDelta = Math.round(delta * 100) / 100

        // Lowered threshold: 0.8 points on 1-5 scale (16% of range)
        // This is more realistic for detecting genuine gaps
        if (Math.abs(delta) >= 0.8) {
          const answeredA = getAnswered(questionIds, answers)
          const answeredB = getAnswered(contrastGroup, answers)
          allEvidenceIds.push(...answeredA.map(a => a.questionId), ...answeredB.map(a => a.questionId))
          allEvidenceScores.push(...answeredA.map(a => a.rawScore), ...answeredB.map(a => a.rawScore))
          if (Math.abs(delta) >= 2.0) base.confidence = 'high'
          else if (Math.abs(delta) >= 1.2) base.confidence = 'medium'
          else base.confidence = 'low'
        } else {
          allConditionsMet = false
        }
        break
      }
    }
  }

  if (allConditionsMet && allEvidenceIds.length > 0) {
    base.fired = true
    base.evidenceQuestionIds = [...new Set(allEvidenceIds)]
    base.evidenceScores = base.evidenceQuestionIds.map(id => getScore(id, answers))
  }

  return base
}

// Special handler: data-trust-deficit checks answer confidence, not just scores
function evaluateDataTrustDeficit(
  rule: DiagnosticRule,
  answers: AnswerRow[],
  base: PatternMatchResult
): PatternMatchResult {
  const qids = rule.triggerConditions[0]?.questionIds || []
  const answered = getAnswered(qids, answers)

  if (answered.length < 3) return base // Need enough answers

  // Check two conditions:
  // 1. Scores are moderate (between 2.0 and 4.0 average)
  const avg = answered.reduce((s, a) => s + a.rawScore, 0) / answered.length
  if (avg < 2.0 || avg > 4.0) return base // Not moderate — different pattern

  // 2. More than 40% of answers have 'low' confidence (lowered from 60% to catch more cases)
  const lowConfCount = answered.filter(a => a.confidence === 'low').length
  const lowConfPct = lowConfCount / answered.length

  if (lowConfPct >= 0.4) {
    base.fired = true
    base.confidence = lowConfPct >= 0.7 ? 'high' : lowConfPct >= 0.5 ? 'medium' : 'low'
    base.evidenceQuestionIds = answered.map(a => a.questionId)
    base.evidenceScores = answered.map(a => a.rawScore)
  }

  return base
}

// Special handler: inconsistency-signal uses stddev on answered questions only
function evaluateInconsistencySignal(
  rule: DiagnosticRule,
  answers: AnswerRow[],
  base: PatternMatchResult
): PatternMatchResult {
  const qids = rule.triggerConditions[0]?.questionIds || []
  const { stdDev, count } = getStdDevAnswered(qids, answers)

  // Need at least 3 answered questions, lowered stddev threshold to 1.0
  if (count >= 3 && stdDev >= 1.0) {
    base.fired = true
    base.confidence = stdDev >= 1.8 ? 'high' : stdDev >= 1.3 ? 'medium' : 'low'
    const answered = getAnswered(qids, answers)
    base.evidenceQuestionIds = answered.map(a => a.questionId)
    base.evidenceScores = answered.map(a => a.rawScore)
  }

  return base
}
