"use client"
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNotifications } from '@/components/Notifications'

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
  const notify = useNotifications()

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
        if (!r.ok) {
          const message = await extractErrorMessage(r)
          notify.error(message || 'Login failed')
          throw new Error(message || 'Login failed')
        }
        const { user } = await r.json()
        setUser(user)
        notify.success(`Welcome back${user?.username ? ', ' + user.username : '!'}`)
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
        if (!r.ok) {
          const message = await extractErrorMessage(r)
          notify.error(message || 'Registration failed')
          throw new Error(message || 'Registration failed')
        }
        const { user } = await r.json()
        setUser(user)
        notify.success('Account created successfully')
      } finally {
        setLoading(false)
      }
    },
    logout: async () => {
      try {
        await fetch(`/api/auth/logout`, { method: 'POST', credentials: 'include' })
      } catch (e) {
        // still continue logout locally
      }
      setUser(null)
      notify.info('Logged out')
    },
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}

async function extractErrorMessage(r: Response): Promise<string> {
  try {
    const data = await r.json()
    const detail = (data as any)?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.join(', ')
    // Field errors, e.g., { username: ["..."], password: ["..."] }
    if (data && typeof data === 'object') {
      const parts: string[] = []
      for (const [k, v] of Object.entries(data as Record<string, any>)) {
        if (k === 'detail') continue
        if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`)
        else if (typeof v === 'string') parts.push(`${k}: ${v}`)
      }
      if (parts.length) return parts.join(' | ')
    }
  } catch {}
  try {
    const text = await r.text()
    if (text) return text
  } catch {}
  return `${r.status} ${r.statusText}`
}
