import { useState } from 'react'
import type { Question, ConfidenceLevel } from '@mindssparc/shared-types'

// ── Props ───────────────────────────────────────────────────────

type QuestionCardProps = {
  question: Question
  questionNumber: number
  totalQuestions: number
  selectedScore: number | null
  selectedConfidence: ConfidenceLevel
  notes: string
  isConsultantMode: boolean
  isFirst: boolean
  isLast: boolean
  contextCollapsed: boolean
  savedStatus: 'idle' | 'saving' | 'saved' | 'error'
  onScoreSelect: (score: number) => void
  onConfidenceChange: (confidence: ConfidenceLevel) => void
  onNotesChange: (notes: string) => void
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  onToggleContext: () => void
}

// ── Domain colour map ───────────────────────────────────────────

const DOMAIN_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  CRV: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100' },
  MKT: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100' },
  SVC: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', badge: 'bg-teal-100' },
  OPS: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100' },
  PPL: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', badge: 'bg-pink-100' },
  FIN: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', badge: 'bg-slate-100' },
  TEC: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', badge: 'bg-indigo-100' },
  PRD: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', badge: 'bg-green-100' },
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

const CONFIDENCE_OPTIONS: { value: ConfidenceLevel; label: string; multiplier: string }[] = [
  { value: 'high', label: 'High', multiplier: '\u00d71.0' },
  { value: 'medium', label: 'Medium', multiplier: '\u00d70.85' },
  { value: 'low', label: 'Low', multiplier: '\u00d70.70' },
]

const NOTES_MAX_LENGTH = 500

