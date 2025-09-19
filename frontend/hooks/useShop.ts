"use client"

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Shop } from '@/lib/shops/types'

export type UseShopResult = {
  shop: Shop | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useShop(slug: string): UseShopResult {
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const refresh = useCallback(() => {
    setReloadKey((key) => key + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await api.get<Shop>(`shops/slug/${slug}`)
        if (!cancelled) setShop(data)
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load shop')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [slug, reloadKey])

  return { shop, loading, error, refresh }
}
