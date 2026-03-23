import React from 'react'

type Props = { children: React.ReactNode; fallbackMessage?: string }
type State = { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] items-center justify-center bg-warm-50 p-8">
          <div className="max-w-md text-center">
            <h1 className="font-display text-display-sm text-navy-900">Something went wrong</h1>
            <p className="mt-3 font-body text-body-md text-navy-500">
              {this.props.fallbackMessage || 'Try refreshing the page. If the problem persists, your work is saved.'}
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-navy-800 px-6 py-2.5 font-body text-body-sm font-medium text-warm-50 hover:bg-navy-900"
              >
                Refresh page
              </button>
              <a
                href="/"
                className="rounded-lg border border-navy-200 bg-white px-6 py-2.5 font-body text-body-sm font-medium text-navy-700 hover:bg-navy-50"
              >
                Return to dashboard
              </a>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer font-mono text-body-xs text-navy-400">Stack trace</summary>
                <pre className="mt-2 overflow-x-auto rounded bg-navy-50 p-3 font-mono text-body-xs text-navy-600">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
