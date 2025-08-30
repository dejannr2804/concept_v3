import { cookies } from 'next/headers'
import { API_BASE_URL, AUTH_COOKIE } from '@/lib/config'
import 'server-only'

export type User = { id: number; username: string; email: string; first_name?: string; last_name?: string }

export function getTokenFromCookies(): string | null {
  try {
    const store = cookies()
    const token = store.get(AUTH_COOKIE)?.value
    return token || null
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getTokenFromCookies()
  if (!token) return null
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me/`, {
      headers: { Authorization: `Token ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.user ?? null
  } catch {
    return null
  }
}

