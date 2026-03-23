import { useState } from 'react'
import type { EngagementDraft } from '../../../store/engagementStore'

type StepProps = {
  draft: EngagementDraft
  setDraft: (partial: Partial<EngagementDraft>) => void
  onNext: (data: Record<string, unknown>) => Promise<void>
  onBack: () => void
}

export default function StepAmbitionCalibration({ draft, setDraft, onNext, onBack }: StepProps) {
  const [costReductionPct, setCostReductionPct] = useState(
    draft.ambitionTargets?.costReductionPct ?? 0
  )
  const [productivityGainPct, setProductivityGainPct] = useState(
    draft.ambitionTargets?.productivityGainPct ?? 0
  )
  const [revenueImpactPct, setRevenueImpactPct] = useState(
    draft.ambitionTargets?.revenueImpactPct ?? 0
  )
  const [customMetric, setCustomMetric] = useState(
    draft.ambitionTargets?.customMetric ?? ''
  )
  const [customTarget, setCustomTarget] = useState<number | ''>(
    draft.ambitionTargets?.customTarget ?? ''
  )
  const [saving, setSaving] = useState(false)

  const allEmpty = costReductionPct === 0 && productivityGainPct === 0 && revenueImpactPct === 0

  const handleNext = async () => {
    setSaving(true)
    try {
      const ambitionTargets: Record<string, unknown> = {
        costReductionPct,
        productivityGainPct,
        revenueImpactPct,
      }
      if (customMetric.trim()) {
        ambitionTargets.customMetric = customMetric.trim()
      }
      if (customTarget !== '' && customTarget !== undefined) {
        ambitionTargets.customTarget = customTarget
      }
      setDraft({ ambitionTargets: ambitionTargets as EngagementDraft['ambitionTargets'] })
      await onNext({ ambitionTargets })
    } finally {
      setSaving(false)
    }
  }

  const clamp = (val: number) => Math.min(100, Math.max(0, val))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-display-lg text-navy-900">Ambition calibration</h2>
        <p className="font-body text-body-md text-navy-500 mt-2">
          Define the client&apos;s 12-month targets. These set the benchmark for the business case.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="font-body text-body-sm font-medium text-navy-700 block mb-1">
            Cost Reduction Target (%)
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={100}
              value={costReductionPct}
              onChange={(e) => setCostReductionPct(clamp(Number(e.target.value) || 0))}
              className="w-full rounded-lg border border-navy-200 px-4 py-3 pr-10 font-body text-body-md text-navy-800 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-body text-body-md text-navy-400">
              %
            </span>
          </div>
        </div>

        <div>
          <label className="font-body text-body-sm font-medium text-navy-700 block mb-1">
            Productivity Gain Target (%)
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={100}
              value={productivityGainPct}
              onChange={(e) => setProductivityGainPct(clamp(Number(e.target.value) || 0))}
              className="w-full rounded-lg border border-navy-200 px-4 py-3 pr-10 font-body text-body-md text-navy-800 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-body text-body-md text-navy-400">
              %
            </span>
          </div>
        </div>

        <div>
          <label className="font-body text-body-sm font-medium text-navy-700 block mb-1">
            Revenue Impact Target (%)
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={100}
              value={revenueImpactPct}
              onChange={(e) => setRevenueImpactPct(clamp(Number(e.target.value) || 0))}
              className="w-full rounded-lg border border-navy-200 px-4 py-3 pr-10 font-body text-body-md text-navy-800 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-body text-body-md text-navy-400">
              %
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-navy-100 pt-6 mt-6 space-y-4">
        <div>
          <label className="font-body text-body-sm font-medium text-navy-700 block mb-1">
            Custom Metric Name
          </label>
          <input
            type="text"
            value={customMetric}
            onChange={(e) => setCustomMetric(e.target.value)}
            placeholder="e.g., Customer Satisfaction Score"
            className="w-full rounded-lg border border-navy-200 px-4 py-3 font-body text-body-md text-navy-800 placeholder:text-navy-300 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
          />
        </div>

        <div>
          <label className="font-body text-body-sm font-medium text-navy-700 block mb-1">
            Custom Target Value
          </label>
          <input
            type="number"
            value={customTarget}
            onChange={(e) => setCustomTarget(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g., 85"
            className="w-full rounded-lg border border-navy-200 px-4 py-3 font-body text-body-md text-navy-800 placeholder:text-navy-300 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-navy-50 border border-navy-100 rounded-lg p-5 flex gap-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-navy-300 text-navy-400 flex items-center justify-center font-body text-body-xs font-semibold">
          i
        </span>
        <p className="font-body text-body-sm text-navy-600">
          These targets become the benchmark for your business case. The tool will show whether the
          recommended interventions are sufficient to reach them.
        </p>
      </div>

      {allEmpty && (
        <p className="font-body text-body-sm text-amber-600">
          Consider adding at least one target so your business case has a benchmark.
        </p>
      )}

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="bg-white border border-navy-200 text-navy-800 rounded-lg px-6 py-3 font-body text-body-md font-medium hover:bg-navy-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={saving}
          className={
            saving
              ? 'bg-navy-200 text-navy-400 cursor-not-allowed rounded-lg px-6 py-3 font-body text-body-md font-medium'
              : 'bg-navy-800 text-warm-50 rounded-lg px-6 py-3 font-body text-body-md font-medium hover:bg-navy-900 transition-colors'
          }
        >
          {saving ? 'Saving...' : 'Next'}
        </button>
      </div>
    </div>
  )
}
