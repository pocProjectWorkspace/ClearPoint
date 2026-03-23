import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  InterventionWeights,
  AmbitionTargets,
  ConfidenceLevel,
  Domain,
} from '@mindssparc/shared-types'

export type EngagementDraft = {
  id?: string
  name?: string
  clientName?: string
  industry?: string
  companySize?: string
  revenueRange?: string
  geography?: string
  strategicPriorities?: string
  consultantHypothesis?: string
  confidenceLevel?: ConfidenceLevel
  domainsInScope?: Domain[]
  interventionWeights?: InterventionWeights
  ambitionTargets?: AmbitionTargets
  status?: string
}

type EngagementStore = {
  draft: EngagementDraft
  engagements: Record<string, unknown>[]

  setDraft: (partial: Partial<EngagementDraft>) => void
  setDraftId: (id: string) => void
  resetDraft: () => void
  loadDraft: (data: EngagementDraft) => void
  setEngagements: (engagements: Record<string, unknown>[]) => void
}

export const useEngagementStore = create<EngagementStore>()(
  persist(
    (set) => ({
      draft: {
        confidenceLevel: 'medium',
        interventionWeights: { process: 25, automation: 25, analytics: 25, ai: 25 },
        ambitionTargets: { costReductionPct: 0, productivityGainPct: 0, revenueImpactPct: 0 },
        domainsInScope: [],
      },
      engagements: [],

      setDraft: (partial) =>
        set((state) => ({ draft: { ...state.draft, ...partial } })),
      setDraftId: (id) =>
        set((state) => ({ draft: { ...state.draft, id } })),
      resetDraft: () =>
        set({
          draft: {
            confidenceLevel: 'medium',
            interventionWeights: { process: 25, automation: 25, analytics: 25, ai: 25 },
            ambitionTargets: { costReductionPct: 0, productivityGainPct: 0, revenueImpactPct: 0 },
            domainsInScope: [],
          },
        }),
      loadDraft: (data) => set({ draft: data }),
      setEngagements: (engagements) => set({ engagements }),
    }),
    {
      name: 'mindssparc-engagement',
      partialize: (state) => ({ draft: state.draft }),
    }
  )
)
