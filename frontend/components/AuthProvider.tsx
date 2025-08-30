"use client"
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ApiClient } from '@/components/ApiClient'

type User = { id: number; username: string; email: string; first_name?: string; last_name?: string }

type AuthContextShape = {
  user: User | null
  token: string | null
  loading: boolean
  login: (payload: { identifier: string; password: string }) => Promise<void>
  register: (payload: { username: string; email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextShape | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const api = useMemo(() => new ApiClient({ getToken: () => token }), [token])

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (t) {
      setToken(t)
      api.get<{ user: User }>(`/api/v1/auth/me/`).then(({ user }) => setUser(user)).catch(() => {
        setUser(null)
        setToken(null)
        localStorage.removeItem('token')
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<AuthContextShape>(() => ({
    user,
    token,
    loading,
    login: async ({ identifier, password }) => {
      setLoading(true)
      try {
        const res = await api.post<{ user: User; token: string }>(`/api/v1/auth/login/`, { identifier, password })
        setUser(res.user)
        setToken(res.token)
        localStorage.setItem('token', res.token)
      } finally {
        setLoading(false)
      }
    },
    register: async ({ username, email, password }) => {
      setLoading(true)
      try {
        const res = await api.post<{ user: User; token: string }>(`/api/v1/auth/register/`, { username, email, password })
        setUser(res.user)
        setToken(res.token)
        localStorage.setItem('token', res.token)
      } finally {
        setLoading(false)
      }
    },
    logout: async () => {
      try { await api.post(`/api/v1/auth/logout/`) } catch {}
      setUser(null)
      setToken(null)
      localStorage.removeItem('token')
    },
  }), [user, token, loading, api])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}

