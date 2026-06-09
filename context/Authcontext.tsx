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
  refresh: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: () => {}
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = () => {
    fetch('/api/users/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUser()
  }, []) // only runs once on mount

  return (
    <AuthContext.Provider value={{ user, loading, refresh: fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)