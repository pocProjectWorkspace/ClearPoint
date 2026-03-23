import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-50">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <h1 className="mb-2 text-center font-display text-display-md tracking-tight text-navy-900">
          ClearPoint
        </h1>
        <p className="mb-12 text-center font-body text-body-sm text-navy-400">
          powered by mindssparc
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block font-body text-body-sm font-medium text-navy-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="block w-full rounded-lg border border-navy-200 bg-white px-4 py-3 font-body text-body-md text-navy-900 outline-none transition-colors placeholder:text-navy-300 focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
              placeholder="consultant@mindssparc.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block font-body text-body-sm font-medium text-navy-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full rounded-lg border border-navy-200 bg-white px-4 py-3 font-body text-body-md text-navy-900 outline-none transition-colors placeholder:text-navy-300 focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
            />
          </div>

          {error && (
            <p className="font-body text-body-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-navy-800 px-6 py-3 font-body text-body-md font-medium text-warm-50 transition-colors hover:bg-navy-900 disabled:cursor-not-allowed disabled:bg-navy-400"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
