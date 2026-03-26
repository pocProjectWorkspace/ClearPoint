import { useState } from 'react'
import type { EngagementDraft } from '../../../store/engagementStore'

type StepProps = {
  draft: EngagementDraft
  onEdit: (step: number) => void
  onBeginAssessment: () => void
  onSaveAndExit: () => void
  onUpdateConfig?: (config: EngagementConfig) => void
}

export type EngagementConfig = {
  questionMode: 'adaptive' | 'all'
  contrastThreshold: number
  stddevThreshold: number
  confidenceThresholdPct: number
  minAnsweredPct: number
}

const DEFAULT_CONFIG: EngagementConfig = {
  questionMode: 'adaptive',
  contrastThreshold: 0.8,
  stddevThreshold: 1.0,
  confidenceThresholdPct: 40,
  minAnsweredPct: 50,
}

const DOMAIN_NAMES: Record<string, string> = {
  CRV: 'Customer & Revenue',
  MKT: 'Marketing & Demand',
  SVC: 'Service & Retention',
  OPS: 'Operations & Fulfillment',
  PPL: 'People & Organisation',
  FIN: 'Finance & Risk',
  TEC: 'Technology & Data',
  PRD: 'Product & Innovation',
}

const INDUSTRY_LABELS: Record<string, string> = {
  technology: 'Technology',
  financial_services: 'Financial Services',
  healthcare: 'Healthcare',
  manufacturing: 'Manufacturing',
  retail: 'Retail',
  energy: 'Energy',
  telecommunications: 'Telecommunications',
  professional_services: 'Professional Services',
  government: 'Government',
  education: 'Education',
  other: 'Other',
}

const SIZE_LABELS: Record<string, string> = {
  startup: '<50 employees',
  small: '50-200',
  mid_market: '200-1,000',
  enterprise: '1,000-10,000',
  large_enterprise: '10,000+',
}

const REVENUE_LABELS: Record<string, string> = {
  under_1m: '<$1M',
  '1m_10m': '$1-10M',
  '10m_50m': '$10-50M',
  '50m_200m': '$50-200M',
  '200m_1b': '$200M-1B',
  over_1b: '$1B+',
}

const CONFIDENCE_DISPLAY: Record<string, { label: string; multiplier: string }> = {
  high: { label: 'High', multiplier: '×1.0' },
  medium: { label: 'Medium', multiplier: '×0.85' },
  low: { label: 'Low', multiplier: '×0.70' },
}

const WEIGHT_COLORS: Record<string, string> = {
  process: 'bg-[#374151]',
  automation: 'bg-[#1D4ED8]',
  analytics: 'bg-[#0891B2]',
  ai: 'bg-[#D97706]',
}

const WEIGHT_LABELS: Record<string, string> = {
  process: 'Process',
  automation: 'Automation',
  analytics: 'Analytics',
  ai: 'AI',
}

function SectionHeader({
  title,
  onEdit,
}: {
  title: string
  onEdit?: () => void
}) {
  return (
    <div className="flex justify-between items-center border-b border-navy-100 pb-2 mb-4">
      <h3 className="font-display text-body-lg text-navy-900">{title}</h3>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="font-body text-body-xs text-accent-600 hover:text-accent-700 cursor-pointer"
        >
          Edit
        </button>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <dt className="text-body-xs uppercase tracking-wide text-navy-400 mb-1 font-body">
        {label}
      </dt>
      <dd className="text-body-md text-navy-800 font-body">{value || '—'}</dd>
    </div>
  )
}

function ConfigSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  description,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  description: string
  format?: (v: number) => string
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <label className="font-body text-body-sm font-medium text-navy-700">{label}</label>
        <span className="font-mono text-body-sm text-navy-800">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-navy-100 rounded-full appearance-none cursor-pointer accent-navy-800"
      />
      <p className="font-body text-body-xs text-navy-400">{description}</p>
    </div>
  )
}

