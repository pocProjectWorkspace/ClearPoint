import { useState } from 'react'
import type { EngagementDraft } from '../../../store/engagementStore'

type StepProps = {
  draft: EngagementDraft
  setDraft: (partial: Partial<EngagementDraft>) => void
  onNext: (data: Record<string, unknown>) => Promise<void>
  onBack?: () => void
}

type WeightKey = 'process' | 'automation' | 'analytics' | 'ai'

type SliderDef = {
  key: WeightKey
  label: string
  color: string
  description: string
}

const SLIDERS: SliderDef[] = [
  {
    key: 'process',
    label: 'Process',
    color: '#374151',
    description: 'Fix broken or absent workflows before adding technology',
  },
  {
    key: 'automation',
    label: 'Automation',
    color: '#1D4ED8',
    description: 'Eliminate repetitive manual tasks with rules and workflow tools',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    color: '#0891B2',
    description: 'Surface insights and improve decision visibility',
  },
  {
    key: 'ai',
    label: 'AI',
    color: '#D97706',
    description: 'Apply machine learning where human judgment is the bottleneck',
  },
]

type Preset = {
  label: string
  values: Record<WeightKey, number>
}

const PRESETS: Preset[] = [
  { label: 'Balanced', values: { process: 25, automation: 25, analytics: 25, ai: 25 } },
  { label: 'Operations Heavy', values: { process: 40, automation: 30, analytics: 20, ai: 10 } },
  { label: 'Growth Focused', values: { process: 20, automation: 20, analytics: 30, ai: 30 } },
  { label: 'AI Ready', values: { process: 15, automation: 20, analytics: 20, ai: 45 } },
]

export default function StepWeightConfig({ draft, onNext, onBack }: StepProps) {
  const [weights, setWeights] = useState<Record<WeightKey, number>>({
    process: draft.interventionWeights?.process ?? 25,
    automation: draft.interventionWeights?.automation ?? 25,
    analytics: draft.interventionWeights?.analytics ?? 25,
    ai: draft.interventionWeights?.ai ?? 25,
  })
  const [saving, setSaving] = useState(false)

  const sum = weights.process + weights.automation + weights.analytics + weights.ai
  const isValid = sum === 100

  function updateWeight(key: WeightKey, value: number) {
    setWeights((prev) => ({ ...prev, [key]: value }))
  }

  function applyPreset(preset: Preset) {
    setWeights({ ...preset.values })
  }

  async function handleNext() {
    if (!isValid) return
    setSaving(true)
    try {
      await onNext({
        interventionWeights: {
          process: weights.process,
          automation: weights.automation,
          analytics: weights.analytics,
          ai: weights.ai,
        },
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="font-display text-display-lg text-navy-900">
        Intervention weights
      </h1>
      <p className="text-navy-500 mt-2 text-body-lg font-body">
        Set the priority balance across intervention types. These weights affect how scores are calculated.
      </p>

      <div className="mt-8 space-y-6">
        {SLIDERS.map((slider) => (
          <div key={slider.key}>
            <div className="flex items-baseline justify-between mb-1">
              <label className="font-body text-body-sm font-medium text-navy-700">
                {slider.label}
              </label>
              <span className="font-mono text-display-sm text-navy-900">
                {weights[slider.key]}
              </span>
            </div>
            <p className="font-body text-body-sm text-navy-500 mb-2">
              {slider.description}
            </p>
            <input
              type="range"
              min={0}
              max={100}
              value={weights[slider.key]}
              onChange={(e) => updateWeight(slider.key, Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: slider.color }}
            />
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-6 flex items-center gap-2">
        <span
          className={`font-mono text-body-md ${
            isValid ? 'text-navy-600' : 'text-amber-600'
          }`}
        >
          Total: {sum}/100
        </span>
        {isValid && (
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-navy-600"
          >
            <path
              d="M16.667 5L7.5 14.167 3.333 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {!isValid && (
          <span className="text-body-sm text-amber-600 font-body">
            Weights must total exactly 100
          </span>
        )}
      </div>

      {/* Presets */}
      <div className="mt-4 flex gap-3 flex-wrap">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset)}
            className="border border-navy-200 rounded-full px-4 py-1.5 text-body-sm font-body text-navy-800 hover:bg-navy-50 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

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
          disabled={!isValid || saving}
          className={
            !isValid || saving
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
