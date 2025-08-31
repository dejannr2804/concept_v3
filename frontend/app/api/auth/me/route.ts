import { NextResponse } from 'next/server'
import { getCurrentUser, getTokenFromCookies } from '@/lib/auth'
import { API_BASE_URL } from '@/lib/config'

export async function GET() {
  const user = await getCurrentUser()
  return NextResponse.json({ user })
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}))
  const token = getTokenFromCookies()
  if (!token) return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 })

  const res = await fetch(`${API_BASE_URL}/api/v1/auth/me/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    try {
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    } catch {
      return NextResponse.json({ detail: `${res.status} ${res.statusText}` }, { status: res.status })
    }
  }
  const data = await res.json()
  return NextResponse.json(data)
}
