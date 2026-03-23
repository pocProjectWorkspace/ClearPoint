// ── Types ─────────────────────────────────────────────────────────

type DomainCompleteProps = {
  domain: string
  domainName: string
  score: number
  maturityBand: string
  answers: {
    questionId: string
    questionText: string
    rawScore: number
    weightedScore: number
  }[]
  patternSignals: string[]
  isConsultantMode: boolean
  consultantNote: string
  onNoteChange: (note: string) => void
  onReviewAnswers: () => void
  onContinue: () => void
  onSaveAndExit: () => void
  onGoDeeperInDomain: () => void
  isLastDomain: boolean
  nextDomainName: string
  remainingDomains: number
  estimatedMinutesRemaining: number
  adaptiveRecommendation?: {
    needsExpansion: boolean
    reason: string
    additionalQuestionCount: number
  }
}

// ── Domain colour map ─────────────────────────────────────────────

const DOMAIN_BADGE_COLORS: Record<
  string,
  { bg: string; text: string }
> = {
  CRV: { bg: 'bg-blue-100', text: 'text-blue-700' },
  MKT: { bg: 'bg-purple-100', text: 'text-purple-700' },
  SVC: { bg: 'bg-teal-100', text: 'text-teal-700' },
  OPS: { bg: 'bg-amber-100', text: 'text-amber-700' },
  PPL: { bg: 'bg-pink-100', text: 'text-pink-700' },
  FIN: { bg: 'bg-slate-100', text: 'text-slate-700' },
  TEC: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  PRD: { bg: 'bg-green-100', text: 'text-green-700' },
}

// ── Maturity band colours ─────────────────────────────────────────

const MATURITY_COLORS: Record<string, string> = {
  nascent: 'text-red-600',
  developing: 'text-orange-500',
  established: 'text-yellow-600',
  advanced: 'text-blue-600',
  leading: 'text-green-600',
}

// ── Score badge colour ────────────────────────────────────────────

function scoreBadgeClasses(score: number): string {
  if (score >= 4) return 'bg-emerald-100 text-emerald-700'
  if (score >= 3) return 'bg-yellow-100 text-yellow-700'
  if (score >= 2) return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-700'
}

// ── Component ─────────────────────────────────────────────────────