export default function StepSetupSummary({
  draft,
  onEdit,
  onBeginAssessment,
  onSaveAndExit,
  onUpdateConfig,
}: StepProps) {
  const weights = draft.interventionWeights ?? { process: 25, automation: 25, analytics: 25, ai: 25 }
  const targets = draft.ambitionTargets ?? { costReductionPct: 0, productivityGainPct: 0, revenueImpactPct: 0 }
  const confidence = draft.confidenceLevel ?? 'medium'
  const confidenceInfo = CONFIDENCE_DISPLAY[confidence]

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [config, setConfig] = useState<EngagementConfig>(DEFAULT_CONFIG)

  function updateConfig(partial: Partial<EngagementConfig>) {
    const updated = { ...config, ...partial }
    setConfig(updated)
    onUpdateConfig?.(updated)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-display-lg text-navy-900">Review and confirm</h2>
        <p className="font-body text-body-md text-navy-500 mt-2">
          Review the engagement configuration before starting the assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <section>
            <SectionHeader title="Engagement details" onEdit={() => onEdit(1)} />
            <dl className="space-y-3">
              <Field label="Name" value={draft.name} />
              <Field label="Client" value={draft.clientName} />
              <Field label="Industry" value={draft.industry ? INDUSTRY_LABELS[draft.industry] ?? draft.industry : undefined} />
              <Field label="Company Size" value={draft.companySize ? SIZE_LABELS[draft.companySize] ?? draft.companySize : undefined} />
              <Field label="Revenue Range" value={draft.revenueRange ? REVENUE_LABELS[draft.revenueRange] ?? draft.revenueRange : undefined} />
              <Field label="Geography" value={draft.geography} />
              <Field label="Strategic Priorities" value={draft.strategicPriorities} />
              <Field label="Consultant Hypothesis" value={draft.consultantHypothesis} />
            </dl>
          </section>

          <section>
            <SectionHeader title="Domains in scope" onEdit={() => onEdit(2)} />
            <div className="flex flex-wrap gap-2">
              {(draft.domainsInScope ?? []).length > 0 ? (
                (draft.domainsInScope ?? []).map((domain) => (
                  <span
                    key={domain}
                    className="bg-navy-100 text-navy-700 rounded-full px-3 py-1 text-body-sm font-body inline-flex"
                  >
                    {DOMAIN_NAMES[domain] ?? domain}
                  </span>
                ))
              ) : (
                <span className="text-body-sm text-navy-400 font-body">No domains selected</span>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <section>
            <SectionHeader title="Intervention weights" onEdit={() => onEdit(3)} />
            <div className="space-y-3">
              {(['process', 'automation', 'analytics', 'ai'] as const).map((key) => {
                const value = weights[key]
                return (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <span className="font-body text-body-sm text-navy-600">
                        {WEIGHT_LABELS[key]}
                      </span>
                      <span className="font-body text-body-sm text-navy-800 font-medium">
                        {value}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-navy-100 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${WEIGHT_COLORS[key]}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section>
            <SectionHeader title="Ambition targets" onEdit={() => onEdit(4)} />
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-body text-body-sm text-navy-600">Cost Reduction</dt>
                <dd className="font-body text-body-sm text-navy-800 font-medium">
                  {targets.costReductionPct}%
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-body text-body-sm text-navy-600">Productivity Gain</dt>
                <dd className="font-body text-body-sm text-navy-800 font-medium">
                  {targets.productivityGainPct}%
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-body text-body-sm text-navy-600">Revenue Impact</dt>
                <dd className="font-body text-body-sm text-navy-800 font-medium">
                  {targets.revenueImpactPct}%
                </dd>
              </div>
              {targets.customMetric && (
                <div className="flex justify-between">
                  <dt className="font-body text-body-sm text-navy-600">{targets.customMetric}</dt>
                  <dd className="font-body text-body-sm text-navy-800 font-medium">
                    {targets.customTarget ?? '—'}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section>
            <SectionHeader title="Confidence level" onEdit={() => onEdit(5)} />
            <div className="flex items-center gap-3">
              <span className="font-body text-body-md text-navy-800 font-medium">
                {confidenceInfo.label}
              </span>
              <span className="font-mono text-body-xs bg-navy-100 text-navy-600 rounded px-2 py-0.5">
                {confidenceInfo.multiplier}
              </span>
            </div>
          </section>
        </div>
      </div>

      {/* Advanced Configuration */}
      <div className="border-t border-navy-100 pt-6">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 font-body text-body-sm text-navy-500 hover:text-navy-700 transition-colors"
        >
          <span className="font-mono text-body-xs">{showAdvanced ? '−' : '+'}</span>
          {showAdvanced ? 'Hide advanced configuration' : 'Show advanced configuration'}
        </button>

        {showAdvanced && (
          <div className="mt-6 rounded-lg border border-navy-100 bg-white p-6 space-y-8">
            <div>
              <h4 className="font-display text-body-md text-navy-900 mb-1">Assessment configuration</h4>
              <p className="font-body text-body-xs text-navy-400 mb-6">
                These settings control how the assessment session and diagnostic engine behave.
                Default values work well for most engagements. Adjust only if you have specific requirements.
              </p>

              {/* Question delivery mode */}
              <div className="space-y-3 mb-8">
                <label className="font-body text-body-sm font-medium text-navy-700">
                  Question delivery mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateConfig({ questionMode: 'adaptive' })}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      config.questionMode === 'adaptive'
                        ? 'border-navy-800 bg-navy-50'
                        : 'border-navy-200 hover:border-navy-300'
                    }`}
                  >
                    <span className="font-body text-body-sm font-medium text-navy-800 block">
                      Adaptive
                    </span>
                    <span className="font-body text-body-xs text-navy-500 mt-1 block">
                      Starts with 16 priority questions per domain. Expands to detail questions
                      if scores are mixed or moderate. Faster sessions, focused diagnosis.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateConfig({ questionMode: 'all' })}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      config.questionMode === 'all'
                        ? 'border-navy-800 bg-navy-50'
                        : 'border-navy-200 hover:border-navy-300'
                    }`}
                  >
                    <span className="font-body text-body-sm font-medium text-navy-800 block">
                      All questions
                    </span>
                    <span className="font-body text-body-xs text-navy-500 mt-1 block">
                      All questions for selected domains (~20-24 per domain). More thorough
                      coverage, richer pattern detection. Recommended for high-value engagements.
                    </span>
                  </button>
                </div>
                <p className="font-body text-body-xs text-navy-400">
                  <strong>Impact:</strong> More questions means more data for the diagnostic engine.
                  The engine can detect patterns with fewer questions, but more data increases
                  confidence in findings and reduces the chance of missing subtle problems.
                </p>
              </div>

              {/* Pattern matching sensitivity */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-body text-body-sm font-medium text-navy-700 mb-1">
                    Diagnostic sensitivity
                  </h4>
                  <p className="font-body text-body-xs text-navy-400 mb-4">
                    Controls how sensitive the pattern matching engine is. Lower thresholds detect
                    more patterns but may surface weaker signals. Higher thresholds are more
                    conservative and only surface strong, well-evidenced findings.
                  </p>
                </div>

                <ConfigSlider
                  label="Gap detection threshold"
                  value={config.contrastThreshold}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  onChange={v => updateConfig({ contrastThreshold: v })}
                  format={v => `${v.toFixed(1)} points`}
                  description="Minimum score gap between question groups to trigger a pattern (e.g., 'process is strong but data access is weak'). Lower values detect subtler gaps. Default: 0.8 on a 1-5 scale."
                />

                <ConfigSlider
                  label="Inconsistency detection threshold"
                  value={config.stddevThreshold}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  onChange={v => updateConfig({ stddevThreshold: v })}
                  format={v => `${v.toFixed(1)} std dev`}
                  description="Minimum score variance within a domain to flag inconsistent process application. Lower values flag more variance. Default: 1.0 standard deviation."
                />

                <ConfigSlider
                  label="Data trust confidence threshold"
                  value={config.confidenceThresholdPct}
                  min={20}
                  max={80}
                  step={5}
                  onChange={v => updateConfig({ confidenceThresholdPct: v })}
                  format={v => `${v}%`}
                  description="Percentage of answers that must have 'low confidence' to trigger a data trust deficit finding. Lower values are more sensitive. Default: 40%."
                />

                <ConfigSlider
                  label="Minimum answer coverage"
                  value={config.minAnsweredPct}
                  min={25}
                  max={75}
                  step={5}
                  onChange={v => updateConfig({ minAnsweredPct: v })}
                  format={v => `${v}%`}
                  description="Minimum percentage of a rule's questions that must be answered for the rule to evaluate. Lower values allow the engine to work with less data. Default: 50%."
                />
              </div>
            </div>

            {/* Reset to defaults */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setConfig(DEFAULT_CONFIG)
                  onUpdateConfig?.(DEFAULT_CONFIG)
                }}
                className="font-body text-body-xs text-navy-400 hover:text-navy-600 transition-colors"
              >
                Reset to defaults
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-navy-50 rounded-lg p-4 border border-navy-100">
        <p className="font-body text-body-sm text-navy-600">
          This configuration has been saved. It will appear as Page 1 of your final report.
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onSaveAndExit}
          className="bg-white border border-navy-200 text-navy-800 rounded-lg px-6 py-3 font-body text-body-md font-medium hover:bg-navy-50 transition-colors"
        >
          Save &amp; Exit
        </button>
        <button
          type="button"
          onClick={onBeginAssessment}
          className="bg-navy-800 text-warm-50 rounded-lg px-8 py-3.5 font-body text-body-md font-medium hover:bg-navy-900 transition-colors"
        >
          Begin Assessment &rarr;
        </button>
      </div>
    </div>
  )
}
