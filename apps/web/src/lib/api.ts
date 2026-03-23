import { API_BASE } from './constants'

function getToken(): string | null {
  return localStorage.getItem('mindssparc_token')
}

export function setToken(token: string) {
  localStorage.setItem('mindssparc_token', token)
}

export function clearToken() {
  localStorage.removeItem('mindssparc_token')
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || 'Request failed')
  }
  return json
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ data: { token: string; consultant: { id: string; name: string; email: string } } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),

  // Engagements
  createEngagement: (data: Record<string, unknown>) =>
    request<{ data: Record<string, unknown> }>('/api/engagements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listEngagements: () =>
    request<{ data: { items: Record<string, unknown>[]; total: number } }>('/api/engagements'),

  getEngagement: (id: string) =>
    request<{ data: Record<string, unknown> }>(`/api/engagements/${id}`),

  updateEngagement: (id: string, data: Record<string, unknown>) =>
    request<{ data: Record<string, unknown> }>(`/api/engagements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Session
  startSession: (engagementId: string) =>
    request<{ data: any }>(`/api/engagements/${engagementId}/session/start`, { method: 'POST' }),

  resumeSession: (engagementId: string) =>
    request<{ data: any }>(`/api/engagements/${engagementId}/session/resume`),

  pauseSession: (engagementId: string) =>
    request<{ data: any }>(`/api/engagements/${engagementId}/session/pause`, { method: 'POST' }),

  expandDomain: (engagementId: string, domain: string, forceExpand = false) =>
    request<{ data: any }>(`/api/engagements/${engagementId}/session/expand-domain`, {
      method: 'POST',
      body: JSON.stringify({ domain, forceExpand }),
    }),

  completeSession: (engagementId: string) =>
    request<{ data: any }>(`/api/engagements/${engagementId}/session/complete`, { method: 'POST' }),

  // Answers
  createAnswer: (engagementId: string, data: Record<string, unknown>) =>
    request<{ data: any }>(`/api/engagements/${engagementId}/answers`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAnswers: (engagementId: string) =>
    request<{ data: any }>(`/api/engagements/${engagementId}/answers`),

  getProgress: (engagementId: string) =>
    request<{ data: any }>(`/api/engagements/${engagementId}/progress`),

  // Diagnostic
  runDiagnostic: (engagementId: string, forceRerun = false) =>
    request<{ data: any }>(`/api/diagnostic/${engagementId}/run`, {
      method: 'POST',
      body: JSON.stringify({ forceRerun }),
    }),

  getDiagnosticResult: (engagementId: string) =>
    request<{ data: any }>(`/api/diagnostic/${engagementId}`),

  // Annotations
  saveAnnotation: (engagementId: string, data: { type: string; itemId: string; text: string }) =>
    request<{ data: any }>(`/api/engagements/${engagementId}/annotations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAnnotations: (engagementId: string) =>
    request<{ data: { items: any[]; total: number } }>(`/api/engagements/${engagementId}/annotations`),

  // PDF Export
  exportPdf: async (engagementId: string): Promise<Blob> => {
    const token = localStorage.getItem('mindssparc_token')
    const res = await fetch(`/api/export/${engagementId}/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!res.ok) throw new Error('Export failed')
    return res.blob()
  },
}
