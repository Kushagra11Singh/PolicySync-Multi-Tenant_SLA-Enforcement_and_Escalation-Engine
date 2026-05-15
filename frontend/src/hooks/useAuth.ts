import { useState, useEffect } from 'react'
import type { User } from '../types'
import { login as apiLogin, logout as apiLogout } from '../api/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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

  const login = async (email: string, password: string) => {
    const data = await apiLogin(email, password)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token') ?? ''
    try {
      await apiLogout(refresh)
    } catch {
      // token already expired — clear anyway
    }
    localStorage.clear()
    setUser(null)
  }

  return { user, loading, login, logout }
}
