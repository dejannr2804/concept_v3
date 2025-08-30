"use client"
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type User = { id: number; username: string; email: string; first_name?: string; last_name?: string }

type AuthContextShape = {
  user: User | null
  loading: boolean
  login: (payload: { identifier: string; password: string }) => Promise<void>
  register: (payload: { username: string; email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined)

export function AuthProvider({ children, initialUser = null }: { children: React.ReactNode; initialUser?: User | null }) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialUser === null) {
      // Try to load user from server session via Next route
      fetch('/api/auth/me', { credentials: 'include' })
        .then(async (r) => (r.ok ? (await r.json())?.user ?? null : null))
        .then((u) => setUser(u))
        .catch(() => setUser(null))
    }
  }, [initialUser])

  const value = useMemo<AuthContextShape>(() => ({
    user,
    loading,
    login: async ({ identifier, password }) => {
      setLoading(true)
      try {
        const r = await fetch(`/api/auth/login`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        })
        if (!r.ok) throw new Error(await r.text())
        const { user } = await r.json()
        setUser(user)
      } finally {
        setLoading(false)
      }
    },
    register: async ({ username, email, password }) => {
      setLoading(true)
      try {
        const r = await fetch(`/api/auth/register`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password }),
        })
        if (!r.ok) throw new Error(await r.text())
        const { user } = await r.json()
        setUser(user)
      } finally {
        setLoading(false)
      }
    },
    logout: async () => {
      try {
        await fetch(`/api/auth/logout`, { method: 'POST', credentials: 'include' })
      } catch {}
      setUser(null)
    },
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
