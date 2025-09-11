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
        <Link href="/" className="brand">
          <img src="/img/logo.svg" alt=""/>
        </Link>
      </div>
      <div className="row gap-1">
        <div className="links">
          {user && (
              <Link
                  href="/dashboard"
                  className={`nav-link ${pathname?.startsWith('/dashboard') ? 'active' : ''}`}
              >
                <span>My Shops</span>
                <img src="/img/arrow-narrow-up-right.svg" alt="" className="nav-icon"/>
              </Link>
          )}
        </div>
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
                    <Link
                        href="/profile"
                        className="menu-item"
                        role="menuitem"
                        onClick={() => setOpen(false)}
                    >
                      {/* Profile icon */}
                      <svg
                          className="menu-icon"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="#111827" strokeWidth="1.8"
                              strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4 20a8 8 0 0 1 16 0" stroke="#111827" strokeWidth="1.8" strokeLinecap="round"
                              strokeLinejoin="round"/>
                      </svg>
                      <span>Profile</span>
                    </Link>
                    <a
                        href="#"
                        className="menu-item"
                        role="menuitem"
                        onClick={(e) => {
                          e.preventDefault()
                          setOpen(false)
                          logout()
                        }}
                    >
                      {/* Logout icon */}
                      <svg
                          className="menu-icon"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M15 17l5-5-5-5" stroke="#111827" strokeWidth="1.8" strokeLinecap="round"
                              strokeLinejoin="round"/>
                        <path d="M20 12H9" stroke="#111827" strokeWidth="1.8" strokeLinecap="round"
                              strokeLinejoin="round"/>
                        <path d="M11 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5" stroke="#111827" strokeWidth="1.8"
                              strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Logout</span>
                    </a>
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
