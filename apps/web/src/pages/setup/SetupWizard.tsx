import { useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import ProgressRail from '../../components/ui/ProgressRail'
import { useEngagementStore } from '../../store/engagementStore'
import { api } from '../../lib/api'
import StepEngagementForm from './steps/StepEngagementForm'
import StepDomainScoping from './steps/StepDomainScoping'
import StepWeightConfig from './steps/StepWeightConfig'
import StepAmbitionCalibration from './steps/StepAmbitionCalibration'
import StepConfidenceLevel from './steps/StepConfidenceLevel'
import StepSetupSummary from './steps/StepSetupSummary'

const STEP_LABELS = [
  'Engagement details',
  'Domain scoping',
  'Intervention weights',
  'Ambition targets',
  'Confidence level',
  'Review & confirm',
]

export default function SetupWizard() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { draft, setDraft, setDraftId, loadDraft } = useEngagementStore()

  const currentStep = Math.min(Math.max(Number(params.get('step')) || 1, 1), 6)

  // Load existing engagement if draft has an ID
  useEffect(() => {
    const id = draft.id
    if (id && !draft.clientName) {
      api.getEngagement(id).then((res) => {
        loadDraft(res.data as Record<string, unknown> as typeof draft)
      }).catch(() => {
        // Engagement not found, start fresh
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const goToStep = useCallback(
    (step: number) => {
      setParams({ step: String(step) })
    },
    [setParams]
  )

  const nextStep = useCallback(() => {
    if (currentStep < 6) goToStep(currentStep + 1)
  }, [currentStep, goToStep])

  const prevStep = useCallback(() => {
    if (currentStep > 1) goToStep(currentStep - 1)
  }, [currentStep, goToStep])

  // Save to API: create on step 1, update thereafter
  const saveToApi = useCallback(
    async (data: Record<string, unknown>) => {
      if (!draft.id) {
        const res = await api.createEngagement(data)
        const id = res.data.id as string
        setDraftId(id)
        return id
      } else {
        await api.updateEngagement(draft.id, data)
        return draft.id
      }
    },
    [draft.id, setDraftId]
  )

  const steps = STEP_LABELS.map((label, i) => ({
    number: i + 1,
    label,
    status: i + 1 < currentStep ? 'complete' as const : i + 1 === currentStep ? 'active' as const : 'not_started' as const,
  }))

  return (
    <div className="flex min-h-screen bg-warm-50">
      <ProgressRail steps={steps} onStepClick={goToStep} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[680px] px-8 pt-10 pb-20">
          {currentStep === 1 && (
            <StepEngagementForm
              draft={draft}
              setDraft={setDraft}
              onNext={async (data) => {
                await saveToApi(data)
                nextStep()
              }}
            />
          )}
          {currentStep === 2 && (
            <StepDomainScoping
              draft={draft}
              setDraft={setDraft}
              onNext={async (data) => {
                await saveToApi(data)
                nextStep()
              }}
              onBack={prevStep}
            />
          )}
          {currentStep === 3 && (
            <StepWeightConfig
              draft={draft}
              setDraft={setDraft}
              onNext={async (data) => {
                await saveToApi(data)
                nextStep()
              }}
              onBack={prevStep}
            />
          )}
          {currentStep === 4 && (
            <StepAmbitionCalibration
              draft={draft}
              setDraft={setDraft}
              onNext={async (data) => {
                await saveToApi(data)
                nextStep()
              }}
              onBack={prevStep}
            />
          )}
          {currentStep === 5 && (
            <StepConfidenceLevel
              draft={draft}
              setDraft={setDraft}
              onNext={async (data) => {
                await saveToApi(data)
                nextStep()
              }}
              onBack={prevStep}
            />
          )}
          {currentStep === 6 && (
            <StepSetupSummary
              draft={draft}
              onEdit={goToStep}
              onBeginAssessment={() => navigate(`/session/${draft.id}`)}
              onSaveAndExit={() => navigate('/')}
            />
          )}
        </div>
      </main>
    </div>
  )
}
