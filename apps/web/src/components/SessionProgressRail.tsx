import { useEffect, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────

type DomainProgressState = {
  total: number
  answered: number
  runningScore: number
  maturityBand: string
}

type SessionProgressRailProps = {
  domains: string[]
  domainProgress: Record<string, DomainProgressState>
  currentDomain: string | null
  totalQuestions: number
  answeredQuestions: number
  skippedCount: number
  timerStartedAt: number | null
  isConsultantMode: boolean
  onPause: () => void
}

// ── Domain maps ───────────────────────────────────────────────────

const DOMAIN_COLORS: Record<string, string> = {
  CRV: 'bg-blue-500',
  MKT: 'bg-purple-500',
  SVC: 'bg-teal-500',
  OPS: 'bg-amber-500',
  PPL: 'bg-pink-500',
  FIN: 'bg-slate-500',
  TEC: 'bg-indigo-500',
  PRD: 'bg-green-500',
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

const MATURITY_BAND_COLORS: Record<string, string> = {
  nascent: 'text-red-600',
  Foundational: 'text-red-600',
  Emerging: 'text-orange-500',
  developing: 'text-orange-500',
  Developing: 'text-yellow-600',
  established: 'text-yellow-600',
  Advanced: 'text-blue-600',
  advanced: 'text-blue-600',
  Leading: 'text-green-600',
  leading: 'text-green-600',
}

// ── Format timer ──────────────────────────────────────────────────

function formatTimer(startedAt: number | null): string {
  if (!startedAt) return '00:00:00'
  const elapsed = Math.floor((Date.now() - startedAt) / 1000)
  const h = String(Math.floor(elapsed / 3600)).padStart(2, '0')
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')
  const s = String(elapsed % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

// ── Component ─────────────────────────────────────────────────────

export default function SessionProgressRail({
  domains,
  domainProgress,
  currentDomain,
  totalQuestions,
  answeredQuestions,
  skippedCount,
  timerStartedAt,
  isConsultantMode,
  onPause,
}: SessionProgressRailProps) {
  const [timerDisplay, setTimerDisplay] = useState(
    formatTimer(timerStartedAt)
  )

  // Tick the timer every second
  useEffect(() => {
    if (!timerStartedAt) return
    const interval = setInterval(() => {
      setTimerDisplay(formatTimer(timerStartedAt))
    }, 1000)
    return () => clearInterval(interval)
  }, [timerStartedAt])

  const progressPct =
    totalQuestions > 0
      ? Math.round((answeredQuestions / totalQuestions) * 100)
      : 0

  return (
    <aside className="flex h-screen w-[260px] flex-shrink-0 flex-col border-r border-navy-100 bg-white">
      {/* ── Top section ─────────────────────────────────────────── */}
      <div className="border-b border-navy-100 px-5 py-5">
        {/* Timer */}
        <p className="font-mono text-body-md text-navy-600">{timerDisplay}</p>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
          <div
            className="h-full rounded-full bg-navy-700 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Progress text */}
        <p className="mt-1.5 font-body text-body-xs text-navy-400">
          {answeredQuestions} of {totalQuestions} questions
          {skippedCount > 0 && (
            <span className="ml-1.5 text-amber-500">
              + {skippedCount} skipped
            </span>
          )}
        </p>

        {/* Pause button */}
        <button
          type="button"
          onClick={onPause}
          className="mt-3 w-full rounded-lg border border-navy-200 py-2 font-body text-body-sm text-navy-600 transition-colors hover:bg-navy-50"
        >
          Pause Session
        </button>
      </div>

      {/* ── Domain list ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-3 px-2 font-body text-body-xs font-semibold uppercase tracking-wider text-navy-400">
          Domains
        </p>

        <div className="space-y-1">
          {domains.map((domain) => {
            const progress = domainProgress[domain]
            const isCurrent = domain === currentDomain
            const isComplete =
              progress && progress.answered > 0 && progress.answered >= progress.total
            const isInProgress =
              progress && progress.answered > 0 && progress.answered < progress.total
            const dotColor = DOMAIN_COLORS[domain] ?? 'bg-navy-400'
            const domainName = DOMAIN_NAMES[domain] ?? domain
            const bandColor =
              MATURITY_BAND_COLORS[progress?.maturityBand ?? ''] ??
              'text-navy-400'

            return (
              <div
                key={domain}
                className={`rounded-lg py-3 px-4 transition-colors ${
                  isCurrent
                    ? 'border-l-[3px] border-navy-700 bg-navy-50'
                    : 'border-l-[3px] border-transparent'
                }`}
              >
                {/* Domain name row */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${dotColor}`}
                  />
                  <span className="font-body text-body-sm font-medium text-navy-800">
                    {domainName}
                  </span>

                  {/* Pulsing dot for in-progress */}
                  {isInProgress && (
                    <span className="relative ml-auto flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-navy-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-navy-500" />
                    </span>
                  )}

                  {/* Checkmark for complete */}
                  {isComplete && (
                    <span className="ml-auto text-body-xs text-emerald-500">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 7L6 10L11 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </div>

                {/* Progress count */}
                <p className="mt-1 font-body text-body-xs text-navy-400">
                  {progress?.answered ?? 0}/{progress?.total ?? 0}
                </p>

                {/* Consultant mode: score + maturity band */}
                {isConsultantMode && progress && progress.answered > 0 && (
                  <p className={`mt-0.5 font-body text-body-xs ${bandColor}`}>
                    {Math.round(progress.runningScore)}
                    {progress.maturityBand && (
                      <>
                        {' '}
                        &middot;{' '}
                        {progress.maturityBand.charAt(0).toUpperCase() +
                          progress.maturityBand.slice(1)}
                      </>
                    )}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Footer branding ─────────────────────────────────────── */}
      <div className="border-t border-navy-100 px-5 py-3">
        <p className="font-body text-body-xs text-navy-300">ClearPoint</p>
      </div>
    </aside>
  )
}
