import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_BASE_URL, AUTH_COOKIE, COOKIE_OPTIONS } from '@/lib/config'

export async function POST() {
  const token = cookies().get(AUTH_COOKIE)?.value
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` },
      })
    } catch {
      // ignore
    }
  }
  const res = NextResponse.json({ detail: 'Logged out' })
  // Set expired cookie to clear in all browsers
  cookies().set(AUTH_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 })
  return res
}

