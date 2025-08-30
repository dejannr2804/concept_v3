"use client"
import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const { login, loading } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login({ identifier, password })
      router.push('/')
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    }
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
          {error && <div style={{color: '#ff6666'}}>{error}</div>}
          <div className="row" style={{justifyContent: 'space-between'}}>
            <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Login'}</button>
            <Link href="/register">Need an account?</Link>
          </div>
        </form>
      </div>
    </main>
  )
}

