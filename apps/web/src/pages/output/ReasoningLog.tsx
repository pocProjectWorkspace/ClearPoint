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

// ── Group config ────────────────────────────────────────────────

const GROUP_CONFIG: Record<string, { label: string; icon: string; color: string; description: string }> = {
  score: {
    label: 'Domain Scores',
    icon: '📊',
    color: 'border-l-blue-500',
    description: 'How each domain scored and why — based on assessment responses',
  },
  pattern: {
    label: 'Diagnostic Patterns',
    icon: '🔍',
    color: 'border-l-amber-500',
    description: 'Patterns the engine evaluated against your assessment data',
  },
  rootCause: {
    label: 'Root Causes',
    icon: '🎯',
    color: 'border-l-red-500',
    description: 'Identified problems with evidence chain from assessment responses',
  },
  roadmapItem: {
    label: 'Roadmap Actions',
    icon: '📋',
    color: 'border-l-green-500',
    description: 'Why each action was recommended and what root cause it addresses',
  },
  businessCase: {
    label: 'Business Case',
    icon: '💰',
    color: 'border-l-purple-500',
    description: 'How financial values were derived from domain scores and engagement inputs',
  },
}

// ── Parse explanation into bullet points ─────────────────────────

function parseExplanation(text: string): string[] {
  // Split on sentence boundaries, keeping meaningful chunks
  const sentences = text
    .split(/(?<=[.!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10)

  return sentences
}

// ── Direction badge ─────────────────────────────────────────────

function DirectionBadge({ direction }: { direction: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
        direction === 'positive'
          ? 'bg-green-50 text-green-700'
          : 'bg-red-50 text-red-700'
      }`}
    >
      {direction === 'positive' ? '↑ Strength' : '↓ Gap'}
    </span>
  )
}

// ── Reasoning entry card ────────────────────────────────────────

function ReasoningCard({ entry, groupColor }: { entry: ReasoningEntry; groupColor: string }) {
  const [expanded, setExpanded] = useState(false)
  const bullets = parseExplanation(entry.explanation)

  // Determine card accent based on output type
  const isTriggered = entry.explanation.toLowerCase().includes('triggered') || entry.explanation.toLowerCase().includes('fired')
  const isNotTriggered = entry.explanation.toLowerCase().includes('not triggered') || entry.explanation.toLowerCase().includes('did not trigger')

  return (
    <div className={`rounded-lg border border-navy-100 bg-white mb-3 overflow-hidden border-l-4 ${groupColor}`}>
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-body-xs text-navy-400">{entry.outputId}</span>
          {isTriggered && !isNotTriggered && (
            <span className="rounded-full bg-green-50 text-green-700 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
              Triggered
            </span>
          )}
          {isNotTriggered && (
            <span className="rounded-full bg-navy-50 text-navy-400 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
              Not triggered
            </span>
          )}
        </div>
      </div>

      {/* Bullet-point explanation */}
      <div className="px-5 pb-4">
        <ul className="space-y-2">
          {bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-navy-300 shrink-0" />
              <span className="font-body text-body-sm text-navy-700 leading-relaxed">{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Contributing factors */}
      {entry.contributingFactors && entry.contributingFactors.length > 0 && (
        <div className="border-t border-navy-50">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-5 py-3 font-body text-body-xs text-navy-500 hover:text-navy-700 hover:bg-navy-50/50 transition-colors"
          >
            <span>
              {expanded ? 'Hide' : 'Show'} evidence ({entry.contributingFactors.length} factors)
            </span>
            <span className="text-navy-300">{expanded ? '▴' : '▾'}</span>
          </button>

          {expanded && (
            <div className="px-5 pb-4 space-y-2">
              {entry.contributingFactors.map((factor: ContributingFactor, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-lg bg-navy-50/50 px-4 py-3"
                >
                  <DirectionBadge direction={factor.direction} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {factor.questionId && (
                        <span className="font-mono text-body-xs font-medium text-navy-600">{factor.questionId}</span>
                      )}
                      {factor.patternId && (
                        <span className="font-mono text-body-xs font-medium text-navy-600">{factor.patternId}</span>
                      )}
                      <span className="font-mono text-body-xs text-navy-300">
                        weight: {typeof factor.weight === 'number' ? factor.weight.toFixed(1) : factor.weight}
                      </span>
                    </div>
                    <p className="font-body text-body-xs text-navy-500 leading-relaxed">{factor.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
      await api.runDiagnostic(engagementId, true)
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
          Complete evidence chain — every score, pattern, and recommendation traced back to assessment data
        </p>

        <TabBar engagementId={engagementId!} activeTab="reasoning" />

        {/* Explanation */}
        <div className="rounded-lg border border-navy-100 bg-white p-5 mb-8">
          <h3 className="font-display text-body-md text-navy-900 mb-2">What is this page?</h3>
          <div className="font-body text-body-sm text-navy-600 space-y-1.5">
            <p>
              The reasoning log provides <strong>full transparency</strong> into how every diagnostic output was derived.
              Each entry traces back to specific assessment responses. Nothing is a black box.
            </p>
            <ul className="list-disc list-inside text-navy-500 space-y-1">
              <li><strong>Domain Scores</strong> — which questions pulled the score up or down, and why</li>
              <li><strong>Diagnostic Patterns</strong> — which combinations of scores triggered (or didn't trigger) each pattern</li>
              <li><strong>Root Causes</strong> — how patterns were combined into named findings with severity</li>
              <li><strong>Roadmap Actions</strong> — why each action was recommended and which root cause it addresses</li>
              <li><strong>Business Case</strong> — how dollar values were derived from domain scores and engagement inputs</li>
            </ul>
          </div>
        </div>

        {totalEntries === 0 ? (
          <p className="font-body text-body-sm italic text-navy-400">
            No reasoning entries generated.
          </p>
        ) : (
          <div className="space-y-10">
            {groupOrder.map(type => {
              const entries = groups[type]
              if (!entries || entries.length === 0) return null
              const config = GROUP_CONFIG[type] || { label: type, icon: '', color: 'border-l-navy-300', description: '' }

              return (
                <section key={type}>
                  <div className="mb-4">
                    <h2 className="font-display text-display-sm text-navy-900">
                      {config.label}
                      <span className="ml-2 font-body text-body-xs text-navy-400 font-normal">
                        ({entries.length})
                      </span>
                    </h2>
                    {config.description && (
                      <p className="font-body text-body-xs text-navy-400 mt-1">{config.description}</p>
                    )}
                  </div>
                  {entries.map((entry, idx) => (
                    <ReasoningCard
                      key={`${entry.outputId}-${idx}`}
                      entry={entry}
                      groupColor={config.color}
                    />
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
