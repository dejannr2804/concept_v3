import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_BASE_URL, AUTH_COOKIE } from '@/lib/config'

function backendUrl(shopId: string | number, productId: string | number) {
  return `${API_BASE_URL}/api/v1/shops/${shopId}/products/${productId}/`
}

async function safeJson(res: Response) {
  try { return await res.json() } catch { return { detail: `${res.status} ${res.statusText}` } }
}

export async function GET(_req: Request, { params }: { params: { id: string; productId: string } }) {
  const token = cookies().get(AUTH_COOKIE)?.value
  const res = await fetch(backendUrl(params.id, params.productId), {
    headers: token ? { Authorization: `Token ${token}` } : undefined,
    cache: 'no-store',
  })
  if (!res.ok) return NextResponse.json(await safeJson(res), { status: res.status })
  return NextResponse.json(await res.json())
}

export async function PATCH(req: Request, { params }: { params: { id: string; productId: string } }) {
  const token = cookies().get(AUTH_COOKIE)?.value
  const body = await req.json()
  const res = await fetch(backendUrl(params.id, params.productId), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) return NextResponse.json(await safeJson(res), { status: res.status })
  return NextResponse.json(await res.json())
}

export async function DELETE(_req: Request, { params }: { params: { id: string; productId: string } }) {
  const token = cookies().get(AUTH_COOKIE)?.value
  const res = await fetch(backendUrl(params.id, params.productId), {
    method: 'DELETE',
    headers: token ? { Authorization: `Token ${token}` } : undefined,
  })
  if (!res.ok) return NextResponse.json(await safeJson(res), { status: res.status })
  return new NextResponse(null, { status: 204 })
}
