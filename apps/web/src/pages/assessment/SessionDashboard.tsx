import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSessionStore } from '../../store/sessionStore'
import { useUIStore } from '../../store/uiStore'
import { api } from '../../lib/api'
import type { Question, ConfidenceLevel, Domain } from '@mindssparc/shared-types'
import QuestionCard from '../../components/ui/QuestionCard'
import SessionProgressRail from '../../components/SessionProgressRail'
import DomainComplete from './DomainComplete'
import SessionComplete from './SessionComplete'

// ── Domain helpers ──────────────────────────────────────────────

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

// ── Mode Toggle ─────────────────────────────────────────────────

function ModeToggle({
  mode,
  onChange,
}: {
  mode: 'consultant' | 'client'
  onChange: (m: 'consultant' | 'client') => void
}) {
  return (
    <div className="inline-flex rounded-full border border-navy-200 bg-white p-0.5">
      <button
        onClick={() => onChange('consultant')}
        className={`rounded-full px-4 py-1.5 font-body text-body-sm transition-colors ${
          mode === 'consultant'
            ? 'bg-navy-800 text-warm-50'
            : 'text-navy-500 hover:text-navy-700'
        }`}
      >
        Consultant
      </button>
      <button
        onClick={() => onChange('client')}
        className={`rounded-full px-4 py-1.5 font-body text-body-sm transition-colors ${
          mode === 'client'
            ? 'bg-navy-800 text-warm-50'
            : 'text-navy-500 hover:text-navy-700'
        }`}
      >
        Client
      </button>
    </div>
  )
}

// ── Format duration helper ──────────────────────────────────────

