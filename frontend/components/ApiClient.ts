"use client"

export type ApiOptions = {
  baseUrl?: string
  getToken?: () => string | null
}

export class ApiClient {
  private baseUrl: string
  private getToken?: () => string | null

  constructor(opts: ApiOptions = {}) {
    this.baseUrl = opts.baseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || ''
    this.getToken = opts.getToken
  }

  private headers(extra?: HeadersInit): HeadersInit {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = this.getToken?.()
    if (token) headers['Authorization'] = `Token ${token}`
    return { ...headers, ...extra }
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { headers: this.headers() })
    if (!res.ok) throw new Error(await this.extractError(res))
    return res.json() as Promise<T>
  }

  async post<T>(path: string, body?: any): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(await this.extractError(res))
    return res.json() as Promise<T>
  }

  private async extractError(res: Response): Promise<string> {
    try {
      const data = await res.json()
      if (typeof data === 'string') return data
      if (data?.detail) return String(data.detail)
      return JSON.stringify(data)
    } catch {
      return `${res.status} ${res.statusText}`
    }
  }
}

