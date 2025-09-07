"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function Header() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const hide = mounted && pathname?.startsWith('/shops/')
  if (hide) return null

  return (
    <header className="app-header">
      <div className="row gap-1">
        <Link href="/" className="brand">Concept</Link>
        {user && <Link href="/dashboard">Dashboard</Link>}
      </div>
      <div className="row gap-1">
        {user ? (
          <div ref={menuRef} className="relative">
            <button className="user-btn" onClick={() => setOpen((v) => !v)}>
              {user.username || user.email}
              <span aria-hidden className="ml-6">▾</span>
            </button>
            {open && (
              <div className="menu" role="menu">
                <Link href="/profile" className="menu-item" role="menuitem">Profile</Link>
                <button className="menu-item menu-item-button" role="menuitem" onClick={() => logout()}>Logout</button>
              </div>
            )}
          </div>
        ) : (
          <div className="row gap-1">
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </div>
        )}
      </div>
    </header>
  )
}

// removed inline styles in favor of CSS classes
