import { useState } from 'react'
import type { EngagementDraft } from '../../../store/engagementStore'

type StepProps = {
  draft: EngagementDraft
  setDraft: (partial: Partial<EngagementDraft>) => void
  onNext: (data: Record<string, unknown>) => Promise<void>
  onBack?: () => void
}

const DOMAINS = [
  { code: 'CRV', name: 'Customer & Revenue', description: 'Sales execution, pipeline, account management' },
  { code: 'MKT', name: 'Marketing & Demand', description: 'Lead generation, campaign ops, market intelligence' },
  { code: 'SVC', name: 'Service & Retention', description: 'Support operations, customer success, churn prevention' },
  { code: 'OPS', name: 'Operations & Fulfillment', description: 'Supply chain, logistics, production, quality' },
  { code: 'PPL', name: 'People & Organisation', description: 'Talent, workforce planning, culture, change management' },
  { code: 'FIN', name: 'Finance & Risk', description: 'Budgeting, forecasting, compliance, risk management' },
  { code: 'TEC', name: 'Technology & Data', description: 'Infrastructure, data governance, integration, security' },
  { code: 'PRD', name: 'Product & Innovation', description: 'R&D pipeline, product lifecycle, innovation process' },
] as const

export default function StepDomainScoping({ draft, onNext, onBack }: StepProps) {
  const [selected, setSelected] = useState<string[]>(
    (draft.domainsInScope as string[]) ?? []
  )
  const [saving, setSaving] = useState(false)

  function toggle(code: string) {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const questionCount = selected.length * 24
  const tooFew = selected.length < 2

  async function handleNext() {
    if (tooFew) return
    setSaving(true)
    try {
      await onNext({ domainsInScope: selected })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="font-display text-display-lg text-navy-900">
        Domain scoping
      </h1>
      <p className="text-navy-500 mt-2 text-body-lg font-body">
        Select the domains to assess. Each adds approximately 24 questions.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {DOMAINS.map((domain) => {
          const isSelected = selected.includes(domain.code)
          return (
            <button
              key={domain.code}
              type="button"
              onClick={() => toggle(domain.code)}
              className={`relative text-left rounded-lg p-5 transition-all ${
                isSelected
                  ? 'border-2 border-navy-700 bg-navy-50'
                  : 'border border-navy-200 bg-white hover:shadow-sm hover:border-navy-300'
              }`}
            >
              {isSelected && (
                <span className="absolute top-3 right-3 text-navy-700">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.667 5L7.5 14.167 3.333 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}
              <span className="font-mono text-body-xs text-navy-400 block">
                {domain.code}
              </span>
              <span className="font-display text-body-lg text-navy-900 block mt-0.5">
                {domain.name}
              </span>
              <span className="text-body-sm text-navy-500 mt-1 block font-body">
                {domain.description}
              </span>
            </button>
          )
        })}
      </div>

      {/* Question count */}
      <div className="mt-6">
        <span className="font-mono text-body-md text-navy-600">
          ~{questionCount} questions in scope
        </span>
      </div>

      {tooFew && (
        <p className="mt-2 text-body-sm text-amber-600 font-body">
          Select at least 2 domains to continue.
        </p>
      )}

      {/* Bottom bar */}
      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="bg-white border border-navy-200 text-navy-800 rounded-lg px-6 py-3 font-body font-medium hover:bg-navy-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={tooFew || saving}
          className={
            tooFew || saving
              ? 'bg-navy-200 text-navy-400 cursor-not-allowed rounded-lg px-6 py-3 font-body font-medium'
              : 'bg-navy-800 text-warm-50 rounded-lg px-6 py-3 font-body font-medium hover:bg-navy-900 transition-colors'
          }
        >
          Next
        </button>
      </div>
    </div>
  )
}
