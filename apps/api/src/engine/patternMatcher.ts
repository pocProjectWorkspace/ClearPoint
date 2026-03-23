import type { DiagnosticRule } from '@mindssparc/shared-types'
import { loadRules } from '@mindssparc/diagnostic-rules'

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

function getScore(questionId: string, answers: AnswerRow[]): number {
  const a = answers.find(ans => ans.questionId === questionId)
  return a ? a.rawScore : 0
}

function getAvg(questionIds: string[], answers: AnswerRow[]): number {
  const scores = questionIds.map(id => getScore(id, answers))
  if (scores.length === 0) return 0
  return scores.reduce((s, v) => s + v, 0) / scores.length
}

function getStdDev(questionIds: string[], answers: AnswerRow[]): number {
  const scores = questionIds.map(id => getScore(id, answers))
  if (scores.length < 2) return 0
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length
  const variance = scores.reduce((s, v) => s + (v - avg) ** 2, 0) / scores.length
  return Math.sqrt(variance)
}

export function matchPatterns(answers: AnswerRow[]): PatternMatchResult[] {
  const rules = loadRules()
  return rules.map(rule => evaluateRule(rule, answers))
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

  // Special case: inconsistency-signal uses standard deviation, not threshold
  if (rule.id === 'inconsistency-signal') {
    const qids = rule.triggerConditions[0].questionIds
    const stdDev = getStdDev(qids, answers)
    const scores = qids.map(id => getScore(id, answers))
    const nonZeroScores = scores.filter(s => s > 0)

    if (nonZeroScores.length >= 3 && stdDev > 1.5) {
      base.fired = true
      base.confidence = stdDev > 2.0 ? 'high' : 'medium'
      base.evidenceQuestionIds = qids.filter(id => getScore(id, answers) > 0)
      base.evidenceScores = base.evidenceQuestionIds.map(id => getScore(id, answers))
    }
    return base
  }

  // Standard evaluation: all conditions must pass
  let allConditionsMet = true
  const allEvidenceIds: string[] = []
  const allEvidenceScores: number[] = []

  for (const condition of rule.triggerConditions) {
    const { questionIds, operator, threshold, contrastGroup } = condition

    switch (operator) {
      case 'AND': {
        // All questions must score <= threshold
        const t = threshold ?? 3.5
        // For AND with "score above" thresholds (automation-ready, ai-candidate),
        // check if all scores are >= threshold
        const scores = questionIds.map(id => getScore(id, answers))
        const answeredScores = scores.filter(s => s > 0)

        if (answeredScores.length === 0) {
          allConditionsMet = false
        } else {
          // AND: threshold >= 3.0 means "all must score above threshold"
          //       threshold < 3.0 means "all must score at or below threshold"
          const isAboveThreshold = t >= 3.0
          const met = isAboveThreshold
            ? answeredScores.every(s => s >= t)
            : answeredScores.every(s => s <= t)

          if (!met) allConditionsMet = false
          else {
            allEvidenceIds.push(...questionIds.filter(id => getScore(id, answers) > 0))
            allEvidenceScores.push(...answeredScores)
          }
        }
        break
      }

      case 'OR': {
        // OR: at least one scores below threshold (already handled via inconsistency)
        // This case shouldn't be reached for OR in our rules, but handle generically
        const t = threshold ?? 2.5
        const scores = questionIds.map(id => getScore(id, answers))
        const anyBelow = scores.some(s => s > 0 && s <= t)
        if (!anyBelow) allConditionsMet = false
        else {
          const belowIds = questionIds.filter(id => { const s = getScore(id, answers); return s > 0 && s <= t })
          allEvidenceIds.push(...belowIds)
          allEvidenceScores.push(...belowIds.map(id => getScore(id, answers)))
        }
        break
      }

      case 'AVG_BELOW': {
        const t = threshold ?? 2.0
        const answeredIds = questionIds.filter(id => getScore(id, answers) > 0)
        if (answeredIds.length === 0) {
          allConditionsMet = false
          break
        }
        const avg = getAvg(answeredIds, answers)
        if (avg >= t) {
          allConditionsMet = false
        } else {
          allEvidenceIds.push(...answeredIds)
          allEvidenceScores.push(...answeredIds.map(id => getScore(id, answers)))
          // Set confidence based on how far below threshold
          if (avg < t * 0.7) base.confidence = 'high'
          else if (avg < t * 0.85) base.confidence = 'medium'
          else base.confidence = 'low'
        }
        break
      }

      case 'CONTRAST': {
        // Group A = questionIds, Group B = contrastGroup
        // fired if groupB avg - groupA avg > 1.5
        // Note: in the rules, Group A (questionIds) might be the high-scoring group
        // and contrastGroup might be the low-scoring group, or vice versa.
        // The rule says "Process questions high, data-access questions low"
        // questionIds = process (high), contrastGroup = data (low expected)
        // Delta = process avg - data avg, fires when delta > 1.5 (process high, data low)

        if (!contrastGroup || contrastGroup.length === 0) {
          allConditionsMet = false
          break
        }

        const groupAIds = questionIds.filter(id => getScore(id, answers) > 0)
        const groupBIds = contrastGroup.filter(id => getScore(id, answers) > 0)

        if (groupAIds.length === 0 || groupBIds.length === 0) {
          allConditionsMet = false
          break
        }

        const groupAAvg = getAvg(groupAIds, answers)
        const groupBAvg = getAvg(groupBIds, answers)
        const delta = groupAAvg - groupBAvg

        base.contrastDelta = Math.round(delta * 100) / 100

        if (Math.abs(delta) > 1.5) {
          allEvidenceIds.push(...groupAIds, ...groupBIds)
          allEvidenceScores.push(
            ...groupAIds.map(id => getScore(id, answers)),
            ...groupBIds.map(id => getScore(id, answers))
          )
          if (Math.abs(delta) > 2.5) base.confidence = 'high'
          else base.confidence = 'medium'
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
    // Keep highest confidence found
  }

  return base
}
