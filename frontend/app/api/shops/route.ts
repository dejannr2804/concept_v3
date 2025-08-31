import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_BASE_URL, AUTH_COOKIE } from '@/lib/config'

export async function GET() {
  const token = cookies().get(AUTH_COOKIE)?.value
  const res = await fetch(`${API_BASE_URL}/api/v1/shops/`, {
    headers: token ? { Authorization: `Token ${token}` } : undefined,
    cache: 'no-store',
  })

  if (!res.ok) {
    const err = await safeJson(res)
    return NextResponse.json(err, { status: res.status })
  }
  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const token = cookies().get(AUTH_COOKIE)?.value
  const body = await request.json()
  const res = await fetch(`${API_BASE_URL}/api/v1/shops/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await safeJson(res)
    return NextResponse.json(err, { status: res.status })
  }
  const data = await res.json()
  return NextResponse.json(data, { status: 201 })
}

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return { detail: `${res.status} ${res.statusText}` }
  }
}

