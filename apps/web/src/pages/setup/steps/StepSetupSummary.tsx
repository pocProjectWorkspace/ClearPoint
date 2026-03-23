import type { EngagementDraft } from '../../../store/engagementStore'

type StepProps = {
  draft: EngagementDraft
  onEdit: (step: number) => void
  onBeginAssessment: () => void
  onSaveAndExit: () => void
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
  onEdit: () => void
}) {
  return (
    <div className="flex justify-between items-center border-b border-navy-100 pb-2 mb-4">
      <h3 className="font-display text-body-lg text-navy-900">{title}</h3>
      <button
        type="button"
        onClick={onEdit}
        className="font-body text-body-xs text-accent-600 hover:text-accent-700 cursor-pointer"
      >
        Edit
      </button>
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

export default function StepSetupSummary({
  draft,
  onEdit,
  onBeginAssessment,
  onSaveAndExit,
}: StepProps) {
  const weights = draft.interventionWeights ?? { process: 25, automation: 25, analytics: 25, ai: 25 }
  const targets = draft.ambitionTargets ?? { costReductionPct: 0, productivityGainPct: 0, revenueImpactPct: 0 }
  const confidence = draft.confidenceLevel ?? 'medium'
  const confidenceInfo = CONFIDENCE_DISPLAY[confidence]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-display-lg text-navy-900">Review and confirm</h2>
        <p className="font-body text-body-md text-navy-500 mt-2">
          Review the engagement configuration before starting the assessment.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
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
