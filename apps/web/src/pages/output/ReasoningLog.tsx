import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { useUIStore } from '../../store/uiStore'
import type { DiagnosticResult, ReasoningEntry, ContributingFactor } from '@mindssparc/shared-types'

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

// ── Group label ─────────────────────────────────────────────────

const GROUP_LABELS: Record<string, string> = {
  score: 'Scores',
  pattern: 'Patterns',
  rootCause: 'Root Causes',
  roadmapItem: 'Roadmap Items',
  businessCase: 'Business Case',
}

// ── Reasoning entry card ────────────────────────────────────────

function ReasoningCard({ entry }: { entry: ReasoningEntry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-lg border border-navy-100 bg-white p-4 mb-3">
      <p className="font-mono text-body-xs text-navy-400 mb-1">{entry.outputId}</p>
      <p className="font-body text-body-sm text-navy-700">{entry.explanation}</p>

      {entry.contributingFactors && entry.contributingFactors.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 font-body text-body-xs text-navy-500 hover:text-navy-700 transition-colors"
          >
            {expanded
              ? 'Hide contributing factors'
              : `Show contributing factors (${entry.contributingFactors.length})`}
          </button>

          {expanded && (
            <div className="mt-3 space-y-2">
              {entry.contributingFactors.map((factor: ContributingFactor, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 font-body text-body-xs"
                >
                  <span
                    className={`mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                      factor.direction === 'positive' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {factor.questionId && (
                        <span className="font-mono text-navy-400">{factor.questionId}</span>
                      )}
                      {factor.patternId && (
                        <span className="font-mono text-navy-400">{factor.patternId}</span>
                      )}
                      <span className="font-mono text-navy-300">
                        w={factor.weight.toFixed(2)}
                      </span>
                      <span
                        className={`font-mono uppercase tracking-wider ${
                          factor.direction === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {factor.direction}
                      </span>
                    </div>
                    <p className="text-navy-600 mt-0.5">{factor.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Loading skeleton ────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-warm-50">
      <div className="mx-auto max-w-content px-6 py-12">
        <div className="h-10 w-48 bg-navy-100 rounded animate-pulse mb-8" />
        <div className="flex gap-6 border-b border-navy-100 mb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-6 w-24 bg-navy-50 rounded animate-pulse mb-3" />
          ))}
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map(group => (
            <div key={group}>
              <div className="h-6 w-32 bg-navy-100 rounded animate-pulse mb-3" />
              {[1, 2].map(card => (
                <div key={card} className="h-20 bg-navy-50 rounded-lg animate-pulse mb-3" />
              ))}
            </div>
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
        <h1 className="font-display text-display-lg text-navy-900">Reasoning log</h1>
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

export default function ReasoningLog() {
  const { engagementId } = useParams()
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const mode = useUIStore(s => s.mode)

  useEffect(() => {
    api
      .getDiagnosticResult(engagementId!)
      .then(res => setResult(res.data as DiagnosticResult))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [engagementId])

  if (loading) return <LoadingSkeleton />
  if (error || !result) return <ErrorState message={error || 'No data'} engagementId={engagementId!} />

  if (mode === 'client') {
    return (
      <div className="min-h-screen bg-warm-50">
        <div className="mx-auto max-w-content px-6 py-12">
          <h1 className="font-display text-display-lg text-navy-900 mb-2">Reasoning log</h1>
          <p className="font-body text-body-sm text-navy-400 mb-8">
            Full diagnostic reasoning chain
          </p>

          <TabBar engagementId={engagementId!} activeTab="reasoning" />

          <div className="rounded-lg border border-navy-100 bg-white p-12 text-center">
            <p className="font-body text-body-md text-navy-500">
              Detailed reasoning is available in consultant mode.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Group entries by outputType
  const groups: Record<string, ReasoningEntry[]> = {}
  const groupOrder = ['score', 'pattern', 'rootCause', 'roadmapItem', 'businessCase']

  result.reasoningLog.forEach(entry => {
    if (!groups[entry.outputType]) groups[entry.outputType] = []
    groups[entry.outputType].push(entry)
  })

  const totalEntries = result.reasoningLog.length

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="mx-auto max-w-content px-6 py-12">
        <h1 className="font-display text-display-lg text-navy-900 mb-2">Reasoning log</h1>
        <p className="font-body text-body-sm text-navy-400 mb-8">
          {totalEntries} reasoning {totalEntries === 1 ? 'entry' : 'entries'} across all output types
        </p>

        <TabBar engagementId={engagementId!} activeTab="reasoning" />

        {totalEntries === 0 ? (
          <p className="font-body text-body-sm italic text-navy-400">
            No reasoning entries generated.
          </p>
        ) : (
          <div className="space-y-8">
            {groupOrder.map(type => {
              const entries = groups[type]
              if (!entries || entries.length === 0) return null
              return (
                <section key={type}>
                  <h2 className="font-display text-body-lg text-navy-900 mb-3">
                    {GROUP_LABELS[type] || type}
                    <span className="ml-2 font-body text-body-xs text-navy-400">
                      ({entries.length})
                    </span>
                  </h2>
                  {entries.map((entry, idx) => (
                    <ReasoningCard key={`${entry.outputId}-${idx}`} entry={entry} />
                  ))}
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
