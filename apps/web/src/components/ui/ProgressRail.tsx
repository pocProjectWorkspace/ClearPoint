type Step = {
  number: number
  label: string
  status: 'not_started' | 'active' | 'complete'
}

type ProgressRailProps = {
  steps: Step[]
  onStepClick: (step: number) => void
}

export default function ProgressRail({ steps, onStepClick }: ProgressRailProps) {
  return (
    <nav className="w-[220px] shrink-0 border-r border-navy-100 bg-white py-8 pr-4 pl-6">
      <p className="mb-6 font-body text-body-xs font-medium uppercase tracking-widest text-navy-400">
        Setup
      </p>
      <ol className="space-y-1">
        {steps.map((step) => {
          const isClickable = step.status === 'complete'
          return (
            <li key={step.number}>
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.number)}
                disabled={!isClickable}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                  step.status === 'active'
                    ? 'bg-navy-800 text-warm-50'
                    : step.status === 'complete'
                      ? 'cursor-pointer text-navy-500 hover:bg-navy-50'
                      : 'cursor-default text-navy-300'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-body-xs font-medium ${
                    step.status === 'active'
                      ? 'bg-warm-50 text-navy-800'
                      : step.status === 'complete'
                        ? 'bg-navy-100 text-navy-600'
                        : 'bg-navy-50 text-navy-300'
                  }`}
                >
                  {step.status === 'complete' ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </span>
                <span className="font-body text-body-sm font-medium">{step.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
