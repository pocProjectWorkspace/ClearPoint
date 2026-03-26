import type { ReasoningEntry } from '@mindssparc/shared-types'
import type { DomainScoreResult } from './scoring'
import type { PatternMatchResult } from './patternMatcher'
import type { RootCauseResult } from './rootCauseGenerator'
import type { RoadmapItemResult } from './roadmapBuilder'
import type { BusinessCaseResult } from './businessCase'
import { getQuestionById } from '@mindssparc/question-bank'

type EngagementContext = {
  industry: string
  companySize: string
  domainsInScope: string[]
  clientName: string
}

type AnswerRow = {
  questionId: string
  rawScore: number
  confidence: string
  weightedScore: number
}

// Substitute {Q:CRV-01} with actual scores in templates
function substituteScores(template: string, answers: AnswerRow[]): string {
  return template.replace(/\{Q:([A-Z]+-\d+)\}/g, (_, qid) => {
    const ans = answers.find(a => a.questionId === qid)
    return ans ? String(ans.rawScore) : '?'
  })
}

async function callClaudeAPI(prompt: string, maxTokens: number): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'your-key-here') return null

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: 'You are writing plain-language diagnostic findings for a business consulting report. Be specific. Reference actual patterns found. Avoid AI jargon, avoid phrases like "leverage" or "empower". Write in present tense. No bullet points. No headers.',
      messages: [{ role: 'user', content: prompt }],
    })
    const block = response.content[0]
    if (block.type === 'text') return block.text
    return null
  } catch (e) {
    console.warn('Claude API call failed, using fallback:', (e as Error).message)
    return null
  }
}

// Generate a rich fallback explanation when Claude API isn't available
function generateScoreFallback(ds: DomainScoreResult): string {
  const lowestQs = ds.breakdown.lowestScoring.slice(0, 3)
  const highestQs = ds.breakdown.highestScoring.slice(0, 2)

  const domainLabel = ds.domain
  let text = `${domainLabel} scored ${ds.score}/100, placing it in the ${ds.maturityBand} maturity band.`

  if (ds.score < 30) {
    text += ` This is a critically low score indicating significant foundational gaps that need to be addressed before any technology-led intervention.`
  } else if (ds.score < 50) {
    text += ` This indicates emerging capabilities with clear room for improvement across process, data, and automation dimensions.`
  } else if (ds.score < 70) {
    text += ` This shows a developing function with some strong areas alongside gaps that present clear improvement opportunities.`
  } else {
    text += ` This demonstrates a mature function with solid foundations, though there may still be opportunities for AI and advanced analytics.`
  }

  if (lowestQs.length > 0) {
    text += ` The weakest areas were: ${lowestQs.map(q => `"${q.text.slice(0, 60)}..." (score: ${q.score.toFixed(1)})`).join('; ')}.`
  }
  if (highestQs.length > 0) {
    text += ` Strongest: ${highestQs.map(q => `"${q.text.slice(0, 60)}..." (${q.score.toFixed(1)})`).join('; ')}.`
  }

  return text
}

function generatePatternFallback(pattern: PatternMatchResult, answers: AnswerRow[]): string {
  if (pattern.fired) {
    const evidenceDetails = pattern.evidenceQuestionIds.slice(0, 4).map(qid => {
      const q = getQuestionById(qid)
      const ans = answers.find(a => a.questionId === qid)
      return `${q?.text.slice(0, 50) || qid}... (scored ${ans?.rawScore || '?'}/5)`
    }).join('; ')

    let text = `${pattern.ruleName}: TRIGGERED (confidence: ${pattern.confidence}).`
    if (pattern.contrastDelta) {
      text += ` Gap of ${Math.abs(pattern.contrastDelta).toFixed(1)} points detected between question groups.`
    }
    text += ` Evidence: ${evidenceDetails}.`
    text += ` ${substituteScores(pattern.explanationTemplate, answers)}`
    return text
  }

  // Not triggered — explain what would need to change
  return `${pattern.ruleName}: Not triggered for this engagement. The conditions for this pattern — ${pattern.description.slice(0, 100)}... — were not met in the current assessment data.`
}

function generateBusinessCaseFallback(bc: BusinessCaseResult): string {
  const domainCosts = Object.entries(bc.problemCostByDomain)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([domain, cost]) => `${domain}: $${cost.toFixed(1)}M`)
    .join(', ')

  return `Total estimated problem cost across ${Object.keys(bc.problemCostByDomain).length} assessed domains is $${bc.totalProblemCost.toFixed(1)}M. ` +
    `The highest-cost domains are ${domainCosts}. ` +
    `The value stack breaks down as: Process & Digitise $${bc.valueByTier.tier01.toFixed(1)}M, ` +
    `Automate & Integrate $${bc.valueByTier.tier2.toFixed(1)}M, ` +
    `Analytics $${bc.valueByTier.tier3.toFixed(1)}M, AI $${bc.valueByTier.tier4.toFixed(1)}M. ` +
    `Conservative 12-month recovery estimate: $${bc.conservative12Month.toFixed(1)}M. ` +
    `Realistic 24-month projection: $${bc.realistic24Month.toFixed(1)}M. ` +
    `All values are derived from the engagement's revenue range (${bc.formulaInputs.revenueRange}) and domain maturity scores — no hardcoded values are used.`
}

