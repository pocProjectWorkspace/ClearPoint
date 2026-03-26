import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function TopNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { consultant, logout } = useAuth()

  const isHome = location.pathname === '/'
  const isLogin = location.pathname === '/login'

  // Don't render on login page
  if (isLogin) return null

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-content items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Back button — show on all pages except home */}
          {!isHome && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 font-body text-body-sm text-navy-400 transition-colors hover:text-navy-700"
              title="Go back"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          {/* ClearPoint wordmark — always links to home */}
          <button
            onClick={() => navigate('/')}
            className="font-display text-display-sm tracking-tight text-navy-900 hover:text-navy-700 transition-colors"
          >
            ClearPoint
          </button>
        </div>

        {/* Right side — consultant info + sign out */}
        {consultant && (
          <div className="flex items-center gap-4">
            <span className="font-body text-body-sm text-navy-500">{consultant.name}</span>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="font-body text-body-sm text-navy-400 transition-colors hover:text-navy-700"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
