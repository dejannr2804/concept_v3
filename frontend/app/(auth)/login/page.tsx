"use client"
import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const { user, login, logout, loading } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  // Notifications are handled globally; no inline error state

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await login({ identifier, password })
      router.push('/')
    } catch (err: any) {
      // Error toast already shown in AuthProvider
    }
  }

  // If already authenticated, show a friendly message and shortcuts
  if (user) {
    return (
      <main className="container">
        <div className="card">
          <h2>Already logged in</h2>
          <p>You are signed in as <strong>{user.username}</strong>.</p>
          <div className="row gap-1">
            <button onClick={() => router.push('/')}>Go to Home</button>
            <button onClick={async () => { await logout(); router.refresh() }}>Logout</button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="container">
      <div className="card">
        <h2>Login</h2>
        <form onSubmit={onSubmit} className="col">
          <label className="col">
            <span>Username or Email</span>
            <input value={identifier} onChange={e => setIdentifier(e.target.value)} required />
          </label>
          <label className="col">
            <span>Password</span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          <div className="row row-between">
            <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Login'}</button>
            <Link href="/register">Need an account?</Link>
          </div>
        </form>
      </div>
    </main>
  )
}
