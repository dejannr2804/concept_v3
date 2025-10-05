"use client"
import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const { user, login, logout, loading } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  // Notifications are handled globally; no inline error state

  useEffect(() => {
    document.title = 'Login'
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
      await login({ identifier, password })
      router.push('/dashboard')
    } catch (err: any) {
      // Error toast already shown in AuthProvider
    }
  }

  // If authenticated, let the redirect effect run without flashing the page
  if (user) return null

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
