import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-sonnet-4-20250514'

export async function generateReasoningNarrative(
  rootCauseName: string,
  questionTextsWithScores: string,
  patternDescription: string,
  engagementContext: { industry: string; companySize: string; domainsInScope: string[] }
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: `You are the reasoning engine for a business diagnostic tool.
Given the following evidence, write a 2-3 sentence plain-language explanation
that a senior executive would understand. Be specific — reference the actual
patterns found, not generic statements. Do not use AI jargon.

Finding: ${rootCauseName}
Evidence questions: ${questionTextsWithScores}
Pattern fired: ${patternDescription}
Engagement context: ${engagementContext.industry}, ${engagementContext.companySize}, ${engagementContext.domainsInScope.join(', ')}

Output only the explanation. No preamble.`,
      },
    ],
  })

  const block = response.content[0]
  if (block.type === 'text') return block.text
  throw new Error('Unexpected response format from Claude API')
}

export async function generateExecutiveSummary(
  diagnosticResultJson: string,
  engagementContext: { clientName: string; industry: string }
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    temperature: 0.4,
    messages: [
      {
        role: 'user',
        content: `You are writing the executive summary for a business diagnostic report
prepared by ClearPoint (powered by mindssparc) for ${engagementContext.clientName} (${engagementContext.industry}).

From the diagnostic results below, write a 4-6 paragraph executive summary.
Be direct and specific. Reference actual findings, not generic observations.
Write for a C-suite audience. No bullet points — flowing prose only.

Diagnostic Results:
${diagnosticResultJson}

Output only the summary. No preamble.`,
      },
    ],
  })

  const block = response.content[0]
  if (block.type === 'text') return block.text
  throw new Error('Unexpected response format from Claude API')
}
