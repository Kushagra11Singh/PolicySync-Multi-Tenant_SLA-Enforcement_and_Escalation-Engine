import { useState, useEffect } from 'react'
import type { User } from '../types'
import { login as apiLogin, logout as apiLogout } from '../api/auth'

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // Give a 30-second buffer so we don't use a token that expires mid-request
    return payload.exp * 1000 < Date.now() + 30_000
  } catch {
    return true
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const stored = localStorage.getItem('user')

    if (token && stored) {
      if (isTokenExpired(token)) {
        // Stale token — wipe everything so the login page shows cleanly
        localStorage.clear()
      } else {
        try {
          setUser(JSON.parse(stored))
        } catch {
          localStorage.clear()
        }
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
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
      // Token already invalid — that's fine
    }
    localStorage.clear()
    setUser(null)
  }

  return { user, loading, login, logout }
}
