import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { useEngagementStore } from '../../store/engagementStore'
import { formatDate } from '../../lib/formatters'

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

const STATUS_STYLES: Record<string, string> = {
  setup: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  complete: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const STATUS_LABELS: Record<string, string> = {
  setup: 'Setup',
  in_progress: 'In Progress',
  complete: 'Complete',
}

export default function EngagementList() {
  const navigate = useNavigate()
  const { consultant, logout } = useAuth()
  const { resetDraft, loadDraft } = useEngagementStore()
  const [engagements, setEngagements] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    api.listEngagements()
      .then((res) => setEngagements(res.data.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleNewEngagement() {
    resetDraft()
    navigate('/setup/new?step=1')
  }

  function handleEdit(engagement: Record<string, unknown>) {
    // Load the engagement data into the store and navigate to setup
    loadDraft(engagement as any)
    navigate('/setup/new?step=1')
  }

  function handleAction(engagement: Record<string, unknown>) {
    const status = engagement.status as string
    const id = engagement.id as string
    if (status === 'setup') {
      loadDraft(engagement as any)
      navigate(`/setup/new?step=1`)
    } else if (status === 'in_progress') {
      navigate(`/session/${id}`)
    } else {
      navigate(`/output/${id}/diagnosis`)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await api.deleteEngagement(id)
      setEngagements(prev => prev.filter(e => e.id !== id))
    } catch {
      // silently fail
    } finally {
      setDeleting(null)
      setConfirmDelete(null)
    }
  }

  const actionLabel = (status: string) => {
    if (status === 'setup') return 'Continue Setup'
    if (status === 'in_progress') return 'Resume Session'
    return 'View Results'
  }

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Header */}
      <header className="border-b border-navy-100 bg-white">
        <div className="mx-auto flex max-w-content items-center justify-between px-6 py-4">
          <h1 className="font-display text-display-sm tracking-tight text-navy-900">ClearPoint</h1>
          <div className="flex items-center gap-4">
            <span className="font-body text-body-sm text-navy-500">{consultant?.name}</span>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="font-body text-body-sm text-navy-400 transition-colors hover:text-navy-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-content px-6 pt-10 pb-20">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-display-lg text-navy-900">Engagements</h2>
          <button
            onClick={handleNewEngagement}
            className="rounded-lg bg-navy-800 px-6 py-2.5 font-body text-body-sm font-medium text-warm-50 transition-colors hover:bg-navy-900"
          >
            New Engagement
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg border border-navy-100 bg-white" />
            ))}
          </div>
        ) : engagements.length === 0 ? (
          <div className="rounded-lg border border-navy-100 bg-white px-8 py-16 text-center">
            <h3 className="font-display text-display-sm text-navy-800">No engagements yet</h3>
            <p className="mx-auto mt-3 max-w-md font-body text-body-md text-navy-500">
              Start your first assessment by creating a new engagement. You will configure
              the domains, weights, and targets before the client session.
            </p>
            <button
              onClick={handleNewEngagement}
              className="mt-6 rounded-lg bg-navy-800 px-8 py-3 font-body text-body-md font-medium text-warm-50 transition-colors hover:bg-navy-900"
            >
              Create first engagement
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {engagements.map((eng) => {
              const status = eng.status as string
              const id = eng.id as string
              const domains = (eng.domainsInScope as string[]) || []
              const isDeleting = deleting === id

              return (
                <div
                  key={id}
                  className={`rounded-lg border border-navy-100 bg-white px-6 py-5 transition-shadow hover:shadow-sm ${isDeleting ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-display text-body-lg font-medium text-navy-900">
                          {(eng.clientName as string) || 'Untitled'}
                        </h3>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 font-body text-body-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.setup}`}
                        >
                          {STATUS_LABELS[status] || status}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-4 font-body text-body-sm text-navy-400">
                        {eng.name ? <span>{String(eng.name)}</span> : null}
                        {eng.industry ? (
                          <span>{INDUSTRY_LABELS[String(eng.industry)] || String(eng.industry)}</span>
                        ) : null}
                        {domains.length > 0 ? <span>{domains.length} domains</span> : null}
                        {eng.updatedAt ? <span>{formatDate(String(eng.updatedAt))}</span> : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Edit button — available before completion */}
                      {status !== 'complete' && (
                        <button
                          onClick={() => handleEdit(eng)}
                          className="rounded-lg border border-navy-200 bg-white px-4 py-2 font-body text-body-sm text-navy-500 transition-colors hover:bg-navy-50 hover:text-navy-700"
                        >
                          Edit
                        </button>
                      )}

                      {/* Primary action */}
                      <button
                        onClick={() => handleAction(eng)}
                        className="rounded-lg border border-navy-200 bg-white px-5 py-2 font-body text-body-sm font-medium text-navy-700 transition-colors hover:bg-navy-50"
                      >
                        {actionLabel(status)}
                      </button>

                      {/* Delete */}
                      {confirmDelete === id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(id)}
                            disabled={isDeleting}
                            className="rounded-lg bg-red-600 px-3 py-2 font-body text-body-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {isDeleting ? '...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="rounded-lg border border-navy-200 px-3 py-2 font-body text-body-xs text-navy-500 hover:bg-navy-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(id)}
                          className="rounded-lg border border-navy-200 bg-white px-3 py-2 font-body text-body-xs text-navy-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          title="Delete engagement"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
