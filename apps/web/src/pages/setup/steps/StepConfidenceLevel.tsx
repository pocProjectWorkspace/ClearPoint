import { useState } from 'react'
import type { EngagementDraft } from '../../../store/engagementStore'

type StepProps = {
  draft: EngagementDraft
  setDraft: (partial: Partial<EngagementDraft>) => void
  onNext: (data: Record<string, unknown>) => Promise<void>
  onBack: () => void
}

const CONFIDENCE_OPTIONS = [
  {
    value: 'high' as const,
    title: 'High',
    subtitle: 'This team tracks KPIs closely. Answers will be data-backed and verifiable.',
    multiplier: '×1.0',
    multiplierNote: 'full weight applied to every answer',
  },
  {
    value: 'medium' as const,
    title: 'Medium',
    subtitle: 'Good operational awareness but some answers will be estimates.',
    multiplier: '×0.85',
    multiplierNote: 'moderate confidence adjustment',
  },
  {
    value: 'low' as const,
    title: 'Low',
    subtitle: 'Largely intuition-based. Treat outputs as directional, not definitive.',
    multiplier: '×0.70',
    multiplierNote: 'significant confidence discount applied',
  },
]

export default function StepConfidenceLevel({ draft, setDraft, onNext, onBack }: StepProps) {
  const [selected, setSelected] = useState<'high' | 'medium' | 'low'>(
    draft.confidenceLevel ?? 'medium'
  )
  const [saving, setSaving] = useState(false)

  const handleNext = async () => {
    setSaving(true)
    try {
      setDraft({ confidenceLevel: selected })
      await onNext({ confidenceLevel: selected })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-display-lg text-navy-900">Confidence level</h2>
        <p className="font-body text-body-md text-navy-500 mt-2">
          How reliable will the client&apos;s answers be? This adjusts the weight of all scores.
        </p>
      </div>

      <div className="space-y-4">
        {CONFIDENCE_OPTIONS.map((option) => {
          const isSelected = selected === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelected(option.value)}
              className={`w-full text-left rounded-lg p-5 cursor-pointer transition-colors ${
                isSelected
                  ? 'border-2 border-navy-700 bg-navy-50'
                  : 'border border-navy-200 bg-white hover:border-navy-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-display text-body-lg text-navy-900">{option.title}</span>
                <span className="font-mono text-body-xs bg-navy-100 text-navy-600 rounded px-2 py-0.5">
                  {option.multiplier}
                </span>
              </div>
              <p className="font-body text-body-sm text-navy-500 mt-1">
                {option.subtitle}
              </p>
              <p className="font-body text-body-xs text-navy-400 mt-1">
                {option.multiplierNote}
              </p>
            </button>
          )
        })}
      </div>

      <p className="font-body text-body-sm text-navy-400 mt-6">
        This affects how scores are calculated. A score of 4 out of 5 with Low confidence counts
        less than the same score with High confidence.
      </p>

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
