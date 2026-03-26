#!/usr/bin/env node
/**
 * Generates consultantGuide field for every question in the question bank.
 * Each guide includes: how to frame the question, what to listen for,
 * a follow-up probe, and what the answer reveals diagnostically.
 */

const fs = require('fs')
const path = require('path')

const questionsPath = path.join(__dirname, '../packages/question-bank/questions.json')
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'))

// Signal-specific coaching
const SIGNAL_COACHING = {
  PROCESS: {
    listenFor: 'documented workflows, ownership clarity, escalation paths, handoff points',
    redFlags: 'phrases like "it depends who you ask", "we just figure it out", "everyone does it differently"',
    probeStyle: 'Ask them to walk you through a specific recent example step-by-step',
  },
  DIGITIZE: {
    listenFor: 'data capture at decision points, system of record usage, manual data entry patterns',
    redFlags: 'spreadsheets as primary data store, "we don\'t track that", tribal knowledge',
    probeStyle: 'Ask where the data lives and how it gets there',
  },
  INTEGRATE: {
    listenFor: 'cross-system data flow, manual re-keying, copy-paste between tools, email-based handoffs',
    redFlags: '"we export to Excel then import", "I check three systems", "the data is there but I can\'t access it"',
    probeStyle: 'Ask what happens when someone needs information from another team or system',
  },
  AUTOMATE: {
    listenFor: 'repetitive tasks, volume indicators, rule-based decisions, approval queues',
    redFlags: '"we do this hundreds of times a day", "it\'s always the same steps", "we\'re just clicking through"',
    probeStyle: 'Ask about the most time-consuming repetitive task in their week',
  },
  ANALYTICS: {
    listenFor: 'dashboard usage, data-driven decisions, reporting cadence, insight-to-action loops',
    redFlags: '"we have dashboards but nobody looks at them", "by the time we see the data it\'s too late"',
    probeStyle: 'Ask about the last decision they changed because of data they saw',
  },
  AI: {
    listenFor: 'judgment variability, expertise dependency, pattern recognition needs, scale constraints',
    redFlags: '"only Sarah knows how to do this", "it depends on experience", "we can\'t scale this"',
    probeStyle: 'Ask what would happen if their best person in this area left tomorrow',
  },
}

// Domain-specific context
const DOMAIN_CONTEXT = {
  CRV: 'This is about the revenue engine — sales, pipeline, customer intelligence. Frame questions around their selling motion and customer lifecycle.',
  MKT: 'This covers demand generation, market intelligence, and campaign effectiveness. Frame questions around how they attract and convert prospects.',
  SVC: 'This is about service delivery, customer retention, and support operations. Frame questions around how they keep customers and resolve issues.',
  OPS: 'This covers operational execution, supply chain, and fulfilment. Frame questions around how work gets done day-to-day.',
  PPL: 'This is about people, talent, culture, and organisational design. Frame questions around how they hire, develop, and organise teams.',
  FIN: 'This covers financial operations, risk, compliance, and planning. Frame questions around how they manage money and risk.',
  TEC: 'This is about technology infrastructure, data architecture, and digital capabilities. Frame questions around their tech stack and data maturity.',
  PRD: 'This covers product development, innovation, and R&D processes. Frame questions around how they build and evolve their products.',
}

// Anchor-based scoring guidance
function getScoreGuidance(anchors) {
  if (!anchors || anchors.length < 5) return ''

  const low = anchors.find(a => a.value === 1)
  const mid = anchors.find(a => a.value === 3)
  const high = anchors.find(a => a.value === 5)

  let guide = '\n\nScoring guidance: '
  if (low) guide += `Score 1 if "${low.label.toLowerCase()}". `
  if (mid) guide += `Score 3 if "${mid.label.toLowerCase()}". `
  if (high) guide += `Score 5 if "${high.label.toLowerCase()}". `
  guide += 'Most real-world answers fall between 2-4 — push for specifics to differentiate.'

  return guide
}

