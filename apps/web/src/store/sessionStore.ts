import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Domain, ConfidenceLevel } from '@mindssparc/shared-types'

export type StoredAnswer = {
  questionId: string
  rawScore: number
  confidence: ConfidenceLevel
  notes?: string
  weightedScore: number
  timestamp: string
}

export type DomainProgressState = {
  total: number
  answered: number
  runningScore: number
  maturityBand: string
}

type SessionState = {
  sessionId: string | null
  engagementId: string | null
  questionIds: string[]
  currentIndex: number
  answers: Record<string, StoredAnswer>
  skippedIds: string[]
  domainProgress: Record<string, DomainProgressState>
  consultantNotes: Record<string, string>
  timerStartedAt: number | null
  status: 'idle' | 'active' | 'paused' | 'complete'

  setSession: (data: {
    sessionId: string
    engagementId: string
    questionIds: string[]
    currentIndex: number
    status: 'active' | 'paused' | 'complete'
  }) => void
  recordAnswer: (questionId: string, answer: StoredAnswer) => void
  markSkipped: (questionId: string) => void
  setCurrentIndex: (index: number) => void
  setDomainProgress: (domain: string, progress: DomainProgressState) => void
  setConsultantNote: (domain: string, note: string) => void
  pauseSession: () => void
  resumeSession: () => void
  completeSession: () => void
  startTimer: () => void
  loadAnswers: (answers: StoredAnswer[]) => void
  loadProgress: (progress: Record<string, DomainProgressState>) => void
  reset: () => void
}

const initialState = {
  sessionId: null as string | null,
  engagementId: null as string | null,
  questionIds: [] as string[],
  currentIndex: 0,
  answers: {} as Record<string, StoredAnswer>,
  skippedIds: [] as string[],
  domainProgress: {} as Record<string, DomainProgressState>,
  consultantNotes: {} as Record<string, string>,
  timerStartedAt: null as number | null,
  status: 'idle' as const,
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      ...initialState,

      setSession: (data) =>
        set({
          sessionId: data.sessionId,
          engagementId: data.engagementId,
          questionIds: data.questionIds,
          currentIndex: data.currentIndex,
          status: data.status === 'complete' ? 'complete' : 'active',
        }),

      recordAnswer: (questionId, answer) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: answer },
          skippedIds: state.skippedIds.filter((id) => id !== questionId),
        })),

      markSkipped: (questionId) =>
        set((state) => ({
          skippedIds: state.skippedIds.includes(questionId)
            ? state.skippedIds
            : [...state.skippedIds, questionId],
        })),

      setCurrentIndex: (index) => set({ currentIndex: index }),

      setDomainProgress: (domain, progress) =>
        set((state) => ({
          domainProgress: { ...state.domainProgress, [domain]: progress },
        })),

      setConsultantNote: (domain, note) =>
        set((state) => ({
          consultantNotes: { ...state.consultantNotes, [domain]: note },
        })),

      pauseSession: () => set({ status: 'paused' }),
      resumeSession: () => set({ status: 'active' }),
      completeSession: () => set({ status: 'complete' }),
      startTimer: () => set((state) => ({ timerStartedAt: state.timerStartedAt ?? Date.now() })),

      loadAnswers: (answers) =>
        set({
          answers: Object.fromEntries(answers.map((a) => [a.questionId, a])),
        }),

      loadProgress: (progress) => set({ domainProgress: progress }),

      reset: () => set({ ...initialState }),
    }),
    {
      name: 'mindssparc-session',
      partialize: (state) => ({
        sessionId: state.sessionId,
        engagementId: state.engagementId,
        questionIds: state.questionIds,
        currentIndex: state.currentIndex,
        answers: state.answers,
        skippedIds: state.skippedIds,
        domainProgress: state.domainProgress,
        consultantNotes: state.consultantNotes,
        timerStartedAt: state.timerStartedAt,
        status: state.status,
      }),
    }
  )
)
