import type { Domain, InterventionType, Severity } from '@mindssparc/shared-types'
import type { PatternMatchResult } from './patternMatcher'
import { getQuestionById } from '@mindssparc/question-bank'

type EngagementLike = {
  confidenceLevel: string
}

export type RootCauseResult = {
  id: string
  name: string
  description: string
  domain: Domain
  severity: Severity
  evidenceQuestionIds: string[]
  evidencePattern: string
  recommendedInterventionTier: InterventionType
  patternConfidence: 'high' | 'medium' | 'low'
  recommendedActions: string[]
}

function determineSeverity(
  patternConfidence: 'high' | 'medium' | 'low',
  engagementConfidence: string,
  patternSeverity: string
): Severity {
  // Use pattern's declared severity as baseline, adjust by confidence
  if (patternConfidence === 'high' && engagementConfidence === 'high') return 'critical'
  if (patternConfidence === 'high' && engagementConfidence === 'medium') return 'high'
  if (patternSeverity === 'critical') return patternConfidence === 'low' ? 'medium' : 'critical'
  if (patternSeverity === 'high') return patternConfidence === 'low' ? 'medium' : 'high'
  if (patternConfidence === 'medium') return 'medium'
  return 'low'
}

function getDominantDomain(questionIds: string[]): Domain {
  const domainCounts: Record<string, number> = {}
  for (const qid of questionIds) {
    const q = getQuestionById(qid)
    if (q) {
      domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1
    }
  }
  const sorted = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])
  return (sorted[0]?.[0] || 'CRV') as Domain
}

function getRecommendedTier(actions: string[]): InterventionType {
  // Infer from action names
  const actionStr = actions.join(' ').toLowerCase()
  if (actionStr.includes('ai') || actionStr.includes('ml') || actionStr.includes('pilot')) return 'AI'
  if (actionStr.includes('analytics') || actionStr.includes('dashboard') || actionStr.includes('insight')) return 'ANALYTICS'
  if (actionStr.includes('automat') || actionStr.includes('rpa')) return 'AUTOMATE'
  if (actionStr.includes('integrat') || actionStr.includes('unified') || actionStr.includes('connect')) return 'INTEGRATE'
  if (actionStr.includes('digitiz') || actionStr.includes('capture') || actionStr.includes('data')) return 'DIGITIZE'
  return 'PROCESS'
}

export function generateRootCauses(
  patterns: PatternMatchResult[],
  engagement: EngagementLike
): RootCauseResult[] {
  const firedPatterns = patterns.filter(p => p.fired)
  if (firedPatterns.length === 0) return []

  const timestamp = Date.now()
  const causeMap = new Map<string, RootCauseResult>()

  for (const pattern of firedPatterns) {
    const key = pattern.diagnosis
    const existing = causeMap.get(key)

    if (existing) {
      // Merge: union evidence, take higher severity
      const mergedEvidence = [...new Set([...existing.evidenceQuestionIds, ...pattern.evidenceQuestionIds])]
      const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low']
      const newSev = determineSeverity(pattern.confidence, engagement.confidenceLevel, pattern.severity)
      const higherSev = severityOrder.indexOf(newSev) < severityOrder.indexOf(existing.severity) ? newSev : existing.severity

      existing.evidenceQuestionIds = mergedEvidence
      existing.severity = higherSev
      existing.evidencePattern += `, ${pattern.ruleId}`
    } else {
      const severity = determineSeverity(pattern.confidence, engagement.confidenceLevel, pattern.severity)

      // If only 1 evidence question, mark as low severity with note
      const adjustedSeverity = pattern.evidenceQuestionIds.length < 2 ? 'low' as Severity : severity

      causeMap.set(key, {
        id: `rc-${pattern.ruleId}-${timestamp}`,
        name: pattern.diagnosis,
        description: pattern.description + (pattern.evidenceQuestionIds.length < 2 ? ' (limited evidence — single question trigger)' : ''),
        domain: getDominantDomain(pattern.evidenceQuestionIds),
        severity: adjustedSeverity,
        evidenceQuestionIds: [...pattern.evidenceQuestionIds],
        evidencePattern: pattern.ruleId,
        recommendedInterventionTier: getRecommendedTier(pattern.recommendedActions),
        patternConfidence: pattern.confidence,
        recommendedActions: pattern.recommendedActions,
      })
    }
  }

  // Sort: critical → high → medium → low, then by evidence count desc
  const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low']
  let results = [...causeMap.values()].sort((a, b) => {
    const sevDiff = severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
    if (sevDiff !== 0) return sevDiff
    return b.evidenceQuestionIds.length - a.evidenceQuestionIds.length
  })

  // Cap at 8 — merge remaining into "Additional Findings"
  if (results.length > 8) {
    const top8 = results.slice(0, 8)
    const remaining = results.slice(8)
    const allRemainingEvidence = remaining.flatMap(r => r.evidenceQuestionIds)
    top8.push({
      id: `rc-additional-${timestamp}`,
      name: 'Additional Findings',
      description: `${remaining.length} additional patterns were detected with lower severity. These should be reviewed during the next assessment cycle.`,
      domain: getDominantDomain(allRemainingEvidence),
      severity: 'low',
      evidenceQuestionIds: [...new Set(allRemainingEvidence)],
      evidencePattern: remaining.map(r => r.evidencePattern).join(', '),
      recommendedInterventionTier: 'PROCESS',
      patternConfidence: 'low',
      recommendedActions: remaining.flatMap(r => r.recommendedActions),
    })
    results = top8
  }

  return results
}
