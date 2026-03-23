// ── Types ─────────────────────────────────────────────────────────

type SessionCompleteProps = {
  engagementId: string
  domainScores: {
    domain: string
    name: string
    score: number
    maturityBand: string
  }[]
  totalQuestions: number
  answeredQuestions: number
  sessionDuration: string
  onGenerateDiagnosis: () => void
  onSaveAndExit: () => void
}

// ── Maturity band colours ─────────────────────────────────────────

const MATURITY_COLORS: Record<string, string> = {
  nascent: 'text-red-600',
  developing: 'text-orange-500',
  established: 'text-yellow-600',
  advanced: 'text-blue-600',
  leading: 'text-green-600',
}

// ── Domain colour dots ────────────────────────────────────────────

const DOMAIN_DOT_COLORS: Record<string, string> = {
  CRV: 'bg-blue-500',
  MKT: 'bg-purple-500',
  SVC: 'bg-teal-500',
  OPS: 'bg-amber-500',
  PPL: 'bg-pink-500',
  FIN: 'bg-slate-500',
  TEC: 'bg-indigo-500',
  PRD: 'bg-green-500',
}

// ── Component ─────────────────────────────────────────────────────

export default function SessionComplete({
  engagementId,
  domainScores,
  totalQuestions,
  answeredQuestions,
  sessionDuration,
  onGenerateDiagnosis,
  onSaveAndExit,
}: SessionCompleteProps) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-8 shadow-sm">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="text-center">
        {/* Success indicator */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 13L9 17L19 7"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="font-display text-display-lg text-navy-900">
          Assessment complete
        </h2>

        <p className="mt-3 font-body text-body-md text-navy-600">
          {answeredQuestions} questions answered across{' '}
          {domainScores.length} domains
        </p>

        <p className="mt-1 font-body text-body-sm text-navy-400">
          Session time: {sessionDuration}
        </p>
      </div>

      {/* ── Domain scores grid ──────────────────────────────────── */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {domainScores.map((ds) => {
          const bandColor =
            MATURITY_COLORS[ds.maturityBand] ?? 'text-navy-600'
          const dotColor =
            DOMAIN_DOT_COLORS[ds.domain] ?? 'bg-navy-400'
          const bandLabel =
            ds.maturityBand.charAt(0).toUpperCase() +
            ds.maturityBand.slice(1)

          return (
            <div
              key={ds.domain}
              className="rounded-lg border border-navy-100 p-5 transition-colors hover:bg-navy-50/30"
            >
              {/* Domain name */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${dotColor}`}
                />
                <span className="font-body text-body-sm font-medium text-navy-800">
                  {ds.name}
                </span>
              </div>

              {/* Score */}
              <p
                className={`mt-3 font-mono text-display-md font-bold ${bandColor}`}
              >
                {Math.round(ds.score)}
              </p>

              {/* Maturity band label */}
              <p
                className={`mt-0.5 font-body text-body-xs font-medium ${bandColor}`}
              >
                {bandLabel}
              </p>
            </div>
          )
        })}
      </div>

      {/* ── Callout ─────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-navy-100 bg-navy-50 p-5">
        <p className="font-body text-body-sm leading-relaxed text-navy-700">
          The diagnostic engine will now analyse your responses, identify
          patterns across domains, and generate root cause findings with a
          sequenced roadmap. Every recommendation will trace back to specific
          answers given during this session.
        </p>
      </div>

      {/* ── CTAs ────────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onGenerateDiagnosis}
          className="w-full rounded-lg bg-navy-800 px-8 py-3 font-body text-body-sm font-medium text-warm-50 transition-colors hover:bg-navy-700 sm:w-auto"
        >
          Generate Diagnosis &rarr;
        </button>

        <button
          type="button"
          onClick={onSaveAndExit}
          className="w-full rounded-lg border border-navy-200 bg-white px-8 py-3 font-body text-body-sm text-navy-700 transition-colors hover:bg-navy-50 sm:w-auto"
        >
          Save & Review Later
        </button>
      </div>
    </div>
  )
}