export default function DomainComplete({
  domain,
  domainName,
  score,
  maturityBand,
  answers,
  patternSignals,
  isConsultantMode,
  consultantNote,
  onNoteChange,
  onReviewAnswers,
  onContinue,
  onSaveAndExit,
  onGoDeeperInDomain,
  isLastDomain,
  nextDomainName,
  remainingDomains,
  estimatedMinutesRemaining,
  adaptiveRecommendation,
}: DomainCompleteProps) {
  const badgeColor = DOMAIN_BADGE_COLORS[domain] ?? {
    bg: 'bg-navy-100',
    text: 'text-navy-700',
  }
  const bandColor = MATURITY_COLORS[maturityBand] ?? 'text-navy-600'
  const bandLabel =
    maturityBand.charAt(0).toUpperCase() + maturityBand.slice(1)
  const roundedScore = Math.round(score)

  // Sort answers by score to find strongest and weakest
  const sorted = [...answers].sort((a, b) => b.rawScore - a.rawScore)
  const strongest = sorted.slice(0, 2)
  const weakest = sorted.slice(-2).reverse()

  // Truncate question text
  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + '...' : text

  return (
    <div className="rounded-xl border border-navy-100 bg-white p-8 shadow-sm">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex rounded-full px-3 py-1 font-body text-body-xs font-semibold ${badgeColor.bg} ${badgeColor.text}`}
        >
          {domain}
        </span>
        <span className="font-body text-body-xs text-navy-400">
          Domain complete
        </span>
      </div>

      <h2 className="mt-4 font-display text-display-md text-navy-900">
        {domainName}
      </h2>

      {/* ── Score ────────────────────────────────────────────────── */}
      <div className="mt-8 text-center">
        <p className={`font-mono text-display-xl font-bold ${bandColor}`}>
          {roundedScore}
        </p>
        <p className={`mt-1 font-body text-body-md font-medium ${bandColor}`}>
          {bandLabel}
        </p>
        <p className="mt-1 font-body text-body-xs text-navy-400">
          {answers.length} questions answered
        </p>
      </div>

      {/* ── Score breakdown ──────────────────────────────────────── */}
      <div className="mt-8 space-y-6">
        {/* Strongest areas */}
        {strongest.length > 0 && (
          <div>
            <h3 className="mb-3 font-body text-body-sm font-semibold text-navy-700">
              Strongest areas
            </h3>
            <div className="space-y-2">
              {strongest.map((a) => (
                <div
                  key={a.questionId}
                  className="flex items-center gap-3 rounded-lg border-l-[3px] border-emerald-400 bg-emerald-50/50 px-4 py-3"
                >
                  <p className="flex-1 font-body text-body-sm text-navy-700">
                    {truncate(a.questionText, 80)}
                  </p>
                  <span
                    className={`flex-shrink-0 rounded-full px-2.5 py-0.5 font-mono text-body-xs font-semibold ${scoreBadgeClasses(
                      a.rawScore
                    )}`}
                  >
                    {a.rawScore}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Areas for attention */}
        {weakest.length > 0 && (
          <div>
            <h3 className="mb-3 font-body text-body-sm font-semibold text-navy-700">
              Areas for attention
            </h3>
            <div className="space-y-2">
              {weakest.map((a) => (
                <div
                  key={a.questionId}
                  className="flex items-center gap-3 rounded-lg border-l-[3px] border-red-400 bg-red-50/50 px-4 py-3"
                >
                  <p className="flex-1 font-body text-body-sm text-navy-700">
                    {truncate(a.questionText, 80)}
                  </p>
                  <span
                    className={`flex-shrink-0 rounded-full px-2.5 py-0.5 font-mono text-body-xs font-semibold ${scoreBadgeClasses(
                      a.rawScore
                    )}`}
                  >
                    {a.rawScore}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Pattern signals (consultant only) ───────────────────── */}
      {isConsultantMode && patternSignals.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 font-body text-body-sm font-semibold text-navy-700">
            Pattern signals detected
          </h3>
          <div className="rounded-lg bg-navy-50 p-4">
            <ul className="space-y-1.5">
              {patternSignals.map((signal, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 font-body text-body-sm text-navy-600"
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-navy-400" />
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Consultant note ─────────────────────────────────────── */}
      {isConsultantMode && (
        <div className="mt-6">
          <label className="mb-2 block font-body text-body-sm font-medium text-navy-700">
            Consultant notes for this domain
          </label>
          <textarea
            value={consultantNote}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Add observations, follow-up questions, or context not captured in scores..."
            rows={3}
            className="w-full rounded-lg border border-navy-200 p-3 font-body text-body-sm text-navy-800 placeholder:text-navy-300 focus:border-navy-400 focus:outline-none focus:ring-1 focus:ring-navy-400"
          />
        </div>
      )}

      {/* ── Adaptive expansion recommendation (consultant mode) ── */}
      {isConsultantMode && adaptiveRecommendation && (
        <div className={`mt-8 rounded-lg border p-5 ${
          adaptiveRecommendation.needsExpansion
            ? 'border-amber-200 bg-amber-50'
            : 'border-emerald-200 bg-emerald-50'
        }`}>
          <p className={`font-body text-body-sm font-medium ${
            adaptiveRecommendation.needsExpansion ? 'text-amber-800' : 'text-emerald-800'
          }`}>
            {adaptiveRecommendation.needsExpansion
              ? 'Mixed signals detected — deeper assessment recommended'
              : 'Signal is clear — no further questions needed for this domain'}
          </p>
          <p className="mt-1 font-body text-body-xs text-navy-500">
            {adaptiveRecommendation.reason}
          </p>
          {adaptiveRecommendation.needsExpansion && adaptiveRecommendation.additionalQuestionCount > 0 && (
            <button
              type="button"
              onClick={onGoDeeperInDomain}
              className="mt-3 rounded-lg border border-amber-300 bg-white px-4 py-2 font-body text-body-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
            >
              Go deeper (+{adaptiveRecommendation.additionalQuestionCount} questions)
            </button>
          )}
        </div>
      )}

      {/* ── Session pacing ─────────────────────────────────────── */}
      {!isLastDomain && (
        <div className="mt-8 rounded-lg bg-navy-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-body-sm font-medium text-navy-700">
                {remainingDomains} domain{remainingDomains > 1 ? 's' : ''} remaining
              </p>
              <p className="mt-0.5 font-body text-body-xs text-navy-400">
                Estimated {estimatedMinutesRemaining} minutes left
              </p>
            </div>
            <button
              type="button"
              onClick={onSaveAndExit}
              className="rounded-lg border border-navy-200 bg-white px-4 py-2 font-body text-body-sm text-navy-600 transition-colors hover:bg-navy-100"
            >
              Save & continue later
            </button>
          </div>
          <p className="mt-3 font-body text-body-xs italic text-navy-400">
            Your answers are saved automatically. You can close this session and resume from exactly where you left off.
          </p>
        </div>
      )}

      {/* ── CTAs ────────────────────────────────────────────────── */}
      <div className="mt-8 flex items-center justify-between border-t border-navy-100 pt-6">
        <button
          type="button"
          onClick={onReviewAnswers}
          className="rounded-lg border border-navy-200 bg-white px-5 py-2.5 font-body text-body-sm text-navy-700 transition-colors hover:bg-navy-50"
        >
          Review answers
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="rounded-lg bg-navy-800 px-6 py-2.5 font-body text-body-sm font-medium text-warm-50 transition-colors hover:bg-navy-700"
        >
          {isLastDomain
            ? 'Complete Assessment \u2192'
            : `Continue to ${nextDomainName} \u2192`}
        </button>
      </div>
    </div>
  )
}
