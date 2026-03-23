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

  // 1. Score entries (structured — no API call needed)
  for (const ds of domainScores) {
    const lowestQs = ds.breakdown.lowestScoring.slice(0, 3)
    const highestQs = ds.breakdown.highestScoring.slice(0, 2)

    entries.push({
      outputType: 'score',
      outputId: `score-${ds.domain}`,
      explanation: `${ds.domain} scored ${ds.score}/100 (${ds.maturityBand}). ${
        lowestQs.length > 0
          ? `Weakest areas: ${lowestQs.map(q => `"${q.text.slice(0, 50)}..." (${q.score.toFixed(1)})`).join(', ')}.`
          : ''
      } ${
        highestQs.length > 0
          ? `Strongest: ${highestQs.map(q => `"${q.text.slice(0, 50)}..." (${q.score.toFixed(1)})`).join(', ')}.`
          : ''
      }`,
      contributingFactors: [
        ...lowestQs.map(q => ({
          questionId: q.questionId,
          weight: q.score,
          direction: 'negative' as const,
          description: q.text.slice(0, 80),
        })),
        ...highestQs.map(q => ({
          questionId: q.questionId,
          weight: q.score,
          direction: 'positive' as const,
          description: q.text.slice(0, 80),
        })),
      ],
    })
  }

  // 2. Pattern entries (structured)
  for (const pattern of patterns) {
    const statusText = pattern.fired
      ? `FIRED (confidence: ${pattern.confidence}${pattern.contrastDelta ? `, delta: ${pattern.contrastDelta}` : ''})`
      : 'Not triggered'

    entries.push({
      outputType: 'pattern',
      outputId: `pattern-${pattern.ruleId}`,
      explanation: `${pattern.ruleName}: ${statusText}. ${
        pattern.fired
          ? substituteScores(pattern.explanationTemplate, answers)
          : `Conditions not met for this pattern.`
      }`,
      contributingFactors: pattern.evidenceQuestionIds.map((qid, i) => ({
        questionId: qid,
        weight: pattern.evidenceScores[i] || 0,
        direction: (pattern.evidenceScores[i] || 0) <= 2 ? 'negative' as const : 'positive' as const,
        description: getQuestionById(qid)?.text.slice(0, 80) || qid,
      })),
    })
  }

  // 3. Root cause entries — try Claude API in batches, fallback to template
  const rcPromises = rootCauses.map(async (rc) => {
    const evidenceTexts = rc.evidenceQuestionIds.map(qid => {
      const q = getQuestionById(qid)
      const ans = answers.find(a => a.questionId === qid)
      return `${q?.text || qid} (scored ${ans?.rawScore || '?'}/5)`
    }).join('; ')

    const prompt = `Finding: ${rc.name}\nEvidence: ${evidenceTexts}\nPattern: ${rc.evidencePattern}\nIndustry: ${engagement.industry}, Size: ${engagement.companySize}\n\nWrite 2-3 sentences explaining: (1) what the data shows, (2) what this typically means in practice, (3) why it matters for this business.`

    const narrative = await callClaudeAPI(prompt, 300)

    // Fallback: use pattern explanation template with score substitution
    const fallbackText = `${rc.name}: ${rc.description}`

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

  // 4. Roadmap entries (structured)
  for (const item of roadmap) {
    entries.push({
      outputType: 'roadmapItem',
      outputId: item.id,
      explanation: `${item.title}: ${item.description} Expected outcome: ${item.expectedOutcome}`,
      contributingFactors: item.rootCauseIds.map(rcId => ({
        patternId: rcId,
        weight: item.phase === 30 ? 1.0 : item.phase === 60 ? 0.7 : 0.4,
        direction: 'negative' as const,
        description: `Addresses root cause ${rcId}`,
      })),
    })
  }

  // 5. Business case entry (structured)
  entries.push({
    outputType: 'businessCase',
    outputId: 'business-case-summary',
    explanation: `Total problem cost: $${businessCase.totalProblemCost.toFixed(1)}M across ${Object.keys(businessCase.problemCostByDomain).length} domains. Tier 0-1 (Process): $${businessCase.valueByTier.tier01.toFixed(1)}M. Tier 2 (Automation): $${businessCase.valueByTier.tier2.toFixed(1)}M. Tier 3 (Analytics): $${businessCase.valueByTier.tier3.toFixed(1)}M. Tier 4 (AI): $${businessCase.valueByTier.tier4.toFixed(1)}M. Conservative 12-month recovery: $${businessCase.conservative12Month.toFixed(1)}M. Realistic 24-month: $${businessCase.realistic24Month.toFixed(1)}M.`,
    contributingFactors: Object.entries(businessCase.problemCostByDomain).map(([domain, cost]) => ({
      patternId: `domain-${domain}`,
      weight: cost,
      direction: 'negative' as const,
      description: `${domain} problem cost: $${cost.toFixed(1)}M`,
    })),
  })

  return entries
}
