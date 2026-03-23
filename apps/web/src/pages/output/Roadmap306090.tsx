import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../lib/api'
import type { DiagnosticResult, RoadmapItem, ReasoningEntry, InterventionType, RoadmapPhase } from '@mindssparc/shared-types'

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

// ── Intervention type badge styles ──────────────────────────────

const INTERVENTION_BADGE: Record<InterventionType, string> = {
  PROCESS: 'bg-gray-100 text-gray-700',
  DIGITIZE: 'bg-amber-100 text-amber-700',
  INTEGRATE: 'bg-blue-100 text-blue-700',
  AUTOMATE: 'bg-indigo-100 text-indigo-700',
  ANALYTICS: 'bg-teal-100 text-teal-700',
  AI: 'bg-purple-100 text-purple-700',
}

// ── Action card ─────────────────────────────────────────────────

function ActionCard({
  item,
  allItems,
  reasoningEntry,
}: {
  item: RoadmapItem
  allItems: RoadmapItem[]
  reasoningEntry?: ReasoningEntry
}) {
  const [expanded, setExpanded] = useState(false)

  const prereqTitles = item.prerequisiteIds
    .map(pid => allItems.find(r => r.id === pid)?.title)
    .filter(Boolean)

  return (
    <div className="rounded-lg border border-navy-100 bg-white p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-150">
      <span
        className={`inline-block rounded px-2 py-0.5 font-mono text-body-xs uppercase tracking-wider ${
          INTERVENTION_BADGE[item.interventionType] || 'bg-gray-100 text-gray-700'
        }`}
      >
        {item.interventionType}
      </span>

      <h4 className="font-body text-body-md font-medium text-navy-900 mt-2">{item.title}</h4>

      <span className="inline-block font-mono text-body-xs text-navy-400 mt-1">
        ~{item.estimatedEffort}
      </span>

      <p className="font-body text-body-sm text-navy-600 mt-2">{item.expectedOutcome}</p>

      {prereqTitles.length > 0 && (
        <p className="mt-2 font-body text-body-xs italic text-amber-600">
          &rarr; Requires: {prereqTitles.join(', ')}
        </p>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 font-body text-body-xs text-navy-500 hover:text-navy-700 transition-colors"
      >
        {expanded ? 'Hide reasoning' : 'Why this action?'}
      </button>

      {expanded && reasoningEntry && (
        <p className="mt-2 border-l-2 border-navy-100 pl-4 font-body text-body-sm italic text-navy-600">
          {reasoningEntry.explanation}
        </p>
      )}
      {expanded && !reasoningEntry && (
        <p className="mt-2 font-body text-body-xs italic text-navy-400">
          No reasoning entry available for this item.
        </p>
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
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(col => (
            <div key={col} className="space-y-4">
              <div className="h-8 w-24 bg-navy-100 rounded animate-pulse" />
              {[1, 2].map(card => (
                <div key={card} className="h-40 bg-navy-50 rounded-lg animate-pulse" />
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
        <h1 className="font-display text-display-lg text-navy-900">Roadmap</h1>
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

// ── Phase column ────────────────────────────────────────────────

const PHASE_HEADER_STYLES: Record<number, string> = {
  30: 'bg-navy-900 text-warm-50',
  60: 'bg-navy-700 text-warm-50',
  90: 'bg-slate-600 text-warm-50',
}

function PhaseColumn({
  phase,
  label,
  items,
  allItems,
  reasoningByOutputId,
}: {
  phase: RoadmapPhase
  label: string
  items: RoadmapItem[]
  allItems: RoadmapItem[]
  reasoningByOutputId: Record<string, ReasoningEntry>
}) {
  const headerStyle = PHASE_HEADER_STYLES[phase] || 'bg-navy-900 text-warm-50'

  return (
    <div>
      <div className={`mb-4 rounded-lg px-4 py-3 ${headerStyle}`}>
        <h3 className="font-display text-display-sm">{label}</h3>
        <span className="font-body text-body-xs opacity-75">({items.length} actions)</span>
      </div>

      {items.length === 0 ? (
        <div className="border-2 border-dashed border-navy-100 rounded-lg p-8 text-center text-navy-400 italic">
          No actions in this phase
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ActionCard
                item={item}
                allItems={allItems}
                reasoningEntry={reasoningByOutputId[item.id]}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────

export default function Roadmap306090() {
  const { engagementId } = useParams()
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getDiagnosticResult(engagementId!)
      .then(res => setResult(res.data as DiagnosticResult))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [engagementId])

  if (loading) return <LoadingSkeleton />
  if (error || !result) return <ErrorState message={error || 'No data'} engagementId={engagementId!} />

  const reasoningByOutputId: Record<string, ReasoningEntry> = {}
  result.reasoningLog.forEach(entry => {
    reasoningByOutputId[entry.outputId] = entry
  })

  const phase30 = result.roadmap.filter(r => r.phase === 30)
  const phase60 = result.roadmap.filter(r => r.phase === 60)
  const phase90 = result.roadmap.filter(r => r.phase === 90)

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="mx-auto max-w-content px-6 py-12">
        <h1 className="font-display text-display-lg text-navy-900 mb-2">Roadmap</h1>
        <p className="font-body text-body-sm text-navy-400 mb-8">
          Sequenced actions across 30, 60, and 90 days
        </p>

        <TabBar engagementId={engagementId!} activeTab="roadmap" />

        <div className="grid grid-cols-3 gap-6">
          <PhaseColumn
            phase={30}
            label="30 Days"
            items={phase30}
            allItems={result.roadmap}
            reasoningByOutputId={reasoningByOutputId}
          />
          <PhaseColumn
            phase={60}
            label="60 Days"
            items={phase60}
            allItems={result.roadmap}
            reasoningByOutputId={reasoningByOutputId}
          />
          <PhaseColumn
            phase={90}
            label="90 Days"
            items={phase90}
            allItems={result.roadmap}
            reasoningByOutputId={reasoningByOutputId}
          />
        </div>
      </div>
    </div>
  )
}
