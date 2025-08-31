"use client"
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function Header() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <Link href="/" style={styles.brand}>Concept</Link>
        {user && <Link href="/dashboard">Dashboard</Link>}
      </div>
      <div style={styles.right}>
        {user ? (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button style={styles.userBtn} onClick={() => setOpen((v) => !v)}>
              {user.username || user.email}
              <span aria-hidden style={{ marginLeft: 6 }}>▾</span>
            </button>
            {open && (
              <div style={styles.menu} role="menu">
                <Link href="/profile" style={styles.menuItem} role="menuitem">Profile</Link>
                <button style={{ ...styles.menuItem, background: 'transparent', textAlign: 'left' }} role="menuitem" onClick={() => logout()}>Logout</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </div>
        )}
      </div>
    </header>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    background: 'white',
    zIndex: 10,
  },
  left: { display: 'flex', alignItems: 'center', gap: '1rem' },
  right: { display: 'flex', alignItems: 'center', gap: '1rem' },
  brand: { fontWeight: 600, textDecoration: 'none' },
  userBtn: {
    border: '1px solid #d1d5db',
    padding: '0.375rem 0.5rem',
    borderRadius: 6,
    background: 'white',
    cursor: 'pointer',
  },
  menu: {
    position: 'absolute',
    right: 0,
    marginTop: 6,
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    minWidth: 160,
    overflow: 'hidden',
  },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '0.5rem 0.75rem',
    textDecoration: 'none',
    color: '#111827',
    border: 'none',
    cursor: 'pointer',
  },
}
