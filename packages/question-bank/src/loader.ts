import type { Question, Domain, InterventionType } from '@mindssparc/shared-types'
import { readFileSync } from 'fs'
import { join } from 'path'

const questionsData = JSON.parse(
  readFileSync(join(__dirname, '..', 'questions.json'), 'utf-8')
)

const VALID_DOMAINS: Domain[] = ['CRV', 'MKT', 'SVC', 'OPS', 'PPL', 'FIN', 'TEC', 'PRD']
const VALID_SIGNALS: InterventionType[] = ['PROCESS', 'DIGITIZE', 'INTEGRATE', 'AUTOMATE', 'ANALYTICS', 'AI']

function validateQuestion(q: unknown, index: number): Question {
  const raw = q as Record<string, unknown>

  if (!raw.id || typeof raw.id !== 'string') {
    throw new Error(`Question at index ${index} missing valid "id"`)
  }
  if (!raw.text || typeof raw.text !== 'string') {
    throw new Error(`Question ${raw.id}: missing "text"`)
  }
  if (!raw.preAnswerContext || typeof raw.preAnswerContext !== 'string') {
    throw new Error(`Question ${raw.id}: missing "preAnswerContext"`)
  }
  if (!VALID_DOMAINS.includes(raw.domain as Domain)) {
    throw new Error(`Question ${raw.id}: invalid domain "${raw.domain}"`)
  }
  if (!raw.capabilityArea || typeof raw.capabilityArea !== 'string') {
    throw new Error(`Question ${raw.id}: missing "capabilityArea"`)
  }
  if (!VALID_SIGNALS.includes(raw.interventionSignal as InterventionType)) {
    throw new Error(`Question ${raw.id}: invalid interventionSignal "${raw.interventionSignal}"`)
  }
  if (!Array.isArray(raw.diagnosticPatterns) || raw.diagnosticPatterns.length === 0) {
    throw new Error(`Question ${raw.id}: "diagnosticPatterns" must be a non-empty array`)
  }
  if (typeof raw.baseWeight !== 'number' || raw.baseWeight < 0.5 || raw.baseWeight > 2.0) {
    throw new Error(`Question ${raw.id}: "baseWeight" must be between 0.5 and 2.0`)
  }
  if (!Array.isArray(raw.anchors) || raw.anchors.length !== 5) {
    throw new Error(`Question ${raw.id}: must have exactly 5 anchors`)
  }

  for (const anchor of raw.anchors as Array<Record<string, unknown>>) {
    if (typeof anchor.value !== 'number' || anchor.value < 1 || anchor.value > 5) {
      throw new Error(`Question ${raw.id}: anchor value must be 1-5`)
    }
    if (!anchor.label || typeof anchor.label !== 'string') {
      throw new Error(`Question ${raw.id}: anchor missing "label"`)
    }
    if (!anchor.description || typeof anchor.description !== 'string') {
      throw new Error(`Question ${raw.id}: anchor missing "description"`)
    }
  }

  return raw as unknown as Question
}

let cachedQuestions: Question[] | null = null

export function loadQuestions(): Question[] {
  if (cachedQuestions) return cachedQuestions

  if (!Array.isArray(questionsData)) {
    throw new Error('questions.json must be an array')
  }

  cachedQuestions = questionsData.map((q, i) => validateQuestion(q, i))
  return cachedQuestions
}

export function getQuestionsByDomain(domain: Domain): Question[] {
  return loadQuestions().filter((q) => q.domain === domain)
}

export function getQuestionById(id: string): Question | undefined {
  return loadQuestions().find((q) => q.id === id)
}

export function getQuestionsBySignal(signal: InterventionType): Question[] {
  return loadQuestions().filter((q) => q.interventionSignal === signal)
}

export function getQuestionsByPattern(patternId: string): Question[] {
  return loadQuestions().filter((q) => q.diagnosticPatterns.includes(patternId))
}
