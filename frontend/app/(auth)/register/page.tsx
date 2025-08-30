"use client"
import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser, loading } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await registerUser({ username, email, password })
      router.push('/')
    } catch (err: any) {
      setError(err?.message || 'Register failed')
    }
  }

  return (
    <main className="container">
      <div className="card">
        <h2>Register</h2>
        <form onSubmit={onSubmit} className="col">
          <label className="col">
            <span>Username</span>
            <input value={username} onChange={e => setUsername(e.target.value)} required />
          </label>
          <label className="col">
            <span>Email</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label className="col">
            <span>Password</span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          {error && <div style={{color: '#ff6666'}}>{error}</div>}
          <div className="row" style={{justifyContent: 'space-between'}}>
            <button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Register'}</button>
            <Link href="/login">Have an account?</Link>
          </div>
        </form>
      </div>
    </main>
  )
}