function formatDuration(startedAt: number | null): string {
  if (!startedAt) return '00:00:00'
  const elapsed = Math.floor((Date.now() - startedAt) / 1000)
  const h = String(Math.floor(elapsed / 3600)).padStart(2, '0')
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')
  const s = String(elapsed % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

// ── Main Component ──────────────────────────────────────────────

export default function SessionDashboard() {
  const { engagementId } = useParams<{ engagementId: string }>()
  const navigate = useNavigate()

  const sessionStore = useSessionStore()
  const uiStore = useUIStore()

  const [questions, setQuestions] = useState<Map<string, Question>>(new Map())
  const [domainsInScope, setDomainsInScope] = useState<string[]>([])
  const [currentView, setCurrentView] = useState<
    'question' | 'domain-complete' | 'session-complete'
  >('question')
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [selectedConfidence, setSelectedConfidence] =
    useState<ConfidenceLevel>('medium')
  const [notes, setNotes] = useState('')
  const [savedStatus, setSavedStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [contextCollapsed, setContextCollapsed] = useState(false)
  const [questionsAnsweredCount, setQuestionsAnsweredCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completedDomainForReview, setCompletedDomainForReview] = useState<
    string | null
  >(null)
  const [consultantNote, setConsultantNote] = useState('')

  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Derive current question ─────────────────────────────────

  const questionIds: string[] = sessionStore.questionIds ?? []
  const currentQuestionId =
    questionIds[sessionStore.currentIndex] ?? null
  const currentQuestion = currentQuestionId
    ? questions.get(currentQuestionId) ?? null
    : null
  const currentDomain = currentQuestion?.domain ?? null

  // ── Derive domain ordering for questions ────────────────────

  const getDomainForQuestion = useCallback(
    (qId: string) => questions.get(qId)?.domain ?? null,
    [questions]
  )

  // ── Init: load or resume session ────────────────────────────

  useEffect(() => {
    if (!engagementId) return

    const init = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if sessionStore already has this engagement
        if (
          sessionStore.engagementId === engagementId &&
          questionIds.length > 0
        ) {
          // Resume from store — still need questions data
          const res = await api.resumeSession(engagementId)
          const sessionData = res.data
          loadQuestions(sessionData.questions)
          setDomainsInScope(sessionData.domainsInScope ?? [])
          setQuestionsAnsweredCount(
            Object.keys(sessionStore.answers).length
          )
          prefillCurrentAnswer()
        } else {
          // Start or resume from API
          // Check for config from setup wizard
          const configStr = sessionStorage.getItem(`config-${engagementId}`)
          const questionMode = configStr ? JSON.parse(configStr).questionMode || 'adaptive' : 'adaptive'
          const res = await api.startSession(engagementId, questionMode)
          const sessionData = res.data

          sessionStore.setSession({
            sessionId: sessionData.sessionId,
            engagementId,
            questionIds: sessionData.questionIds,
            currentIndex: sessionData.currentIndex ?? 0,
            status: sessionData.status ?? 'active',
          })

          loadQuestions(sessionData.questions)
          setDomainsInScope(sessionData.domainsInScope ?? [])

          // Load existing answers if resuming
          if (sessionData.answers?.length) {
            sessionStore.loadAnswers(sessionData.answers)
            setQuestionsAnsweredCount(sessionData.answers.length)
          }

          // Load domain progress if available
          if (sessionData.domainProgress) {
            sessionStore.loadProgress(sessionData.domainProgress)
          }
        }

        sessionStore.startTimer()
      } catch (err: any) {
        setError(err.message || 'Failed to load session')
      } finally {
        setLoading(false)
      }
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId])

  // ── Auto-collapse context after 5 answers ───────────────────

  useEffect(() => {
    if (questionsAnsweredCount >= 5) {
      setContextCollapsed(true)
    }
  }, [questionsAnsweredCount])

  // ── Pre-fill answer when navigating ─────────────────────────

  useEffect(() => {
    prefillCurrentAnswer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStore.currentIndex, questions])

  function prefillCurrentAnswer() {
    if (!currentQuestionId) return
    const existing = sessionStore.answers[currentQuestionId]
    if (existing) {
      setSelectedScore(existing.rawScore)
      setSelectedConfidence(existing.confidence)
      setNotes(existing.notes ?? '')
    } else {
      setSelectedScore(null)
      setSelectedConfidence('medium')
      setNotes('')
    }
  }

  function loadQuestions(questionList: Question[]) {
    const map = new Map<string, Question>()
    for (const q of questionList) {
      map.set(q.id, q)
    }
    setQuestions(map)
  }

  // ── Score select & auto-save ────────────────────────────────

  const handleScoreSelect = useCallback(
    (score: number) => {
      if (!engagementId || !currentQuestionId) return

      if (score === 0) {
        setSelectedScore(null)
        return
      }

      setSelectedScore(score)
      setSavedStatus('saving')

      api
        .createAnswer(engagementId, {
          questionId: currentQuestionId,
          rawScore: score,
          confidence: selectedConfidence,
          notes,
        })
        .then((res) => {
          sessionStore.recordAnswer(currentQuestionId, res.data.answer)

          if (currentDomain && res.data.runningDomainScore !== undefined) {
            const existing = sessionStore.domainProgress[currentDomain]
            sessionStore.setDomainProgress(currentDomain, {
              total: existing?.total ?? 0,
              answered: (existing?.answered ?? 0) + (sessionStore.answers[currentQuestionId] ? 0 : 1),
              runningScore: res.data.runningDomainScore,
              maturityBand: res.data.currentDomainMaturityBand ?? existing?.maturityBand ?? '',
            })
          }

          setQuestionsAnsweredCount((c) => {
            const isNew = !sessionStore.answers[currentQuestionId]
            return isNew ? c + 1 : c
          })

          setSavedStatus('saved')
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
          savedTimerRef.current = setTimeout(
            () => setSavedStatus('idle'),
            2000
          )
        })
        .catch(() => setSavedStatus('error'))
    },
    [
      engagementId,
      currentQuestionId,
      currentDomain,
      selectedConfidence,
      notes,
      sessionStore,
    ]
  )

  // ── Confidence change — re-save if score exists ─────────────

  const handleConfidenceChange = useCallback(
    (confidence: ConfidenceLevel) => {
      setSelectedConfidence(confidence)
      if (selectedScore !== null && engagementId && currentQuestionId) {
        setSavedStatus('saving')
        api
          .createAnswer(engagementId, {
            questionId: currentQuestionId,
            rawScore: selectedScore,
            confidence,
            notes,
          })
          .then((res) => {
            sessionStore.recordAnswer(currentQuestionId, res.data.answer)
            setSavedStatus('saved')
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
            savedTimerRef.current = setTimeout(
              () => setSavedStatus('idle'),
              2000
            )
          })
          .catch(() => setSavedStatus('error'))
      }
    },
    [selectedScore, engagementId, currentQuestionId, notes, sessionStore]
  )

  // ── Notes change ────────────────────────────────────────────

  const handleNotesChange = useCallback((value: string) => {
    setNotes(value)
  }, [])

  // ── Navigation ──────────────────────────────────────────────

  const handleNext = useCallback(() => {
    const nextIndex = sessionStore.currentIndex + 1

    // Check if we're at the end
    if (nextIndex >= questionIds.length) {
      setCurrentView('session-complete')
      return
    }

    // Check if domain is changing
    const nextQuestionId = questionIds[nextIndex]
    const nextDomain = getDomainForQuestion(nextQuestionId)

    if (currentDomain && nextDomain && nextDomain !== currentDomain) {
      // Check if all questions in current domain are answered
      const currentDomainQuestions = questionIds.filter(
        (qId: string) => getDomainForQuestion(qId) === currentDomain
      )
      const allAnswered = currentDomainQuestions.every(
        (qId: string) => sessionStore.answers[qId]
      )

      if (allAnswered) {
        setCompletedDomainForReview(currentDomain)
        setConsultantNote(
          sessionStore.consultantNotes[currentDomain] ?? ''
        )
        setCurrentView('domain-complete')
        return
      }
    }

    sessionStore.setCurrentIndex(nextIndex)
    setCurrentView('question')
  }, [sessionStore, currentDomain, getDomainForQuestion])

  const handlePrevious = useCallback(() => {
    if (sessionStore.currentIndex <= 0) return
    const prevIndex = sessionStore.currentIndex - 1
    sessionStore.setCurrentIndex(prevIndex)
    setCurrentView('question')
  }, [sessionStore])

  const handleSkip = useCallback(() => {
    if (!currentQuestionId) return
    sessionStore.markSkipped(currentQuestionId)

    const nextIndex = sessionStore.currentIndex + 1
    if (nextIndex >= questionIds.length) {
      setCurrentView('session-complete')
      return
    }
    sessionStore.setCurrentIndex(nextIndex)
  }, [currentQuestionId, sessionStore])

  // ── Domain complete handlers ────────────────────────────────

  const handleDomainContinue = useCallback(() => {
    if (completedDomainForReview && consultantNote) {
      sessionStore.setConsultantNote(
        completedDomainForReview,
        consultantNote
      )
    }

    const nextIndex = sessionStore.currentIndex + 1
    if (nextIndex >= questionIds.length) {
      setCurrentView('session-complete')
      return
    }
    sessionStore.setCurrentIndex(nextIndex)
    setCurrentView('question')
    setCompletedDomainForReview(null)
  }, [completedDomainForReview, consultantNote, sessionStore])

  const handleDomainReviewAnswers = useCallback(() => {
    // Go back to first question of the completed domain
    if (!completedDomainForReview) return
    const firstIndex = questionIds.findIndex(
      (qId: string) => getDomainForQuestion(qId) === completedDomainForReview
    )
    if (firstIndex >= 0) {
      sessionStore.setCurrentIndex(firstIndex)
      setCurrentView('question')
      setCompletedDomainForReview(null)
    }
  }, [completedDomainForReview, sessionStore, getDomainForQuestion])

  // ── Session complete handlers ───────────────────────────────

  const handleGenerateDiagnosis = useCallback(async () => {
    if (!engagementId) return
    try {
      await api.completeSession(engagementId)
      sessionStore.completeSession()
      navigate(`/engagements/${engagementId}/diagnosis`)
    } catch {
      // handle error
    }
  }, [engagementId, sessionStore, navigate])

  const handleSaveAndExit = useCallback(async () => {
    if (!engagementId) return
    try {
      await api.pauseSession(engagementId)
      sessionStore.pauseSession()
      navigate('/dashboard')
    } catch {
      // handle error
    }
  }, [engagementId, sessionStore, navigate])

  // ── Pause handler ───────────────────────────────────────────

  const handlePause = useCallback(async () => {
    if (!engagementId) return
    try {
      await api.pauseSession(engagementId)
      sessionStore.pauseSession()
      navigate('/dashboard')
    } catch {
      // handle error
    }
  }, [engagementId, sessionStore, navigate])

  // ── Context toggle ──────────────────────────────────────────

  const handleToggleContext = useCallback(() => {
    setContextCollapsed((prev) => !prev)
  }, [])

  // ── Keyboard shortcuts (consultant mode only) ───────────────

  useEffect(() => {
    if (uiStore.mode !== 'consultant') return
    if (currentView !== 'question') return

    const handler = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key >= '1' && e.key <= '5') {
        handleScoreSelect(parseInt(e.key, 10))
        return
      }

      if (e.key === 'c' || e.key === 'C') {
        setSelectedConfidence((prev) => {
          const cycle: ConfidenceLevel[] = ['high', 'medium', 'low']
          const idx = cycle.indexOf(prev)
          return cycle[(idx + 1) % 3]
        })
        return
      }

      if (e.key === 'Enter' && selectedScore !== null) {
        handleNext()
        return
      }

      if (e.key === 'Backspace') {
        e.preventDefault()
        handlePrevious()
        return
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [
    uiStore.mode,
    currentView,
    selectedScore,
    handleScoreSelect,
    handleNext,
    handlePrevious,
  ])

  // ── Build domain complete data ──────────────────────────────

  const buildDomainCompleteAnswers = () => {
    if (!completedDomainForReview) return []
    return questionIds
      .filter(
        (qId: string) => getDomainForQuestion(qId) === completedDomainForReview
      )
      .map((qId: string) => {
        const q = questions.get(qId)
        const a = sessionStore.answers[qId]
        return {
          questionId: qId,
          questionText: q?.text ?? '',
          rawScore: a?.rawScore ?? 0,
          weightedScore: a?.weightedScore ?? 0,
        }
      })
      .filter((a: { rawScore: number }) => a.rawScore > 0)
  }

  const getNextDomainName = (): string => {
    const nextIndex = sessionStore.currentIndex + 1
    if (nextIndex >= questionIds.length) return ''
    const nextQId = questionIds[nextIndex]
    const nextDomain = getDomainForQuestion(nextQId)
    return nextDomain ? DOMAIN_NAMES[nextDomain] ?? nextDomain : ''
  }

  const isLastDomain = (): boolean => {
    if (!completedDomainForReview) return false
    const remainingDomains = new Set<string>()
    for (
      let i = sessionStore.currentIndex + 1;
      i < questionIds.length;
      i++
    ) {
      const d = getDomainForQuestion(questionIds[i])
      if (d && d !== completedDomainForReview) remainingDomains.add(d)
    }
    return remainingDomains.size === 0
  }

  // ── Build session complete data ─────────────────────────────

  const buildDomainScores = () => {
    return domainsInScope.map((domain) => {
      const progress = sessionStore.domainProgress[domain]
      return {
        domain,
        name: DOMAIN_NAMES[domain] ?? domain,
        score: progress?.runningScore ?? 0,
        maturityBand: progress?.maturityBand ?? 'nascent',
      }
    })
  }

  // ── Loading & error states ──────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-navy-200 border-t-navy-700" />
          <p className="mt-4 font-body text-body-md text-navy-600">
            Loading session...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-50">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-8 text-center">
          <p className="font-body text-body-md text-red-600">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 rounded-lg bg-navy-800 px-6 py-2.5 font-body text-body-sm text-warm-50 hover:bg-navy-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────

  const isConsultantMode = uiStore.mode === 'consultant'
  const questionNumber = sessionStore.currentIndex + 1
  const totalQuestions = questionIds.length
  const isFirst = sessionStore.currentIndex === 0
  const isLastQuestion =
    sessionStore.currentIndex >= questionIds.length - 1

  return (
    <div className="flex min-h-screen bg-warm-50">
      <SessionProgressRail
        domains={domainsInScope}
        domainProgress={sessionStore.domainProgress}
        currentDomain={currentDomain}
        totalQuestions={totalQuestions}
        answeredQuestions={Object.keys(sessionStore.answers).length}
        skippedCount={sessionStore.skippedIds.length}
        timerStartedAt={sessionStore.timerStartedAt}
        isConsultantMode={isConsultantMode}
        onPause={handlePause}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[960px] px-8 pt-6 pb-20">
          {/* Mode toggle top-right */}
          <div className="mb-6 flex justify-end">
            <ModeToggle mode={uiStore.mode} onChange={uiStore.setMode} />
          </div>

          {currentView === 'question' && currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              questionNumber={questionNumber}
              totalQuestions={totalQuestions}
              selectedScore={selectedScore}
              selectedConfidence={selectedConfidence}
              notes={notes}
              isConsultantMode={isConsultantMode}
              isFirst={isFirst}
              isLast={isLastQuestion}
              contextCollapsed={contextCollapsed}
              savedStatus={savedStatus}
              onScoreSelect={handleScoreSelect}
              onConfidenceChange={handleConfidenceChange}
              onNotesChange={handleNotesChange}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSkip={handleSkip}
              onToggleContext={handleToggleContext}
            />
          )}

          {currentView === 'domain-complete' && completedDomainForReview && (
            <DomainComplete
              domain={completedDomainForReview}
              domainName={
                DOMAIN_NAMES[completedDomainForReview] ??
                completedDomainForReview
              }
              score={
                sessionStore.domainProgress[completedDomainForReview]
                  ?.runningScore ?? 0
              }
              maturityBand={
                sessionStore.domainProgress[completedDomainForReview]
                  ?.maturityBand ?? 'nascent'
              }
              answers={buildDomainCompleteAnswers()}
              patternSignals={[]}
              isConsultantMode={isConsultantMode}
              consultantNote={consultantNote}
              onNoteChange={setConsultantNote}
              onReviewAnswers={handleDomainReviewAnswers}
              onContinue={handleDomainContinue}
              onSaveAndExit={() => navigate('/')}
              onGoDeeperInDomain={async () => {
                if (!engagementId || !completedDomainForReview) return
                try {
                  const res = await api.expandDomain(engagementId, completedDomainForReview, true)
                  if (res.data.expanded && res.data.questionIds) {
                    sessionStore.setSession({
                      sessionId: sessionStore.sessionId!,
                      engagementId,
                      questionIds: res.data.questionIds,
                      currentIndex: sessionStore.currentIndex,
                      status: 'active',
                    })
                  }
                  handleDomainContinue()
                } catch { handleDomainContinue() }
              }}
              isLastDomain={isLastDomain()}
              nextDomainName={getNextDomainName()}
              remainingDomains={domainsInScope.filter(d => {
                const prog = sessionStore.domainProgress[d]
                return !prog || prog.answered < prog.total
              }).length}
              estimatedMinutesRemaining={Math.round(
                (questionIds.length - Object.keys(sessionStore.answers).length) * 1.5
              )}
            />
          )}

          {currentView === 'session-complete' && engagementId && (
            <SessionComplete
              engagementId={engagementId}
              domainScores={buildDomainScores()}
              totalQuestions={totalQuestions}
              answeredQuestions={
                Object.keys(sessionStore.answers).length
              }
              sessionDuration={formatDuration(
                sessionStore.timerStartedAt
              )}
              onGenerateDiagnosis={handleGenerateDiagnosis}
              onSaveAndExit={handleSaveAndExit}
            />
          )}
        </div>
      </main>
    </div>
  )
}
