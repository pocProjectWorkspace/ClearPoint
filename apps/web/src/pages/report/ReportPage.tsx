import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import type {
  DiagnosticResult,
  DomainScore,
  RootCause,
  RoadmapItem,
  BusinessCase,
  ReasoningEntry,
  Engagement,
  Domain,
  InterventionType,
} from '@mindssparc/shared-types'

// ── Domain names ──────────────────────────────────────────────────

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
  startup: 'Startup (<50)',
  small: 'Small (50-200)',
  mid_market: 'Mid-Market (200-1,000)',
  enterprise: 'Enterprise (1,000-10,000)',
  large_enterprise: 'Large Enterprise (10,000+)',
}

const REVENUE_LABELS: Record<string, string> = {
  under_1m: 'Under $1M',
  '1m_10m': '$1M - $10M',
  '10m_50m': '$10M - $50M',
  '50m_200m': '$50M - $200M',
  '200m_1b': '$200M - $1B',
  over_1b: 'Over $1B',
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#DC2626',
  high: '#EA580C',
  medium: '#D97706',
  low: '#6B7280',
}

const INTERVENTION_LABELS: Record<string, string> = {
  PROCESS: 'Process',
  DIGITIZE: 'Digitize',
  INTEGRATE: 'Integrate',
  AUTOMATE: 'Automate',
  ANALYTICS: 'Analytics',
  AI: 'AI',
}

const EFFORT_LABELS: Record<string, string> = {
  days: 'Days',
  weeks: 'Weeks',
  months: 'Months',
}

// ── Helpers ───────────────────────────────────────────────────────

