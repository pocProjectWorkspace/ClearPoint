import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { api } from '../../lib/api'
import { DOMAINS } from '../../lib/constants'
import { useUIStore } from '../../store/uiStore'
import type { DiagnosticResult, RootCause, PatternMatch, ReasoningEntry, MaturityBand } from '@mindssparc/shared-types'

// ── Tab bar shared across all output pages ──────────────────────

const TABS = [
  { label: 'Diagnosis', path: 'diagnosis' },
  { label: 'Intervention Map', path: 'intervention-map' },
  { label: 'Roadmap', path: 'roadmap' },
  { label: 'Business Case', path: 'business-case' },
  { label: 'Reasoning', path: 'reasoning' },
]

function TabBar({ engagementId, activeTab }: { engagementId: string; activeTab: string }) {
  return (
    <nav className="mb-8 flex gap-6 border-b border-navy-100">
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

// ── Maturity band color map ─────────────────────────────────────

const MATURITY_COLORS: Record<MaturityBand, string> = {
  nascent: '#DC2626',
  developing: '#D97706',
  established: '#CA8A04',
  advanced: '#2563EB',
  leading: '#059669',
}

const MATURITY_LABELS: Record<MaturityBand, string> = {
  nascent: 'Foundational',
  developing: 'Emerging',
  established: 'Developing',
  advanced: 'Advanced',
  leading: 'Leading',
}

// ── Score dot colors ────────────────────────────────────────────

const SCORE_DOT_COLORS: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-blue-500',
  5: 'bg-green-500',
}

// ── Severity styling ────────────────────────────────────────────

const SEVERITY_STYLES: Record<string, { border: string; bg: string; dot: string }> = {
  critical: { border: 'border-l-red-600', bg: 'bg-red-50', dot: 'bg-red-600' },
  high: { border: 'border-l-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-600' },
  medium: { border: 'border-l-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-600' },
  low: { border: 'border-l-gray-500', bg: 'bg-gray-50', dot: 'bg-gray-500' },
}

// ── Custom bar label ────────────────────────────────────────────

function BarLabel(props: any) {
  const { x, y, width, height, value, index, data, clientMode } = props
  const entry = data[index]
  if (!entry) return null
  return (
    <text
      x={x + width + 8}
      y={y + height / 2}
      dy={4}
      className="font-mono"
      style={{ fontSize: 12, fill: '#1e293b' }}
    >
      {clientMode
        ? MATURITY_LABELS[entry.maturityBand as MaturityBand] || entry.maturityBand
        : `${Math.round(entry.score)} · ${MATURITY_LABELS[entry.maturityBand as MaturityBand] || entry.maturityBand}`}
    </text>
  )
}

// ── Root cause card ─────────────────────────────────────────────

function RootCauseCard({
  rootCause,
  reasoningEntry,
  index = 0,
  clientMode = false,
}: {
  rootCause: RootCause
  reasoningEntry?: ReasoningEntry
  index?: number
  clientMode?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const style = SEVERITY_STYLES[rootCause.severity] || SEVERITY_STYLES.low

  return (
    <div
      className={`animate-fade-in-up rounded-lg border-l-4 ${style.border} ${style.bg} p-5 mb-4`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`inline-block h-2 w-2 rounded-full ${style.dot}`} />
        <span className="font-mono text-body-xs uppercase tracking-wider text-navy-500">
          {rootCause.severity}
        </span>
      </div>

      <h3 className="font-display text-body-lg text-navy-900">{rootCause.name}</h3>
      <p className="font-body text-body-sm text-navy-700 mt-2">{rootCause.description}</p>

      {reasoningEntry && (
        <p className="mt-3 border-l-2 border-navy-100 pl-4 font-body text-body-sm italic text-navy-600">
          {reasoningEntry.explanation}
        </p>
      )}

      {!clientMode && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 font-body text-body-xs text-navy-500 hover:text-navy-700 transition-colors"
          >
            {expanded ? 'Hide evidence' : `Show evidence (${rootCause.evidenceQuestionIds.length} questions)`}
          </button>

          {expanded && (
            <div className="mt-3 space-y-1">
              {rootCause.evidenceQuestionIds.map(qId => (
                <div key={qId} className="flex items-center gap-2 font-body text-body-xs text-navy-600">
                  <span className="font-mono text-navy-400 w-16 shrink-0">{qId}</span>
                  <span className="truncate">{qId}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Pattern row ─────────────────────────────────────────────────

function PatternRow({ pattern }: { pattern: PatternMatch }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-navy-50 last:border-0">
      <span
        className={`inline-block h-2 w-2 rounded-full ${pattern.fired ? 'bg-green-500' : 'bg-gray-300'}`}
      />
      <span className="font-body text-body-sm text-navy-700 flex-1">{pattern.patternName}</span>
      {pattern.fired ? (
        <span className="font-mono text-body-xs uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded">
          Fired
        </span>
      ) : (
        <span className="font-mono text-body-xs text-navy-400">Not triggered</span>
      )}
      {pattern.fired && (
        <span className="font-mono text-body-xs uppercase tracking-wider text-navy-400 bg-navy-50 px-2 py-0.5 rounded">
          {pattern.severity}
        </span>
      )}
    </div>
  )
}

// ── Loading skeleton ────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-warm-50">
      <div className="mx-auto max-w-content px-6 py-12">
        <div className="h-10 w-64 bg-navy-100 rounded animate-pulse mb-8" />
        <div className="flex gap-6 border-b border-navy-100 mb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-6 w-24 bg-navy-50 rounded animate-pulse mb-3" />
          ))}
        </div>
        <div className="h-6 w-40 bg-navy-100 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-navy-50 rounded animate-pulse" />
          ))}
        </div>
        <div className="h-6 w-40 bg-navy-100 rounded animate-pulse mt-10 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-navy-50 rounded-lg animate-pulse" />
          ))}
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
      await api.runDiagnostic(engagementId)
      window.location.reload()
    } catch {
      setRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="mx-auto max-w-content px-6 py-12">
        <h1 className="font-display text-display-lg text-navy-900">Diagnosis summary</h1>
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

// ── Main component ──────────────────────────────────────────────

export default function DiagnosisSummary() {
  const { engagementId } = useParams()
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const mode = useUIStore(s => s.mode)
  const clientMode = mode === 'client'

  async function handleExport() {
    setExporting(true)
    try {
      const blob = await api.exportPdf(engagementId!)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clearpoint-report.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* error state */ }
    finally { setExporting(false) }
  }

  useEffect(() => {
    api
      .getDiagnosticResult(engagementId!)
      .then(res => setResult(res.data as DiagnosticResult))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [engagementId])

  const [patternsExpanded, setPatternsExpanded] = useState(false)

  if (loading) return <LoadingSkeleton />
  if (error || !result) return <ErrorState message={error || 'No data'} engagementId={engagementId!} />

  // Prepare chart data
  const chartData = result.domainScores.map(ds => {
    const domainMeta = DOMAINS.find(d => d.code === ds.domain)
    return {
      name: domainMeta?.name || ds.domain,
      score: Math.round(ds.percentage),
      maturityBand: ds.maturityBand,
    }
  })

  const chartHeight = Math.max(200, chartData.length * 40 + 40)

  // Build a lookup from outputId to reasoning entry
  const reasoningByOutputId: Record<string, ReasoningEntry> = {}
  result.reasoningLog.forEach(entry => {
    reasoningByOutputId[entry.outputId] = entry
  })

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="mx-auto max-w-content px-6 py-12">
        <h1 className="font-display text-display-lg text-navy-900 mb-2">Diagnosis summary</h1>
        <p className="font-body text-body-sm text-navy-400 mb-8">
          Generated {new Date(result.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>

        <div className="flex items-end justify-between">
          <TabBar engagementId={engagementId!} activeTab="diagnosis" />
          <button onClick={handleExport} disabled={exporting}
            className="mb-8 rounded-lg border border-navy-200 bg-white px-4 py-2 font-body text-body-sm text-navy-600 hover:bg-navy-50 disabled:opacity-50">
            {exporting ? 'Generating...' : 'Export PDF'}
          </button>
        </div>

        {/* Domain scores */}
        <section>
          <h2 className="font-display text-display-sm text-navy-900 mb-4">Domain scores</h2>

          <div className="rounded-lg border border-navy-100 bg-white p-6">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 120, bottom: 0, left: 0 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={180}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 13, fill: '#1e293b', fontFamily: 'Source Sans 3, sans-serif' }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={MATURITY_COLORS[entry.maturityBand as MaturityBand] || '#94a3b8'}
                    />
                  ))}
                  <LabelList
                    content={(props: any) => <BarLabel {...props} data={chartData} clientMode={clientMode} />}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Root causes */}
        <section className="mt-10">
          <h2 className="font-display text-display-sm text-navy-900 mb-4">Root causes</h2>

          {result.rootCauses.length === 0 ? (
            <p className="font-body text-body-sm text-navy-400 italic">
              No root causes identified. All domains appear healthy.
            </p>
          ) : (
            result.rootCauses.map((rc, index) => (
              <RootCauseCard
                key={rc.id}
                rootCause={rc}
                reasoningEntry={reasoningByOutputId[rc.id]}
                index={index}
                clientMode={clientMode}
              />
            ))
          )}
        </section>

        {/* Pattern summary — consultant only */}
        {!clientMode && (
          <section className="mt-10">
            <button
              onClick={() => setPatternsExpanded(!patternsExpanded)}
              className="font-body text-body-sm text-navy-500 hover:text-navy-700 transition-colors"
            >
              {patternsExpanded ? 'Hide pattern results' : `Show all pattern results (${result.patterns.length})`}
            </button>

            {patternsExpanded && (
              <div className="mt-4 rounded-lg border border-navy-100 bg-white p-5">
                {result.patterns.map(p => (
                  <PatternRow key={p.patternId} pattern={p} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
