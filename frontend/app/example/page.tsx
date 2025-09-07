"use client"
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function ExamplePage() {
  const { user, logout } = useAuth()

  return (
    <main className="container">
      <div className="card">
        <h1>Welcome{user ? `, ${user.username}` : ''} 👋</h1>
        <p>This is an example homepage wired to a Django REST backend.</p>
        <div className="spacer" />
        {user ? (
          <div className="row row-between">
            <div>You're logged in.</div>
            <button onClick={logout}>Logout</button>
          </div>
        ) : (
          <div className="row gap-1">
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </div>
        )}
      </div>
    </main>
  )
}