export async function generateReasoningLog(
  domainScores: DomainScoreResult[],
  patterns: PatternMatchResult[],
  rootCauses: RootCauseResult[],
  roadmap: RoadmapItemResult[],
  businessCase: BusinessCaseResult,
  answers: AnswerRow[],
  engagement: EngagementContext
): Promise<ReasoningEntry[]> {
  const entries: ReasoningEntry[] = []

  // 1. Score entries
  for (const ds of domainScores) {
    entries.push({
      outputType: 'score',
      outputId: `score-${ds.domain}`,
      explanation: generateScoreFallback(ds),
      contributingFactors: [
        ...ds.breakdown.lowestScoring.slice(0, 3).map(q => ({
          questionId: q.questionId,
          weight: q.score,
          direction: 'negative' as const,
          description: q.text.slice(0, 80),
        })),
        ...ds.breakdown.highestScoring.slice(0, 2).map(q => ({
          questionId: q.questionId,
          weight: q.score,
          direction: 'positive' as const,
          description: q.text.slice(0, 80),
        })),
      ],
    })
  }

  // 2. Pattern entries — only include fired patterns and notable unfired ones
  const firedPatterns = patterns.filter(p => p.fired)
  const unfiredPatterns = patterns.filter(p => !p.fired)

  for (const pattern of firedPatterns) {
    entries.push({
      outputType: 'pattern',
      outputId: `pattern-${pattern.ruleId}`,
      explanation: generatePatternFallback(pattern, answers),
      contributingFactors: pattern.evidenceQuestionIds.map((qid, i) => ({
        questionId: qid,
        weight: pattern.evidenceScores[i] || 0,
        direction: (pattern.evidenceScores[i] || 0) <= 2 ? 'negative' as const : 'positive' as const,
        description: getQuestionById(qid)?.text.slice(0, 80) || qid,
      })),
    })
  }

  // Include unfired patterns as a summary if there are any
  if (unfiredPatterns.length > 0) {
    entries.push({
      outputType: 'pattern',
      outputId: 'patterns-not-triggered',
      explanation: `${unfiredPatterns.length} diagnostic patterns were evaluated but did not trigger: ${unfiredPatterns.map(p => p.ruleName).join(', ')}. This means the assessment data did not show the specific combinations of scores that indicate these particular problems.`,
      contributingFactors: [],
    })
  }

  // 3. Root cause entries — try Claude API, fallback to rich templates
  const rcPromises = rootCauses.map(async (rc) => {
    const evidenceTexts = rc.evidenceQuestionIds.map(qid => {
      const q = getQuestionById(qid)
      const ans = answers.find(a => a.questionId === qid)
      return `${q?.text || qid} (scored ${ans?.rawScore || '?'}/5)`
    }).join('; ')

    const prompt = `Finding: ${rc.name}\nEvidence: ${evidenceTexts}\nPattern: ${rc.evidencePattern}\nIndustry: ${engagement.industry}, Size: ${engagement.companySize}\n\nWrite 2-3 sentences explaining: (1) what the data shows, (2) what this typically means in practice, (3) why it matters for this business.`

    const narrative = await callClaudeAPI(prompt, 300)

    // Rich fallback
    const fallbackText = `${rc.name}: ${rc.description} This finding is based on ${rc.evidenceQuestionIds.length} assessment responses that collectively indicate this pattern. Severity: ${rc.severity}.`

    return {
      outputType: 'rootCause' as const,
      outputId: rc.id,
      explanation: narrative || fallbackText,
      contributingFactors: rc.evidenceQuestionIds.map(qid => {
        const ans = answers.find(a => a.questionId === qid)
        return {
          questionId: qid,
          weight: ans?.rawScore || 0,
          direction: (ans?.rawScore || 0) <= 2 ? 'negative' as const : 'positive' as const,
          description: getQuestionById(qid)?.text.slice(0, 80) || qid,
        }
      }),
    } satisfies ReasoningEntry
  })

  // Batch in groups of 5
  for (let i = 0; i < rcPromises.length; i += 5) {
    const batch = rcPromises.slice(i, i + 5)
    const results = await Promise.allSettled(batch)
    for (const result of results) {
      if (result.status === 'fulfilled') entries.push(result.value)
    }
  }

  // 4. Roadmap entries
  for (const item of roadmap) {
    const rootCauseNames = item.rootCauseIds.map(rcId => {
      const rc = rootCauses.find(r => r.id === rcId)
      return rc?.name || rcId
    }).join(', ')

    entries.push({
      outputType: 'roadmapItem',
      outputId: item.id,
      explanation: `${item.title} (${item.phase}-day): ${item.description} This action addresses: ${rootCauseNames}. Expected outcome: ${item.expectedOutcome}`,
      contributingFactors: item.rootCauseIds.map(rcId => ({
        patternId: rcId,
        weight: item.phase === 30 ? 1.0 : item.phase === 60 ? 0.7 : 0.4,
        direction: 'negative' as const,
        description: `Addresses: ${rootCauses.find(r => r.id === rcId)?.name || rcId}`,
      })),
    })
  }

  // 5. Business case entry
  entries.push({
    outputType: 'businessCase',
    outputId: 'business-case-summary',
    explanation: generateBusinessCaseFallback(businessCase),
    contributingFactors: Object.entries(businessCase.problemCostByDomain).map(([domain, cost]) => ({
      patternId: `domain-${domain}`,
      weight: cost,
      direction: 'negative' as const,
      description: `${domain} problem cost: $${cost.toFixed(1)}M`,
    })),
  })

  return entries
}
