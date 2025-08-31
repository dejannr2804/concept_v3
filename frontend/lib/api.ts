"use client"
import { API_BASE_URL } from '@/lib/config'

type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export type ApiRequestOptions = {
  method?: ApiMethod
  body?: any
  headers?: HeadersInit
  // Extract a nested payload when backend wraps data
  extract?: (raw: any) => any
  // Optional: search params
  params?: Record<string, string | number | boolean | undefined | null>
}

// Normalizes a path to `${API_BASE_URL}/api/v1/<path>/` when given a relative path.
// Accepts absolute URLs as-is.
export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  let p = path.trim()
  // Remove any leading `/api` proxy usage
  if (p.startsWith('/api/')) p = p.replace(/^\/api\/?/, '')
  // Ensure path starts with `/api/v1/`
  if (!p.startsWith('api/v1/')) p = `api/v1/${p.replace(/^\//, '')}`
  // Ensure trailing slash for DRF endpoints
  if (!p.endsWith('/')) p = `${p}/`
  return `${API_BASE_URL.replace(/\/$/, '')}/${p}`
}

export async function apiFetch<T = any>(path: string, opts: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers, extract, params } = opts
  const url = new URL(apiUrl(path))
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null) return
      url.searchParams.set(k, String(v))
    })
  }
  const res = await fetch(url.toString(), {
    method,
    credentials: 'include', // send httpOnly auth cookie to Django
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(await extractError(res))
  // 204 No Content
  if (res.status === 204) return undefined as unknown as T
  const raw = await safeJson(res)
  return (extract ? extract(raw) : raw) as T
}

export const api = {
  get: <T = any>(path: string, opts: Omit<ApiRequestOptions, 'method' | 'body'> = {}) =>
    apiFetch<T>(path, { ...opts, method: 'GET' }),
  post: <T = any>(path: string, body?: any, opts: Omit<ApiRequestOptions, 'method' | 'body'> = {}) =>
    apiFetch<T>(path, { ...opts, method: 'POST', body }),
  patch: <T = any>(path: string, body?: any, opts: Omit<ApiRequestOptions, 'method' | 'body'> = {}) =>
    apiFetch<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T = any>(path: string, opts: Omit<ApiRequestOptions, 'method' | 'body'> = {}) =>
    apiFetch<T>(path, { ...opts, method: 'DELETE' }),
}

async function safeJson(res: Response) {
  try { return await res.json() } catch { return null }
}

async function extractError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    const detail = (data as any)?.detail
    if (typeof detail === 'string') return detail
    const msgs = flattenErrors(data)
    return msgs || `${res.status} ${res.statusText}`
  } catch {
    return `${res.status} ${res.statusText}`
  }
}

function flattenErrors(data: Record<string, any>): string {
  try {
    const parts: string[] = []
    for (const [k, v] of Object.entries(data || {})) {
      if (k === 'detail') continue
      if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`)
      else if (typeof v === 'string') parts.push(`${k}: ${v}`)
    }
    return parts.join(' | ')
  } catch { return '' }
}

