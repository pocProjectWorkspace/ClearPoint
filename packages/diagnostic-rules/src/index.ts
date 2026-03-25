import type { DiagnosticRule } from '@mindssparc/shared-types'
import { readFileSync } from 'fs'
import { join } from 'path'

const rulesData = JSON.parse(
  readFileSync(join(__dirname, '..', 'rules.json'), 'utf-8')
)

let cachedRules: DiagnosticRule[] | null = null

export function loadRules(): DiagnosticRule[] {
  if (cachedRules) return cachedRules

  if (!Array.isArray(rulesData)) {
    throw new Error('rules.json must be an array')
  }

  cachedRules = rulesData as DiagnosticRule[]
  return cachedRules
}

export function getRuleById(id: string): DiagnosticRule | undefined {
  return loadRules().find((r) => r.id === id)
}

export function getRulesBySeverity(severity: DiagnosticRule['severity']): DiagnosticRule[] {
  return loadRules().filter((r) => r.severity === severity)
}
