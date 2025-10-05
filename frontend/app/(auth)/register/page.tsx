"use client"
import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RegisterPage() {
  const router = useRouter()
  const { user, register: registerUser, loading } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Notifications are handled globally; no inline error state

  useEffect(() => {
    document.title = 'Register'
  }, [])

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.replace('/dashboard')
    }
  }, [user, router])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await registerUser({ username, email, password })
      router.push('/dashboard')
    } catch (err: any) {
      // Error toast already shown in AuthProvider
    }
  }

  if (user) return null

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
          <div className="row row-between">
            <button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Register'}</button>
            <Link href="/login">Have an account?</Link>
          </div>
        </form>
      </div>
    </main>
  )
}
