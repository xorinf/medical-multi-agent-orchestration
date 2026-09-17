import { useEffect, useState, useCallback, createContext, useContext } from 'react'

const API = '/api'

export function apiFetch(path, opts = {}) {
  const headers = { ...(opts.headers || {}) }
  const token = localStorage.getItem('access_token')
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (opts.body && !(opts.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const doFetch = () => fetch(API + path, {
    credentials: 'include',
    ...opts,
    headers,
  })

  return doFetch().then(async r => {
    if (r.status === 204) return null
    const ct = r.headers.get('content-type') || ''
    const data = ct.includes('json') ? await r.json().catch(() => ({})) : await r.text()
    if (r.status === 401 && !path.includes('/auth/')) {
      // try refresh once
      const rr = await fetch(API + '/auth/refresh', { method: 'POST', credentials: 'include' })
      // ponytail: use rr's own response body for the error, not `data` (which
      // is the original 401 — gives wrong error message).
      if (!rr.ok) {
        let refreshErr = 'unauthorized'
        try {
          const j = await rr.json()
          if (j && j.error) refreshErr = j.error
        } catch {}
        throw new Error(refreshErr)
      }
      const j = await rr.json()
      localStorage.setItem('access_token', j.access_token)
      const headers2 = { ...headers, Authorization: `Bearer ${j.access_token}` }
      const rr2 = await fetch(API + path, { ...opts, credentials: 'include', headers: headers2 })
      if (!rr2.ok) {
        let retryErr = `HTTP ${rr2.status}`
        try {
          const j2 = await rr2.json()
          if (j2 && j2.error) retryErr = j2.error
        } catch {}
        throw new Error(retryErr)
      }
      const ct2 = rr2.headers.get('content-type') || ''
      return ct2.includes('json') ? rr2.json() : rr2.text()
    }
    if (!r.ok) throw new Error((data && data.error) || `HTTP ${r.status}`)
    return data
  })
}

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    apiFetch('/auth/me').then(u => setUser(u)).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])
  useEffect(refresh, [refresh])

  const login = async (email, password) => {
    const r = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    localStorage.setItem('access_token', r.access_token)
    setUser(r.user)
    return r.user
  }
  const register = async (form) => {
    const r = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(form) })
    if (r.error) throw new Error(r.error)
    return r  // returns {id, role, status}; caller decides what to do next
  }
  const logout = async () => {
    try { await apiFetch('/auth/logout', { method: 'POST' }) } catch {}
    localStorage.removeItem('access_token')
    setUser(null)
  }
  return <AuthCtx.Provider value={{ user, loading, login, register, logout }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
