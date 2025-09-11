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

  const displayName = user
    ? ((user.first_name || user.last_name)
        ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
        : (user.username || user.email))
    : ''
  const initials = (() => {
    if (!user) return ''
    const src = displayName || user.username || user.email || ''
    const parts = src.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return (src[0] || '?').toUpperCase()
  })()

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
              <span className="user-avatar" aria-hidden>
                {user.profile_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.profile_image_url} alt=""/>
                ) : (
                    <span className="name">{initials}</span>
                )}
              </span>
              <span className="name">{displayName}</span>
              <img src="/img/chevron-down.svg" alt="" className="icon"/>
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
