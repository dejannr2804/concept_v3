import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_BASE_URL, AUTH_COOKIE, COOKIE_OPTIONS } from '@/lib/config'

export async function POST(request: Request) {
  const body = await request.json()
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await safeJson(res)
    return NextResponse.json(err, { status: res.status })
  }

  const data = await res.json()
  const token = data?.token
  if (!token) {
    return NextResponse.json({ detail: 'Missing token from backend response' }, { status: 500 })
  }

  const response = NextResponse.json({ user: data.user })
  cookies().set(AUTH_COOKIE, token, COOKIE_OPTIONS)
  return response
}

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return { detail: `${res.status} ${res.statusText}` }
  }
}

