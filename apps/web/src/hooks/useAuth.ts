import { useState, useEffect, useCallback } from 'react'
import { api, setToken, clearToken, isAuthenticated } from '../lib/api'

type Consultant = {
  id: string
  name: string
  email: string
}

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated())
  const [consultant, setConsultant] = useState<Consultant | null>(() => {
    const stored = localStorage.getItem('mindssparc_consultant')
    return stored ? JSON.parse(stored) : null
  })

  useEffect(() => {
    setAuthenticated(isAuthenticated())
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password)
    setToken(res.data.token)
    localStorage.setItem('mindssparc_consultant', JSON.stringify(res.data.consultant))
    setConsultant(res.data.consultant)
    setAuthenticated(true)
    return res.data.consultant
  }, [])

  const logout = useCallback(() => {
    clearToken()
    localStorage.removeItem('mindssparc_consultant')
    setConsultant(null)
    setAuthenticated(false)
  }, [])

  return { authenticated, consultant, login, logout }
}