// Generate the consultant guide for a question
function generateGuide(q) {
  const signal = SIGNAL_COACHING[q.interventionSignal] || SIGNAL_COACHING.PROCESS
  const domainCtx = DOMAIN_CONTEXT[q.domain] || ''

  // Extract the core action from the question text
  const questionLower = q.text.toLowerCase()

  // Determine framing approach based on question type
  let framingAdvice = ''
  if (questionLower.includes('walk me through') || questionLower.includes('describe')) {
    framingAdvice = 'This is a narrative question — let the client tell the story. Don\'t interrupt. Listen for gaps, workarounds, and pain points they mention casually. The most diagnostic information often comes from what they say between the lines.'
  } else if (questionLower.includes('how often') || questionLower.includes('how frequently') || questionLower.includes('how long')) {
    framingAdvice = 'This is a frequency/duration question — push for actual numbers, not impressions. Ask "Can you estimate how many times per week?" or "Roughly how many hours?" Vague answers like "sometimes" or "it varies" should prompt follow-up.'
  } else if (questionLower.includes('how does') || questionLower.includes('how do')) {
    framingAdvice = 'This is a process question — you\'re looking for the actual mechanism, not the ideal. Ask "What does this look like on a typical day?" to get past the aspirational answer. If they describe the ideal, ask "And how often does it actually work that way?"'
  } else if (questionLower.includes('what happens when') || questionLower.includes('if one of')) {
    framingAdvice = 'This is a scenario question — it reveals resilience and process maturity under stress. The answer to "what happens when things go wrong" tells you more about real capability than "what happens on a good day."'
  } else if (questionLower.includes('how quickly') || questionLower.includes('how fast')) {
    framingAdvice = 'This is a speed/responsiveness question — compare their answer to industry norms. Ask "Is that fast enough for your business?" to calibrate whether the current state is a problem or acceptable.'
  } else if (questionLower.includes('who') || questionLower.includes('which team')) {
    framingAdvice = 'This is an ownership/accountability question — listen for clarity vs ambiguity. Clear ownership ("Sarah\'s team owns this") scores higher than distributed or unclear ownership ("it\'s kind of shared across teams").'
  } else if (questionLower.includes('what percentage') || questionLower.includes('how much')) {
    framingAdvice = 'This is a quantitative question — resist accepting rough guesses. Ask "Is that documented somewhere, or is that your best estimate?" The confidence level matters as much as the number itself.'
  } else {
    framingAdvice = 'Read the question as written, then pause. Let the client think. If they give a one-word answer, ask "Can you give me a specific example?" Concrete examples are more diagnostic than abstract assessments.'
  }

  // Build follow-up probes based on intervention signal
  let followUp = ''
  switch (q.interventionSignal) {
    case 'PROCESS':
      followUp = 'Follow-up: "Is this process documented? Who owns it? What happens when someone new joins the team — how do they learn this?"'
      break
    case 'DIGITIZE':
      followUp = 'Follow-up: "Where does this data live? Is it captured automatically or does someone enter it manually? How current is it?"'
      break
    case 'INTEGRATE':
      followUp = 'Follow-up: "When you need this information from another team, how do you get it? How long does that take? Is there a single place you can look?"'
      break
    case 'AUTOMATE':
      followUp = 'Follow-up: "How many times per day/week does someone do this manually? Could you describe the decision criteria — is it the same logic every time?"'
      break
    case 'ANALYTICS':
      followUp = 'Follow-up: "When you see something concerning in the data, what happens next? Who acts on it? How quickly?"'
      break
    case 'AI':
      followUp = 'Follow-up: "How much does the outcome depend on the individual person handling it? Would two experienced people reach the same conclusion?"'
      break
  }

  // Compose the full guide
  let guide = `HOW TO ASK: ${framingAdvice}`
  guide += `\n\nLISTEN FOR: ${signal.listenFor}. Red flags: ${signal.redFlags}.`
  guide += `\n\n${followUp}`
  guide += `\n\nDIAGNOSTIC VALUE: This question feeds the "${q.diagnosticPatterns.join('", "')}" pattern(s). ${q.preAnswerContext.split('.').slice(0, 2).join('.')}.`
  guide += getScoreGuidance(q.anchors)

  return guide
}

// Process all questions
let updatedCount = 0
for (const q of questions) {
  q.consultantGuide = generateGuide(q)
  updatedCount++
}

// Write back
fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2) + '\n')
console.log(`Updated ${updatedCount} questions with consultant guides.`)
