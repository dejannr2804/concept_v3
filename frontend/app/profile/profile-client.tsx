"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/components/Notifications'

type User = { id: number; username: string; email: string; first_name?: string; last_name?: string }

export default function ProfileClient({ user }: { user: User }) {
  const [form, setForm] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
  })
  const [loading, setLoading] = useState(false)
  const notify = useNotifications()
  const router = useRouter()

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: form.first_name, last_name: form.last_name }),
      })
      if (!res.ok) {
        try {
          const data = await res.json()
          const detail = (data as any)?.detail
          const direct = pickExistsMessage(data)
          const msg = (typeof detail === 'string' && detail) || direct || stringifyErrors(data)
          throw new Error(msg || 'Failed to update profile')
        } catch {
          throw new Error(`${res.status} ${res.statusText}`)
        }
      }
      notify.success('Profile updated')
      router.refresh()
    } catch (e: any) {
      notify.error(e?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="column" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
      <label>
        <div>Username</div>
        <input value={user.username} readOnly disabled />
      </label>
      <label>
        <div>Email</div>
        <input type="email" value={user.email} readOnly disabled />
      </label>
      <label>
        <div>First name</div>
        <input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
      </label>
      <label>
        <div>Last name</div>
        <input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
      </label>
      <div className="row" style={{ gap: '0.75rem' }}>
        <button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save changes'}</button>
      </div>
    </form>
  )
}

function stringifyErrors(data: Record<string, any>): string {
  try {
    const parts: string[] = []
    for (const [k, v] of Object.entries(data)) {
      if (k === 'detail') continue
      if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`)
      else if (typeof v === 'string') parts.push(`${k}: ${v}`)
    }
    return parts.join(' | ')
  } catch {
    return 'Invalid form data'
  }
}

function pickExistsMessage(data: Record<string, any>): string | null {
  try {
    const keys = ['email', 'username'] as const
    for (const k of keys) {
      const v = (data as any)?.[k]
      if (Array.isArray(v) && v.length) {
        const msg = String(v[0])
        // Prefer messages that indicate existing account
        if (/exists/i.test(msg)) return msg
        return msg
      }
    }
  } catch {}
  return null
}
