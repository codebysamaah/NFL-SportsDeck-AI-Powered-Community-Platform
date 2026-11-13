'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type AuthUser = {
  userId: number
  username: string
  role: string
} | null

type AuthContextType = {
  user: AuthUser
  loading: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {}
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/users/me')
      setUser(res.ok ? await res.json() : null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    fetch('/api/users/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (active) setUser(data)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, []) // only runs once on mount

  return (
    <AuthContext.Provider value={{ user, loading, refresh: fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)