// ── Component ───────────────────────────────────────────────────

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedScore,
  selectedConfidence,
  notes,
  isConsultantMode,
  isFirst,
  isLast,
  contextCollapsed,
  savedStatus,
  onScoreSelect,
  onConfidenceChange,
  onNotesChange,
  onNext,
  onPrevious,
  onSkip,
  onToggleContext,
}: QuestionCardProps) {
  const [notesOpen, setNotesOpen] = useState(notes.length > 0)
  const [guideOpen, setGuideOpen] = useState(false)

  const domainColor = DOMAIN_COLORS[question.domain] ?? DOMAIN_COLORS.CRV
  const domainName = DOMAIN_NAMES[question.domain] ?? question.domain

  const isNextDisabled = selectedScore === null

  return (
    <div className="rounded-xl border border-navy-100 bg-white p-8 shadow-sm">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 font-body text-body-xs font-semibold ${domainColor.badge} ${domainColor.text}`}
        >
          {question.domain}
          <span className="ml-1.5 font-normal opacity-75">{domainName}</span>
        </span>

        <span className="font-mono text-body-xs text-navy-400">
          Question {questionNumber} of {totalQuestions}
        </span>

        <span className="ml-auto font-body text-body-sm text-navy-500">
          {question.capabilityArea}
        </span>
      </div>

      {/* ── Consultant coaching guide ─────────────────────────── */}
      {isConsultantMode && question.consultantGuide && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setGuideOpen(!guideOpen)}
            className={`flex w-full items-center gap-2 rounded-lg border px-4 py-3 text-left transition-all ${
              guideOpen
                ? 'border-amber-300 bg-amber-50'
                : 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300'
            }`}
          >
            <span className="text-amber-600 text-body-sm">
              {guideOpen ? '▾' : '▸'}
            </span>
            <span className="font-body text-body-sm font-medium text-amber-800">
              Consultant guide — how to ask this question
            </span>
          </button>

          {guideOpen && (
            <div className="mt-0 rounded-b-lg border border-t-0 border-amber-200 bg-amber-50/30 px-5 py-4 space-y-3">
              {question.consultantGuide.split('\n\n').map((section, i) => {
                // Parse section headers (HOW TO ASK:, LISTEN FOR:, etc.)
                const colonIdx = section.indexOf(':')
                const hasHeader = colonIdx > 0 && colonIdx < 25 && section === section.trimStart()
                const header = hasHeader ? section.slice(0, colonIdx) : null
                const body = hasHeader ? section.slice(colonIdx + 1).trim() : section.trim()

                if (!body) return null

                return (
                  <div key={i}>
                    {header && (
                      <span className="font-body text-body-xs font-bold uppercase tracking-wider text-amber-700 block mb-1">
                        {header}
                      </span>
                    )}
                    <p className="font-body text-body-sm leading-relaxed text-navy-700">
                      {body}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Pre-answer context ─────────────────────────────────── */}
      <div className="mt-5">
        {contextCollapsed ? (
          <button
            type="button"
            onClick={onToggleContext}
            className="font-body text-body-xs text-navy-400 transition-colors hover:text-navy-600"
          >
            Why this question?
          </button>
        ) : (
          <div className="rounded-r-md border-l-[3px] border-navy-400 bg-blue-50/50 px-5 py-4">
            <div
              className="overflow-hidden transition-all duration-300"
              style={{ maxHeight: contextCollapsed ? 0 : '500px' }}
            >
              <p className="font-body text-body-sm leading-relaxed text-navy-700">
                {question.preAnswerContext}
              </p>

              {isConsultantMode && (
                <p className="mt-2 font-body text-body-xs text-navy-400">
                  This answer contributes to:{' '}
                  <span className="font-medium">
                    {question.diagnosticPatterns.join(', ')}
                  </span>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onToggleContext}
              className="mt-2 font-body text-body-xs text-navy-400 transition-colors hover:text-navy-600"
            >
              Hide context
            </button>
          </div>
        )}
      </div>

      {/* ── Question text ──────────────────────────────────────── */}
      <h2 className="mb-8 mt-6 font-body text-[18px] font-medium leading-relaxed text-navy-900">
        {question.text}
      </h2>

      {/* ── Scale cards — vertical full-width layout ──────────── */}
      <div className="flex flex-col gap-2.5">
        {question.anchors.map((anchor) => {
          const isSelected = selectedScore === anchor.value

          return (
            <button
              key={anchor.value}
              type="button"
              onClick={() => onScoreSelect(isSelected ? 0 : anchor.value)}
              className={`
                flex w-full cursor-pointer items-start gap-4 rounded-lg px-5 py-4 text-left transition-all duration-150
                ${
                  isSelected
                    ? 'border-2 border-navy-800 bg-navy-800 text-warm-50 shadow-md'
                    : 'border border-navy-200 bg-white text-navy-700 hover:border-navy-300 hover:bg-navy-50 hover:shadow-sm'
                }
              `}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-body-lg font-bold ${
                isSelected ? 'bg-warm-50 text-navy-800' : 'bg-navy-50 text-navy-600'
              }`}>
                {anchor.value}
              </span>
              <div className="min-w-0 flex-1">
                <span className={`font-body text-body-md font-semibold ${
                  isSelected ? 'text-warm-50' : 'text-navy-800'
                }`}>
                  {anchor.label}
                </span>
                <span className={`mt-0.5 block font-body text-body-sm leading-snug ${
                  isSelected ? 'text-warm-200' : 'text-navy-500'
                }`}>
                  {anchor.description}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Confidence selector ────────────────────────────────── */}
      <div className="mt-6">
        <div className="flex items-center gap-3">
          <span className="font-body text-body-sm text-navy-500">Confidence</span>

          <div className="flex gap-2">
            {CONFIDENCE_OPTIONS.map((opt) => {
              const isActive = selectedConfidence === opt.value

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onConfidenceChange(opt.value)}
                  className={`
                    rounded-full px-4 py-1.5 font-body text-body-sm transition-colors
                    ${
                      isActive
                        ? 'bg-navy-800 text-warm-50'
                        : 'border border-navy-200 bg-white text-navy-600 hover:bg-navy-50'
                    }
                  `}
                >
                  {opt.label}{' '}
                  <span className={isActive ? 'opacity-75' : 'text-navy-400'}>
                    {opt.multiplier}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <p className="mt-1 font-body text-body-xs text-navy-400">
          How certain is this answer? Affects the weighted score.
        </p>
      </div>

      {/* ── Notes ──────────────────────────────────────────────── */}
      <div className="mt-6">
        {!notesOpen ? (
          <button
            type="button"
            onClick={() => setNotesOpen(true)}
            className="font-body text-body-sm text-navy-400 transition-colors hover:text-navy-600"
          >
            + Add context or notes
          </button>
        ) : (
          <div>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value.slice(0, NOTES_MAX_LENGTH))}
              placeholder="Add any qualitative context, caveats, or examples discussed..."
              rows={3}
              className="w-full rounded-lg border border-navy-200 p-3 font-body text-body-sm text-navy-800 placeholder:text-navy-300 focus:border-navy-400 focus:outline-none focus:ring-1 focus:ring-navy-400"
            />
            <p className="mt-1 text-right font-body text-body-xs text-navy-300">
              {notes.length}/{NOTES_MAX_LENGTH}
            </p>
          </div>
        )}
      </div>

      {/* ── Diagnostic signal preview (consultant only) ────────── */}
      {isConsultantMode && (
        <div className="mt-6 border-t border-navy-100 pt-4">
          <p className="font-mono text-body-xs text-navy-400">
            Signal: {question.interventionSignal} &middot; Weight: {question.baseWeight} &middot; Patterns:{' '}
            {question.diagnosticPatterns.join(', ')}
          </p>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="mt-8 flex items-center justify-between">
        {/* Left: Previous */}
        <div>
          {!isFirst && (
            <button
              type="button"
              onClick={onPrevious}
              className="rounded-lg border border-navy-200 bg-white px-5 py-2.5 font-body text-body-sm text-navy-700 transition-colors hover:bg-navy-50"
            >
              &larr; Previous
            </button>
          )}
        </div>

        {/* Right: Status + Skip + Next */}
        <div className="flex items-center gap-4">
          {/* Save status */}
          {savedStatus === 'saving' && (
            <span className="font-body text-body-xs text-navy-400">Saving...</span>
          )}
          {savedStatus === 'saved' && (
            <span
              className="font-body text-body-xs text-emerald-600"
              style={{
                animation: 'questionCardSavedFade 2s ease-out 1s forwards',
              }}
            >
              Saved
            </span>
          )}
          {savedStatus === 'error' && (
            <span className="font-body text-body-xs text-amber-600">Save failed</span>
          )}

          {/* Skip */}
          <button
            type="button"
            onClick={onSkip}
            className="font-body text-body-sm text-navy-400 transition-colors hover:text-navy-600"
          >
            Skip
          </button>

          {/* Next / Complete */}
          <button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled}
            className={`
              rounded-lg px-6 py-2.5 font-body text-body-sm font-medium transition-colors
              ${
                isNextDisabled
                  ? 'cursor-not-allowed bg-navy-200 text-navy-400'
                  : 'bg-navy-800 text-warm-50 hover:bg-navy-700'
              }
            `}
          >
            {isLast ? 'Complete Domain \u2192' : 'Next Question \u2192'}
          </button>
        </div>
      </div>

      {/* ── Keyframe for saved-fade animation ──────────────────── */}
      <style>{`
        @keyframes questionCardSavedFade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