function bandColor(band: string): string {
  switch (band) {
    case 'nascent': return '#EF4444'
    case 'developing': return '#F97316'
    case 'established': return '#F59E0B'
    case 'advanced': return '#10B981'
    case 'leading': return '#059669'
    default: return '#9CA3AF'
  }
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function fetchWithToken(path: string, token: string) {
  const baseUrl = import.meta.env.VITE_API_URL || ''
  const res = await fetch(`${baseUrl}/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

// ── Section components ────────────────────────────────────────────

function CoverPage({ engagement }: { engagement: Engagement }) {
  return (
    <div className="flex flex-col justify-center min-h-[700px]" style={{ breakAfter: 'page' }}>
      <p className="font-display text-[28px] text-navy-900">ClearPoint</p>
      <p className="font-body text-[14px] text-navy-400 mt-1">powered by mindssparc</p>
      <p className="font-body text-[18px] text-navy-500 mt-2">ClearPoint Assessment Report</p>
      <p className="font-display text-[22px] text-navy-800 mt-8">{engagement.clientName}</p>
      <p className="font-body text-[16px] text-navy-500">{engagement.id}</p>
      <p className="font-mono text-[13px] text-navy-400 mt-4">
        {formatDate(engagement.updatedAt || engagement.createdAt)}
      </p>
    </div>
  )
}

function ConfigurationSection({ engagement }: { engagement: Engagement }) {
  return (
    <div style={{ breakAfter: 'page' }}>
      <h2 className="font-display text-[20px] text-navy-900 mb-6 border-b border-navy-100 pb-3">
        Configuration Summary
      </h2>

      <div className="grid grid-cols-2 gap-8">
        {/* Left: engagement details */}
        <div>
          <h3 className="font-body text-[13px] font-medium text-navy-500 uppercase tracking-wider mb-3">
            Engagement Details
          </h3>
          <table className="w-full text-[14px]">
            <tbody>
              <tr className="border-b border-navy-50">
                <td className="py-2 text-navy-500 font-body">Client</td>
                <td className="py-2 text-navy-800 font-body font-medium">{engagement.clientName}</td>
              </tr>
              <tr className="border-b border-navy-50">
                <td className="py-2 text-navy-500 font-body">Industry</td>
                <td className="py-2 text-navy-800 font-body">{INDUSTRY_LABELS[engagement.industry] ?? engagement.industry}</td>
              </tr>
              <tr className="border-b border-navy-50">
                <td className="py-2 text-navy-500 font-body">Company Size</td>
                <td className="py-2 text-navy-800 font-body">{SIZE_LABELS[engagement.companySize] ?? engagement.companySize}</td>
              </tr>
              <tr className="border-b border-navy-50">
                <td className="py-2 text-navy-500 font-body">Revenue</td>
                <td className="py-2 text-navy-800 font-body">{REVENUE_LABELS[engagement.revenueRange] ?? engagement.revenueRange}</td>
              </tr>
              <tr className="border-b border-navy-50">
                <td className="py-2 text-navy-500 font-body">Geography</td>
                <td className="py-2 text-navy-800 font-body">{engagement.geography}</td>
              </tr>
            </tbody>
          </table>

          {/* Domains */}
          <h3 className="font-body text-[13px] font-medium text-navy-500 uppercase tracking-wider mt-6 mb-3">
            Domains in Scope
          </h3>
          <div className="flex flex-wrap gap-2">
            {engagement.domainsInScope.map(d => (
              <span
                key={d}
                className="inline-block rounded-full bg-navy-50 px-3 py-1 font-body text-[12px] text-navy-700"
              >
                {DOMAIN_NAMES[d] ?? d}
              </span>
            ))}
          </div>
        </div>

        {/* Right: weights + confidence */}
        <div>
          <h3 className="font-body text-[13px] font-medium text-navy-500 uppercase tracking-wider mb-3">
            Intervention Weights
          </h3>
          <table className="w-full text-[14px]">
            <tbody>
              <tr className="border-b border-navy-50">
                <td className="py-2 text-navy-500 font-body">Process</td>
                <td className="py-2 text-navy-800 font-mono">{engagement.interventionWeights.process}%</td>
              </tr>
              <tr className="border-b border-navy-50">
                <td className="py-2 text-navy-500 font-body">Automation</td>
                <td className="py-2 text-navy-800 font-mono">{engagement.interventionWeights.automation}%</td>
              </tr>
              <tr className="border-b border-navy-50">
                <td className="py-2 text-navy-500 font-body">Analytics</td>
                <td className="py-2 text-navy-800 font-mono">{engagement.interventionWeights.analytics}%</td>
              </tr>
              <tr className="border-b border-navy-50">
                <td className="py-2 text-navy-500 font-body">AI</td>
                <td className="py-2 text-navy-800 font-mono">{engagement.interventionWeights.ai}%</td>
              </tr>
            </tbody>
          </table>

          <h3 className="font-body text-[13px] font-medium text-navy-500 uppercase tracking-wider mt-6 mb-3">
            Confidence Level
          </h3>
          <p className="font-body text-[14px] text-navy-800 capitalize">{engagement.confidenceLevel}</p>

          <h3 className="font-body text-[13px] font-medium text-navy-500 uppercase tracking-wider mt-6 mb-3">
            Ambition Targets (12-month)
          </h3>
          <table className="w-full text-[14px]">
            <tbody>
              <tr className="border-b border-navy-50">
                <td className="py-2 text-navy-500 font-body">Cost Reduction</td>
                <td className="py-2 text-navy-800 font-mono">{engagement.ambitionTargets.costReductionPct}%</td>
              </tr>
              <tr className="border-b border-navy-50">
                <td className="py-2 text-navy-500 font-body">Productivity Gain</td>
                <td className="py-2 text-navy-800 font-mono">{engagement.ambitionTargets.productivityGainPct}%</td>
              </tr>
              <tr className="border-b border-navy-50">
                <td className="py-2 text-navy-500 font-body">Revenue Impact</td>
                <td className="py-2 text-navy-800 font-mono">{engagement.ambitionTargets.revenueImpactPct}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ExecutiveSummary({ result }: { result: DiagnosticResult }) {
  // Use the businessCase reasoning entry if available, otherwise generate a summary
  const bcEntry = result.reasoningLog.find(e => e.outputType === 'businessCase')
  const rootCauseEntries = result.reasoningLog.filter(e => e.outputType === 'rootCause')

  const avgScore =
    result.domainScores.length > 0
      ? result.domainScores.reduce((s, d) => s + d.percentage, 0) / result.domainScores.length
      : 0

  return (
    <div style={{ breakAfter: 'page' }}>
      <h2 className="font-display text-[20px] text-navy-900 mb-6 border-b border-navy-100 pb-3">
        Executive Summary
      </h2>

      <div className="font-body text-[15px] leading-relaxed text-navy-700 space-y-4">
        {bcEntry ? (
          <p>{bcEntry.explanation}</p>
        ) : (
          <>
            <p>
              This assessment evaluated {result.domainScores.length} domain{result.domainScores.length !== 1 ? 's' : ''}{' '}
              across the organisation, achieving an average maturity score of {avgScore.toFixed(1)} out of 100.
              The diagnostic engine identified {result.rootCauses.length} root cause{result.rootCauses.length !== 1 ? 's' : ''}{' '}
              and generated {result.roadmap.length} recommended action{result.roadmap.length !== 1 ? 's' : ''}{' '}
              across a 30/60/90-day roadmap.
            </p>
            {result.rootCauses.filter(rc => rc.severity === 'critical' || rc.severity === 'high').length > 0 && (
              <p>
                Critical and high-severity findings include:{' '}
                {result.rootCauses
                  .filter(rc => rc.severity === 'critical' || rc.severity === 'high')
                  .map(rc => rc.name)
                  .join(', ')}
                . These require immediate attention and form the foundation of the 30-day action plan.
              </p>
            )}
            {rootCauseEntries.length > 0 && (
              <p>{rootCauseEntries[0].explanation}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function DiagnosisSection({
  domainScores,
  rootCauses,
  reasoningLog,
}: {
  domainScores: DomainScore[]
  rootCauses: RootCause[]
  reasoningLog: ReasoningEntry[]
}) {
  // Find consultant annotations (reasoning entries that mention "consultant" or override)
  const annotations = reasoningLog.filter(
    e => e.explanation.toLowerCase().includes('consultant') || e.explanation.toLowerCase().includes('override')
  )

  return (
    <div style={{ breakAfter: 'page' }}>
      <h2 className="font-display text-[20px] text-navy-900 mb-6 border-b border-navy-100 pb-3">
        Diagnosis
      </h2>

      {/* Domain score bars */}
      <h3 className="font-body text-[14px] font-medium text-navy-700 mb-4">Domain Maturity Scores</h3>
      <div className="mb-8">
        {domainScores.map(ds => (
          <div key={ds.domain} className="flex items-center gap-3 mb-3">
            <span className="w-[120px] text-right text-[13px] text-navy-600 font-body">
              {DOMAIN_NAMES[ds.domain] ?? ds.domain}
            </span>
            <div className="flex-1 h-6 bg-gray-100 rounded">
              <div
                className="h-6 rounded"
                style={{
                  width: `${Math.min(ds.percentage, 100)}%`,
                  backgroundColor: bandColor(ds.maturityBand),
                }}
              />
            </div>
            <span className="w-[100px] text-[13px] font-mono text-navy-700">
              {ds.percentage.toFixed(1)} · {ds.maturityBand}
            </span>
          </div>
        ))}
      </div>

      {/* Root causes */}
      <h3 className="font-body text-[14px] font-medium text-navy-700 mb-4">Root Causes</h3>
      <div className="space-y-3">
        {rootCauses.map(rc => {
          const annotation = annotations.find(a => a.outputId === rc.id)
          return (
            <div
              key={rc.id}
              className="rounded-lg border border-navy-100 p-4"
              style={{
                breakInside: 'avoid',
                borderLeftWidth: '4px',
                borderLeftColor: SEVERITY_COLORS[rc.severity] ?? '#9CA3AF',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-body text-[14px] font-medium text-navy-900">{rc.name}</p>
                  <p className="font-body text-[13px] text-navy-600 mt-1">{rc.description}</p>
                </div>
                <span
                  className="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize"
                  style={{
                    backgroundColor: SEVERITY_COLORS[rc.severity] + '15',
                    color: SEVERITY_COLORS[rc.severity],
                  }}
                >
                  {rc.severity}
                </span>
              </div>
              <p className="font-body text-[12px] text-navy-400 mt-2">
                {rc.evidenceQuestionIds.length} contributing question{rc.evidenceQuestionIds.length !== 1 ? 's' : ''}{' '}
                | Domain: {DOMAIN_NAMES[rc.domain] ?? rc.domain}{' '}
                | Pattern: {rc.evidencePattern}
              </p>
              {annotation && (
                <p className="font-body text-[12px] text-navy-500 mt-2 italic">
                  (Consultant note:) {annotation.explanation}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RoadmapSection({
  roadmap,
  reasoningLog,
}: {
  roadmap: RoadmapItem[]
  reasoningLog: ReasoningEntry[]
}) {
  const phase30 = roadmap.filter(r => r.phase === 30)
  const phase60 = roadmap.filter(r => r.phase === 60)
  const phase90 = roadmap.filter(r => r.phase === 90)

  const annotations = reasoningLog.filter(e => e.outputType === 'roadmapItem')

  const renderCard = (item: RoadmapItem) => {
    const annotation = annotations.find(a => a.outputId === item.id)
    return (
      <div
        key={item.id}
        className="rounded border border-navy-100 p-3 mb-2"
        style={{ breakInside: 'avoid' }}
      >
        <p className="font-body text-[13px] font-medium text-navy-900">{item.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="rounded bg-navy-50 px-2 py-0.5 font-body text-[11px] text-navy-600">
            {INTERVENTION_LABELS[item.interventionType] ?? item.interventionType}
          </span>
          <span className="font-body text-[11px] text-navy-400">
            {EFFORT_LABELS[item.estimatedEffort] ?? item.estimatedEffort}
          </span>
        </div>
        <p className="font-body text-[12px] text-navy-600 mt-1">{item.expectedOutcome}</p>
        {annotation && (
          <p className="font-body text-[11px] text-navy-500 mt-1 italic">
            (Consultant note:) {annotation.explanation}
          </p>
        )}
      </div>
    )
  }

  return (
    <div style={{ breakBefore: 'page' }}>
      <h2 className="font-display text-[20px] text-navy-900 mb-6 border-b border-navy-100 pb-3">
        30/60/90-Day Roadmap
      </h2>

      <div className="grid grid-cols-3 gap-4">
        {/* 30-day */}
        <div>
          <h3 className="font-body text-[13px] font-medium text-navy-500 uppercase tracking-wider mb-3 pb-2 border-b border-navy-100">
            30 Days
          </h3>
          {phase30.length > 0 ? phase30.map(renderCard) : (
            <p className="font-body text-[12px] text-navy-400 italic">No actions in this phase.</p>
          )}
        </div>

        {/* 60-day */}
        <div>
          <h3 className="font-body text-[13px] font-medium text-navy-500 uppercase tracking-wider mb-3 pb-2 border-b border-navy-100">
            60 Days
          </h3>
          {phase60.length > 0 ? phase60.map(renderCard) : (
            <p className="font-body text-[12px] text-navy-400 italic">No actions in this phase.</p>
          )}
        </div>

        {/* 90-day */}
        <div>
          <h3 className="font-body text-[13px] font-medium text-navy-500 uppercase tracking-wider mb-3 pb-2 border-b border-navy-100">
            90 Days
          </h3>
          {phase90.length > 0 ? phase90.map(renderCard) : (
            <p className="font-body text-[12px] text-navy-400 italic">No actions in this phase.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function BusinessCaseSection({ businessCase }: { businessCase: BusinessCase }) {
  return (
    <div style={{ breakBefore: 'page' }}>
      <h2 className="font-display text-[20px] text-navy-900 mb-6 border-b border-navy-100 pb-3">
        Business Case
      </h2>

      <table className="w-full text-[14px] border-collapse">
        <thead>
          <tr className="border-b-2 border-navy-200">
            <th className="py-3 text-left font-body font-medium text-navy-500">Tier</th>
            <th className="py-3 text-right font-body font-medium text-navy-500">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-navy-50">
            <td className="py-3 font-body text-navy-700">Problem Cost (baseline)</td>
            <td className="py-3 text-right font-mono text-navy-800">{formatCurrency(businessCase.problemCost)}</td>
          </tr>
          <tr className="border-b border-navy-50">
            <td className="py-3 font-body text-navy-700">Tier 0-1: Process + Digitize</td>
            <td className="py-3 text-right font-mono text-navy-800">{formatCurrency(businessCase.tier01Value)}</td>
          </tr>
          <tr className="border-b border-navy-50">
            <td className="py-3 font-body text-navy-700">Tier 2: Automate</td>
            <td className="py-3 text-right font-mono text-navy-800">{formatCurrency(businessCase.tier2Value)}</td>
          </tr>
          <tr className="border-b border-navy-50">
            <td className="py-3 font-body text-navy-700">Tier 3: AI Uplift</td>
            <td className="py-3 text-right font-mono text-navy-800">{formatCurrency(businessCase.tier3Value)}</td>
          </tr>
          <tr className="border-b border-navy-200 bg-navy-50/50">
            <td className="py-3 font-body font-medium text-navy-900">Total Value</td>
            <td className="py-3 text-right font-mono font-medium text-navy-900">{formatCurrency(businessCase.totalValue)}</td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="rounded-lg border border-navy-100 p-4">
          <p className="font-body text-[12px] text-navy-500 uppercase tracking-wider mb-1">
            Conservative (12-month)
          </p>
          <p className="font-display text-[24px] text-navy-900">
            {formatCurrency(businessCase.conservative12Month)}
          </p>
        </div>
        <div className="rounded-lg border border-navy-100 p-4">
          <p className="font-body text-[12px] text-navy-500 uppercase tracking-wider mb-1">
            Realistic (24-month)
          </p>
          <p className="font-display text-[24px] text-navy-900">
            {formatCurrency(businessCase.realistic24Month)}
          </p>
        </div>
      </div>
    </div>
  )
}

function ReasoningAppendix({ reasoningLog }: { reasoningLog: ReasoningEntry[] }) {
  return (
    <div style={{ breakBefore: 'page' }}>
      <h2 className="font-display text-[20px] text-navy-900 mb-6 border-b border-navy-100 pb-3">
        Reasoning Appendix
      </h2>

      <table className="w-full text-[12px] border-collapse">
        <thead>
          <tr className="border-b-2 border-navy-200">
            <th className="py-2 pr-3 text-left font-body font-medium text-navy-500 w-[80px]">Type</th>
            <th className="py-2 pr-3 text-left font-body font-medium text-navy-500 w-[100px]">Item</th>
            <th className="py-2 text-left font-body font-medium text-navy-500">Explanation</th>
          </tr>
        </thead>
        <tbody>
          {reasoningLog.map((entry, i) => (
            <tr key={i} className="border-b border-navy-50">
              <td className="py-2 pr-3 font-body text-navy-500 capitalize align-top">
                {entry.outputType}
              </td>
              <td className="py-2 pr-3 font-mono text-navy-600 align-top">
                {entry.outputId}
              </td>
              <td className="py-2 font-body text-navy-700">
                {entry.explanation.length > 150
                  ? entry.explanation.slice(0, 150) + '...'
                  : entry.explanation}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main ReportPage ───────────────────────────────────────────────

export default function ReportPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [engagement, setEngagement] = useState<Engagement | null>(null)
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!id || !token) {
      setError('Missing report ID or access token.')
      setLoaded(true)
      return
    }

    Promise.all([
      fetchWithToken(`/engagements/${id}`, token),
      fetchWithToken(`/diagnostic/${id}`, token),
    ])
      .then(([engRes, diagRes]) => {
        if (engRes.data) setEngagement(engRes.data as Engagement)
        else setError('Could not load engagement data.')

        if (diagRes.data) setResult(diagRes.data as DiagnosticResult)
        else setError('Could not load diagnostic results.')
      })
      .catch(e => setError(e.message))
      .finally(() => setLoaded(true))
  }, [id, token])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="font-body text-[14px] text-navy-500">Loading report...</p>
      </div>
    )
  }

  if (error || !engagement || !result) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="font-body text-[14px] text-red-600">{error || 'Failed to load report data.'}</p>
      </div>
    )
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="mx-auto bg-white" style={{ maxWidth: '800px', padding: '40px 32px' }}>
        {/* Section 1: Cover */}
        <CoverPage engagement={engagement} />

        {/* Section 2: Configuration */}
        <ConfigurationSection engagement={engagement} />

        {/* Section 3: Executive Summary */}
        <ExecutiveSummary result={result} />

        {/* Section 4: Diagnosis */}
        <DiagnosisSection
          domainScores={result.domainScores}
          rootCauses={result.rootCauses}
          reasoningLog={result.reasoningLog}
        />

        {/* Section 5: Roadmap */}
        <RoadmapSection roadmap={result.roadmap} reasoningLog={result.reasoningLog} />

        {/* Section 6: Business Case */}
        <BusinessCaseSection businessCase={result.businessCase} />

        {/* Section 7: Reasoning Appendix */}
        <ReasoningAppendix reasoningLog={result.reasoningLog} />
      </div>

      {/* Puppeteer readiness signal */}
      <div id="report-ready" />
    </>
  )
}
