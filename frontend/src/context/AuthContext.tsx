import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import { login as apiLogin, logout as apiLogout } from '../api/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const clearUser = useCallback(() => {
    localStorage.clear()
    setUser(null)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.clear()
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // Axios interceptor fires this instead of window.location.href
    // so React controls the redirect cleanly
    window.addEventListener('auth:logout', clearUser)
    return () => window.removeEventListener('auth:logout', clearUser)
  }, [clearUser])

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const data = await apiLogin(email, password)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token') ?? ''
    try {
      await apiLogout(refresh)
    } catch {
      // expired — clear anyway
    }
    clearUser()
  }, [clearUser])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
