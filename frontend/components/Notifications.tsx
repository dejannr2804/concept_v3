"use client"
import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react'

export type NoticeType = 'success' | 'error' | 'info' | 'warning'

export type Notice = {
  id: string
  message: string
  title?: string
  type?: NoticeType
  duration?: number
}

type NotificationsContextShape = {
  notify: (input: Omit<Notice, 'id'>) => string
  remove: (id: string) => void
  success: (message: string, opts?: Omit<Notice, 'id' | 'message' | 'type'>) => string
  error: (message: string, opts?: Omit<Notice, 'id' | 'message' | 'type'>) => string
  info: (message: string, opts?: Omit<Notice, 'id' | 'message' | 'type'>) => string
  warning: (message: string, opts?: Omit<Notice, 'id' | 'message' | 'type'>) => string
}

const NotificationsContext = createContext<NotificationsContextShape | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Notice[]>([])

  const remove = useCallback((id: string) => {
    setItems((arr) => arr.filter((n) => n.id !== id))
  }, [])

  const notify = useCallback((input: Omit<Notice, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    const duration = input.duration ?? 4000
    const type = input.type ?? 'info'
    const notice: Notice = { id, ...input, duration, type }
    setItems((arr) => [...arr, notice])
    if (duration > 0) {
      window.setTimeout(() => remove(id), duration)
    }
    return id
  }, [remove])

  const variant = useCallback(
    (type: NoticeType) => (message: string, opts?: Omit<Notice, 'id' | 'message' | 'type'>) =>
      notify({ message, type, ...opts }),
    [notify]
  )

  const value = useMemo<NotificationsContextShape>(() => ({
    notify,
    remove,
    success: variant('success'),
    error: variant('error'),
    info: variant('info'),
    warning: variant('warning'),
  }), [notify, remove, variant])

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <NotificationsViewport items={items} onClose={remove} />
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}

function Icon({ type }: { type: NoticeType | undefined }) {
  const color =
    type === 'success' ? '#39d98a' : type === 'error' ? '#ff6b6b' : type === 'warning' ? '#ffcc66' : '#7aa2ff'
  return (
    <span aria-hidden style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 9999, background: color }} />
  )
}

function NotificationsViewport({ items, onClose }: { items: Notice[]; onClose: (id: string) => void }) {
  // Mount-aware to avoid hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return (
    <div className="toast-viewport">
      {items.map((n) => (
        <div key={n.id} className={`toast toast-${n.type ?? 'info'}`} role="status" aria-live="polite">
          <div className="toast-left">
            <Icon type={n.type} />
            <div className="toast-texts">
              {n.title && <div className="toast-title">{n.title}</div>}
              <div className="toast-message">{n.message}</div>
            </div>
          </div>
          <button className="toast-close" onClick={() => onClose(n.id)} aria-label="Close notification">×</button>
        </div>
      ))}
    </div>
  )
}

