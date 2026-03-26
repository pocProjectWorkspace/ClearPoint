import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { formatCurrency } from '../../lib/formatters'
import type { DiagnosticResult } from '@mindssparc/shared-types'

// ── Tab bar ─────────────────────────────────────────────────────

const TABS = [
  { label: 'Diagnosis', path: 'diagnosis' },
  { label: 'Intervention Map', path: 'intervention-map' },
  { label: 'Roadmap', path: 'roadmap' },
  { label: 'Business Case', path: 'business-case' },
  { label: 'Reasoning', path: 'reasoning' },
]

function TabBar({ engagementId, activeTab }: { engagementId: string; activeTab: string }) {
  return (
    <nav className="mb-8 flex gap-4 sm:gap-6 border-b border-navy-100 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      {TABS.map(tab => (
        <Link
          key={tab.path}
          to={`/output/${engagementId}/${tab.path}`}
          className={`pb-3 font-body text-body-sm transition-colors ${
            activeTab === tab.path
              ? 'border-b-2 border-navy-800 font-medium text-navy-900'
              : 'text-navy-400 hover:text-navy-600'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}

// ── Loading skeleton ────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-warm-50">
      <div className="mx-auto max-w-content px-4 sm:px-6 py-8 sm:py-12">
        <div className="h-10 w-48 bg-navy-100 rounded animate-pulse mb-8" />
        <div className="flex gap-6 border-b border-navy-100 mb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-6 w-24 bg-navy-50 rounded animate-pulse mb-3" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-navy-50 rounded-lg animate-pulse" />
          ))}
          <div className="h-28 bg-navy-800 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// ── Error state ─────────────────────────────────────────────────

function ErrorState({ message, engagementId }: { message: string; engagementId: string }) {
  const [running, setRunning] = useState(false)

  const handleGenerate = async () => {
    setRunning(true)
    try {
      await api.runDiagnostic(engagementId, true)
      window.location.reload()
    } catch {
      setRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="mx-auto max-w-content px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="font-display text-display-lg text-navy-900">Business case</h1>
        <div className="mt-8 rounded-lg border border-navy-100 bg-white p-8 text-center">
          <p className="font-body text-body-md text-navy-600 mb-4">
            {message.toLowerCase().includes('not found') || message.toLowerCase().includes('404')
              ? 'Diagnostic results have not been generated yet for this engagement.'
              : message}
          </p>
          <button
            onClick={handleGenerate}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-navy-800 px-6 py-3 font-body text-body-sm font-medium text-warm-50 hover:bg-navy-700 transition-colors disabled:opacity-50"
          >
            {running ? 'Generating...' : 'Generate diagnostic'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tier data ───────────────────────────────────────────────────

const TIERS = [
  {
    key: 'tier01Value' as const,
    label: 'Tier 0-1: Process & Digitise',
    description: 'Fixing broken workflows and capturing currently invisible data',
    formula: 'Problem Cost x Process Opportunity Rate',
    borderColor: 'border-l-4 border-l-slate-400',
  },
  {
    key: 'tier2Value' as const,
    label: 'Tier 2: Automate & Integrate',
    description: 'Connecting systems and removing manual bottlenecks',
    formula: 'Tier 0-1 Value x Automation Lift Factor',
    borderColor: 'border-l-4 border-l-blue-500',
  },
  {
    key: 'tier3Value' as const,
    label: 'Tier 3-4: Analytics & AI',
    description: 'Surfacing insights and applying machine learning where it matters',
    formula: 'Tier 2 Value x AI Uplift Factor',
    borderColor: 'border-l-4 border-l-amber-500',
  },
]

// ── Main component ──────────────────────────────────────────────

export default function BusinessCase() {
  const { engagementId } = useParams()
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inputsExpanded, setInputsExpanded] = useState(false)

  useEffect(() => {
    api
      .getDiagnosticResult(engagementId!)
      .then(res => setResult(res.data as DiagnosticResult))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [engagementId])

  if (loading) return <LoadingSkeleton />
  if (error || !result) return <ErrorState message={error || 'No data'} engagementId={engagementId!} />

  const bc = result.businessCase

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="mx-auto max-w-content px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="font-display text-display-lg text-navy-900 mb-2">Business case</h1>
        <p className="font-body text-body-sm text-navy-400 mb-8">
          Value stack by intervention tier
        </p>

        <TabBar engagementId={engagementId!} activeTab="business-case" />

        {/* Methodology explanation */}
        <div className="rounded-lg border border-navy-100 bg-white p-5 mb-6">
          <h3 className="font-display text-body-md text-navy-900 mb-2">How these values are calculated</h3>
          <div className="font-body text-body-sm text-navy-600 space-y-2">
            <p>
              All values are derived from <strong>your engagement inputs</strong> — not hardcoded benchmarks.
              The calculation chain is fully transparent:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-navy-500">
              <li><strong>Revenue midpoint</strong> — taken from the revenue range you selected during setup (e.g., $200M-1B uses $350M midpoint)</li>
              <li><strong>Domain risk percentage</strong> — each domain carries an industry-standard risk weight (e.g., Operations: 20%, Customer & Revenue: 18%, Finance: 10%)</li>
              <li><strong>Problem intensity</strong> — derived from your domain maturity scores. Lower maturity = higher intensity (score &lt;20 = 100% intensity, score 60-80 = 30%)</li>
              <li><strong>Problem cost per domain</strong> = Revenue midpoint x Domain risk % x Problem intensity</li>
              <li><strong>Tier values</strong> — the total problem cost is allocated across intervention tiers: Process (25%), Automation (35%), Analytics (15%), AI (25% x AI weight)</li>
              <li><strong>Conservative (12-month)</strong> = Total value x 0.65 — assumes partial implementation and adoption lag</li>
              <li><strong>Realistic (24-month)</strong> = Total value x 1.30 — accounts for compounding benefits and full rollout</li>
            </ol>
            <p className="text-navy-400 text-body-xs mt-3">
              Click "Show calculation inputs" below for the exact numbers used in this engagement.
            </p>
          </div>
        </div>

        {/* Problem cost header */}
        <div className="rounded-lg border border-navy-100 bg-white p-6 mb-6">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-body text-body-sm text-navy-500">Total problem cost</span>
              <p className="font-mono text-display-sm text-navy-800 mt-1">
                {formatCurrency(bc.problemCost)}
              </p>
            </div>
            <div className="text-right">
              <span className="font-body text-body-sm text-navy-500">Total addressable value</span>
              <p className="font-mono text-display-sm text-navy-800 mt-1">
                {formatCurrency(bc.totalValue)}
              </p>
            </div>
          </div>
        </div>

        {/* Tier rows */}
        {TIERS.map(tier => (
          <div
            key={tier.key}
            className={`rounded-lg border border-navy-100 bg-white p-6 mb-4 ${tier.borderColor}`}
          >
            <div className="flex items-baseline justify-between">
              <div>
                <h3 className="font-display text-body-lg text-navy-900">{tier.label}</h3>
                <p className="font-body text-body-sm text-navy-500 mt-1">{tier.description}</p>
              </div>
              <p className="font-mono text-display-sm font-bold text-navy-800">
                {formatCurrency(bc[tier.key])}
              </p>
            </div>
            <p className="mt-2 font-mono text-body-xs text-navy-400">{tier.formula}</p>
          </div>
        ))}

        {/* Totals bar */}
        <div className="rounded-lg bg-navy-800 text-warm-50 p-6 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
            <div>
              <p className="font-body text-body-sm text-navy-300">Conservative (12-month)</p>
              <p className="font-mono text-display-sm font-bold text-warm-50 mt-1">
                {formatCurrency(bc.conservative12Month)}
              </p>
              <p className="font-mono text-body-xs text-navy-400 mt-1">x0.65 of total value</p>
            </div>
            <div className="text-right">
              <p className="font-body text-body-sm text-navy-300">Realistic (24-month)</p>
              <p className="font-mono text-display-sm font-bold text-warm-50 mt-1">
                {formatCurrency(bc.realistic24Month)}
              </p>
              <p className="font-mono text-body-xs text-navy-400 mt-1">x1.30 of total value</p>
            </div>
          </div>
        </div>

        {/* Formula inputs */}
        <section className="mt-8">
          <button
            onClick={() => setInputsExpanded(!inputsExpanded)}
            className="font-body text-body-sm text-navy-500 hover:text-navy-700 transition-colors"
          >
            {inputsExpanded ? 'Hide calculation inputs' : 'Show calculation inputs'}
          </button>

          {inputsExpanded && (
            <div className="mt-4 rounded-lg border border-navy-100 bg-white p-6">
              <h4 className="font-display text-body-md text-navy-900 mb-4">Calculation inputs</h4>

              <table className="w-full font-body text-body-sm">
                <tbody>
                  <tr className="border-b border-navy-50">
                    <td className="py-2 text-navy-500">Problem cost</td>
                    <td className="py-2 text-right font-mono text-navy-700">{formatCurrency(bc.problemCost)}</td>
                  </tr>
                  <tr className="border-b border-navy-50">
                    <td className="py-2 text-navy-500">Tier 0-1 value</td>
                    <td className="py-2 text-right font-mono text-navy-700">{formatCurrency(bc.tier01Value)}</td>
                  </tr>
                  <tr className="border-b border-navy-50">
                    <td className="py-2 text-navy-500">Tier 2 value</td>
                    <td className="py-2 text-right font-mono text-navy-700">{formatCurrency(bc.tier2Value)}</td>
                  </tr>
                  <tr className="border-b border-navy-50">
                    <td className="py-2 text-navy-500">Tier 3-4 value</td>
                    <td className="py-2 text-right font-mono text-navy-700">{formatCurrency(bc.tier3Value)}</td>
                  </tr>
                  <tr className="border-b border-navy-50">
                    <td className="py-2 text-navy-500">Total value</td>
                    <td className="py-2 text-right font-mono text-navy-700">{formatCurrency(bc.totalValue)}</td>
                  </tr>
                  <tr className="border-b border-navy-50">
                    <td className="py-2 text-navy-500">Conservative multiplier</td>
                    <td className="py-2 text-right font-mono text-navy-700">x0.65</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-navy-500">Realistic multiplier</td>
                    <td className="py-2 text-right font-mono text-navy-700">x1.30</td>
                  </tr>
                </tbody>
              </table>

              {/* Domain problem costs */}
              {result.domainScores.length > 0 && (
                <>
                  <h4 className="font-display text-body-md text-navy-900 mt-6 mb-3">Domain scores</h4>
                  <table className="w-full font-body text-body-sm">
                    <thead>
                      <tr className="border-b border-navy-100">
                        <th className="py-2 text-left text-navy-500 font-normal">Domain</th>
                        <th className="py-2 text-right text-navy-500 font-normal">Score</th>
                        <th className="py-2 text-right text-navy-500 font-normal">Maturity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.domainScores.map(ds => (
                        <tr key={ds.domain} className="border-b border-navy-50">
                          <td className="py-2 text-navy-700">{ds.domain}</td>
                          <td className="py-2 text-right font-mono text-navy-700">{Math.round(ds.percentage)}%</td>
                          <td className="py-2 text-right font-mono text-navy-400">{ds.maturityBand}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* Priority scores */}
              {bc.priorityScores && bc.priorityScores.length > 0 && (
                <>
                  <h4 className="font-display text-body-md text-navy-900 mt-6 mb-3">Initiative priority ranking</h4>
                  <table className="w-full font-body text-body-sm">
                    <thead>
                      <tr className="border-b border-navy-100">
                        <th className="py-2 text-left text-navy-500 font-normal">Rank</th>
                        <th className="py-2 text-left text-navy-500 font-normal">Initiative</th>
                        <th className="py-2 text-right text-navy-500 font-normal">Priority score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bc.priorityScores.map((ps: any, idx: number) => (
                        <tr key={ps.roadmapItemId} className="border-b border-navy-50">
                          <td className="py-2 font-mono text-body-xs text-navy-600">{idx + 1}</td>
                          <td className="py-2 text-navy-700">{ps.roadmapItemId}</td>
                          <td className="py-2 text-right font-mono font-medium text-navy-900">{ps.totalScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
