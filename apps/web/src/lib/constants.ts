import type { Domain, InterventionType, MaturityBand } from '@mindssparc/shared-types'

export const DOMAINS: { code: Domain; name: string }[] = [
  { code: 'CRV', name: 'Customer & Revenue' },
  { code: 'MKT', name: 'Marketing & Demand' },
  { code: 'SVC', name: 'Service & Retention' },
  { code: 'OPS', name: 'Operations & Fulfillment' },
  { code: 'PPL', name: 'People & Organisation' },
  { code: 'FIN', name: 'Finance & Risk' },
  { code: 'TEC', name: 'Technology & Data' },
  { code: 'PRD', name: 'Product & Innovation' },
]

export const INTERVENTION_TYPES: { code: InterventionType; name: string; description: string }[] = [
  { code: 'PROCESS', name: 'Process', description: 'Workflow design problem' },
  { code: 'DIGITIZE', name: 'Digitize', description: 'Data not being captured' },
  { code: 'INTEGRATE', name: 'Integrate', description: 'Systems exist but do not connect' },
  { code: 'AUTOMATE', name: 'Automate', description: 'Repetitive manual work' },
  { code: 'ANALYTICS', name: 'Analytics', description: 'Insight and visibility gaps' },
  { code: 'AI', name: 'AI', description: 'Judgment-at-scale opportunity' },
]

export const MATURITY_LABELS: Record<MaturityBand, { label: string; color: string }> = {
  nascent: { label: 'Nascent', color: 'text-red-600' },
  developing: { label: 'Developing', color: 'text-orange-600' },
  established: { label: 'Established', color: 'text-amber-600' },
  advanced: { label: 'Advanced', color: 'text-emerald-600' },
  leading: { label: 'Leading', color: 'text-green-600' },
}

export const API_BASE = import.meta.env.VITE_API_URL || ''
