import { useState } from 'react'
import type { EngagementDraft } from '../../../store/engagementStore'

type StepProps = {
  draft: EngagementDraft
  setDraft: (partial: Partial<EngagementDraft>) => void
  onNext: (data: Record<string, unknown>) => Promise<void>
  onBack?: () => void
}

const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology' },
  { value: 'financial_services', label: 'Financial Services' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'energy', label: 'Energy' },
  { value: 'telecommunications', label: 'Telecommunications' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'government', label: 'Government' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
]

const COMPANY_SIZE_OPTIONS = [
  { value: 'startup', label: '<50 employees' },
  { value: 'small', label: '50-200' },
  { value: 'mid_market', label: '200-1,000' },
  { value: 'enterprise', label: '1,000-10,000' },
  { value: 'large_enterprise', label: '10,000+' },
]

const REVENUE_RANGE_OPTIONS = [
  { value: 'under_1m', label: '<$1M' },
  { value: '1m_10m', label: '$1-10M' },
  { value: '10m_50m', label: '$10-50M' },
  { value: '50m_200m', label: '$50-200M' },
  { value: '200m_1b', label: '$200M-1B' },
  { value: 'over_1b', label: '$1B+' },
]

export default function StepEngagementForm({ draft, onNext }: StepProps) {
  const [form, setForm] = useState({
    name: draft.name ?? '',
    clientName: draft.clientName ?? '',
    industry: draft.industry ?? '',
    companySize: draft.companySize ?? '',
    revenueRange: draft.revenueRange ?? '',
    geography: draft.geography ?? '',
    strategicPriorities: draft.strategicPriorities ?? '',
    consultantHypothesis: draft.consultantHypothesis ?? '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = 'Engagement name is required'
    if (!form.clientName.trim()) next.clientName = 'Client name is required'
    if (!form.industry) next.industry = 'Please select an industry'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleNext() {
    if (!validate()) return
    setSaving(true)
    try {
      await onNext({
        name: form.name.trim(),
        clientName: form.clientName.trim(),
        industry: form.industry,
        companySize: form.companySize || undefined,
        revenueRange: form.revenueRange || undefined,
        geography: form.geography.trim() || undefined,
        strategicPriorities: form.strategicPriorities.trim() || undefined,
        consultantHypothesis: form.consultantHypothesis.trim() || undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  const inputClass = (field: string) =>
    `w-full rounded-lg border px-4 py-3 font-body text-body-md text-navy-900 bg-white transition-colors focus:outline-none focus:ring-1 ${
      errors[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
        : 'border-navy-200 focus:border-accent-500 focus:ring-accent-500'
    }`

  return (
    <div>
      <h1 className="font-display text-display-lg text-navy-900">
        New engagement
      </h1>
      <p className="text-navy-500 mt-2 text-body-lg font-body">
        Enter the basic details about this client engagement.
      </p>

      <div className="mt-8 space-y-6">
        {/* Engagement Name */}
        <div className="space-y-4">
          <div>
            <label className="font-body text-body-sm font-medium text-navy-700 block mb-1.5">
              Engagement Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={inputClass('name')}
            />
            {errors.name && (
              <p className="mt-1.5 text-body-sm text-red-600 font-body">{errors.name}</p>
            )}
          </div>

          {/* Client Name */}
          <div>
            <label className="font-body text-body-sm font-medium text-navy-700 block mb-1.5">
              Client Name
            </label>
            <input
              type="text"
              value={form.clientName}
              onChange={(e) => updateField('clientName', e.target.value)}
              className={inputClass('clientName')}
            />
            {errors.clientName && (
              <p className="mt-1.5 text-body-sm text-red-600 font-body">{errors.clientName}</p>
            )}
          </div>
        </div>

        {/* Industry */}
        <div>
          <label className="font-body text-body-sm font-medium text-navy-700 block mb-1.5">
            Industry
          </label>
          <select
            value={form.industry}
            onChange={(e) => updateField('industry', e.target.value)}
            className={inputClass('industry')}
          >
            <option value="">Select an industry</option>
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.industry && (
            <p className="mt-1.5 text-body-sm text-red-600 font-body">{errors.industry}</p>
          )}
        </div>

        {/* Company Size + Revenue Range — side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-body text-body-sm font-medium text-navy-700 block mb-1.5">
              Company Size
            </label>
            <select
              value={form.companySize}
              onChange={(e) => updateField('companySize', e.target.value)}
              className={inputClass('companySize')}
            >
              <option value="">Select size</option>
              {COMPANY_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-body text-body-sm font-medium text-navy-700 block mb-1.5">
              Revenue Range
            </label>
            <select
              value={form.revenueRange}
              onChange={(e) => updateField('revenueRange', e.target.value)}
              className={inputClass('revenueRange')}
            >
              <option value="">Select range</option>
              {REVENUE_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Geography */}
        <div>
          <label className="font-body text-body-sm font-medium text-navy-700 block mb-1.5">
            Geography
          </label>
          <input
            type="text"
            value={form.geography}
            onChange={(e) => updateField('geography', e.target.value)}
            className={inputClass('geography')}
          />
        </div>

        {/* Strategic Priorities */}
        <div>
          <label className="font-body text-body-sm font-medium text-navy-700 block mb-1.5">
            Strategic Priorities
          </label>
          <textarea
            value={form.strategicPriorities}
            onChange={(e) => updateField('strategicPriorities', e.target.value)}
            placeholder="What are the client's top 3 business priorities this year?"
            rows={3}
            className={inputClass('strategicPriorities')}
          />
        </div>

        {/* Consultant Hypothesis */}
        <div>
          <label className="font-body text-body-sm font-medium text-navy-700 block mb-1.5">
            Consultant Hypothesis
          </label>
          <textarea
            value={form.consultantHypothesis}
            onChange={(e) => updateField('consultantHypothesis', e.target.value)}
            placeholder="Where do you expect the biggest gaps to be? What patterns are you watching for?"
            rows={3}
            className={inputClass('consultantHypothesis')}
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-10 flex items-center justify-end">
        {saving && (
          <span className="mr-4 text-body-sm text-navy-500 font-body">Saving...</span>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={saving}
          className={
            saving
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
