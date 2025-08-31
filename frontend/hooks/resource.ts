"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNotifications } from '@/components/Notifications'

type ExtractFn = (raw: any) => any

export type UpdaterOptions = {
  load?: boolean
  initialData?: Record<string, any> | null
  extract?: ExtractFn
}

export function useResourceUpdater(resourcePath: string, opts: UpdaterOptions = {}) {
  const { load = true, initialData = null, extract } = opts
  const notify = useNotifications()
  const [loading, setLoading] = useState(Boolean(load))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Record<string, any>>({})
  const initialRef = useRef<Record<string, any>>({})
  const initialKey = useMemo(() => JSON.stringify(initialData || {}), [initialData])

  // Load or seed
  useEffect(() => {
    let cancelled = false
    async function loadResource() {
      if (!load) {
        const seed = initialData || {}
        setData(seed)
        initialRef.current = seed
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(resourcePath, { cache: 'no-store' })
        if (!res.ok) throw new Error(await responseErrorMessage(res))
        const raw = await safeJson(res)
        const obj = extract ? extract(raw) : raw
        if (!cancelled) {
          setData(obj || {})
          initialRef.current = obj || {}
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadResource()
    return () => { cancelled = true }
  }, [resourcePath, load, initialKey])

  function setField(name: string, value: any) {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  function dirtyPatch(keys?: string[]) {
    const src = data
    const base = initialRef.current
    const patch: Record<string, any> = {}
    const names = keys || Object.keys(src)
    for (const k of names) {
      if (!shallowEqual(src[k], base[k])) patch[k] = src[k]
    }
    return patch
  }

  async function save(keys?: string[]) {
    const patch = dirtyPatch(keys)
    if (Object.keys(patch).length === 0) {
      notify.info('No changes to save')
      return { ok: true }
    }
    setSaving(true)
    try {
      const res = await fetch(resourcePath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error(await responseErrorMessage(res))
      // If backend returns content, update local state; otherwise accept current data
      if (res.status !== 204) {
        const raw = await safeJson(res)
        const obj = extract ? extract(raw) : raw
        if (obj && typeof obj === 'object') setData(obj)
        initialRef.current = obj || { ...data }
      } else {
        initialRef.current = { ...data }
      }
      notify.success('Saved')
      return { ok: true }
    } catch (e: any) {
      notify.error(e?.message || 'Failed to save')
      return { ok: false, error: e }
    } finally {
      setSaving(false)
    }
  }

  async function deleteResource() {
    if (!confirm('Are you sure you want to delete this item?')) return { ok: false }
    setDeleting(true)
    try {
      const res = await fetch(resourcePath, { method: 'DELETE' })
      if (!res.ok) throw new Error(await responseErrorMessage(res))
      notify.success('Deleted')
      return { ok: true }
    } catch (e: any) {
      notify.error(e?.message || 'Failed to delete')
      return { ok: false, error: e }
    } finally {
      setDeleting(false)
    }
  }

  return {
    data,
    setField,
    loading,
    saving,
    deleting,
    error,
    save,
    deleteResource,
  }
}

export type FieldOptions = {
  debounceMs?: number
  optimistic?: boolean
  validate?: (value: any) => string | null
}

export function useResourceField(
  resourcePath: string,
  fieldName: string,
  initialValue: any,
  opts: FieldOptions = {}
) {
  const { debounceMs = 0, optimistic = true, validate } = opts
  const notify = useNotifications()
  const [value, setValue] = useState(initialValue)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<any>(null)
  const baseRef = useRef(initialValue)

  useEffect(() => {
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [])

  function scheduleSave() {
    if (debounceMs <= 0) return save()
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => save(), debounceMs)
  }

  async function save() {
    const err = validate ? validate(value) : null
    if (err) { setError(err); notify.error(err); return { ok: false, error: err } }
    if (shallowEqual(value, baseRef.current)) return { ok: true }
    const patch = { [fieldName]: value }
    const prev = baseRef.current
    if (optimistic) baseRef.current = value
    setSaving(true)
    try {
      const res = await fetch(resourcePath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error(await responseErrorMessage(res))
      if (res.status !== 204) {
        const raw = await safeJson(res)
        const serverVal = raw?.[fieldName]
        if (serverVal !== undefined) {
          baseRef.current = serverVal
          setValue(serverVal)
        } else {
          baseRef.current = value
        }
      } else {
        baseRef.current = value
      }
      setError(null)
      notify.success('Saved')
      return { ok: true }
    } catch (e: any) {
      if (optimistic) baseRef.current = prev
      setValue(prev)
      setError(e?.message || 'Failed to save')
      notify.error(e?.message || 'Failed to save')
      return { ok: false, error: e }
    } finally {
      setSaving(false)
    }
  }

  return {
    value,
    setValue: (v: any, autosave = false) => {
      setValue(v)
      if (autosave) scheduleSave()
    },
    save,
    saving,
    error,
  }
}

async function safeJson(res: Response) {
  try { return await res.json() } catch { return null }
}

async function responseErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json()
    const detail = (data as any)?.detail
    const msgs = flattenErrors(data)
    return (typeof detail === 'string' && detail) || msgs || `${res.status} ${res.statusText}`
  } catch {
    return `${res.status} ${res.statusText}`
  }
}

function flattenErrors(data: Record<string, any>): string {
  try {
    const parts: string[] = []
    for (const [k, v] of Object.entries(data || {})) {
      if (k === 'detail') continue
      if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`)
      else if (typeof v === 'string') parts.push(`${k}: ${v}`)
    }
    return parts.join(' | ')
  } catch { return '' }
}

function shallowEqual(a: any, b: any) {
  return a === b
}

// Creator hook for new resources
export type CreatorOptions = {
  initialData?: Record<string, any> | null
  extract?: ExtractFn
}

export function useResourceCreator(resourcePath: string, opts: CreatorOptions = {}) {
  const { initialData = {}, extract } = opts
  const notify = useNotifications()
  const [data, setData] = useState<Record<string, any>>(initialData || {})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setField(name: string, value: any) {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  async function create(keys?: string[]) {
    const body = keys && keys.length ? pick(data, keys) : data
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(resourcePath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await responseErrorMessage(res))
      const raw = await safeJson(res)
      const created = extract ? extract(raw) : raw
      notify.success('Created')
      return { ok: true, data: created }
    } catch (e: any) {
      const msg = e?.message || 'Failed to create'
      setError(msg)
      notify.error(msg)
      return { ok: false, error: e }
    } finally {
      setSaving(false)
    }
  }

  return { data, setField, saving, error, create }
}

function pick(obj: Record<string, any>, keys: string[]) {
  const out: Record<string, any> = {}
  for (const k of keys) out[k] = obj[k]
  return out
}
