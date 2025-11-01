"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { useNotifications } from '@/components/Notifications'
import type { Cart, Order } from '@/lib/shops/types'

const STORAGE_PREFIX = 'concept_cart_token:'

export type AddToCartPayload = {
  product_id?: number
  product_slug?: string
  quantity?: number
  inventory_item_id?: number | null
  options?: { variant_type_id: number; variant_option_id: number }[]
}

export type CheckoutPayload = {
  customer_name: string
  customer_email: string
  customer_phone?: string
  notes?: string
  shipping_address?: Record<string, any>
  billing_address?: Record<string, any>
}

export type UseShopCartState = {
  cart: Cart | null
  loading: boolean
  submitting: boolean
  error: string | null
  addItem: (payload: AddToCartPayload) => Promise<void>
  updateQuantity: (itemId: number, quantity: number) => Promise<void>
  removeItem: (itemId: number) => Promise<void>
  checkout: (payload: CheckoutPayload) => Promise<Order>
  refresh: () => Promise<void>
  reset: () => void
}

const isBrowser = typeof window !== 'undefined'

function storageKey(shopSlug: string) {
  return `${STORAGE_PREFIX}${shopSlug}`
}

export function useShopCart(shopSlug: string): UseShopCartState {
  const notify = useNotifications()
  const [cart, setCart] = useState<Cart | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const tokenRef = useRef<string | null>(null)

  // Load token from storage on mount
  useEffect(() => {
    if (!shopSlug || !isBrowser) {
      setLoading(false)
      return
    }
    try {
      const stored = window.localStorage.getItem(storageKey(shopSlug))
      if (stored) {
        setToken(stored)
        tokenRef.current = stored
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }, [shopSlug])

  const persistToken = useCallback((value: string | null) => {
    tokenRef.current = value
    if (!isBrowser) return
    const key = storageKey(shopSlug)
    if (value) {
      window.localStorage.setItem(key, value)
    } else {
      window.localStorage.removeItem(key)
    }
  }, [shopSlug])

  const fetchCart = useCallback(async (cartToken: string | null) => {
    if (!cartToken) {
      setCart(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<Cart>(`shops/carts/${cartToken}`)
      setCart(data)
      setLoading(false)
    } catch (err: any) {
      const message = err?.message || 'Failed to load cart'
      setError(message)
      setCart(null)
      persistToken(null)
      setLoading(false)
    }
  }, [persistToken])

  // Fetch cart when token changes
  useEffect(() => {
    if (!token) {
      if (tokenRef.current) {
        // token cleared elsewhere
        fetchCart(tokenRef.current)
      } else {
        setLoading(false)
      }
      return
    }
    fetchCart(token)
  }, [token, fetchCart])

  const handleCartResponse = useCallback((data: Cart) => {
    if (!data) return
    setCart(data)
    if (data.token) {
      setToken(data.token)
      persistToken(data.token)
    }
  }, [persistToken])

  const addItem = useCallback(async (payload: AddToCartPayload) => {
    if (!payload?.product_id && !payload?.product_slug) {
      notify.error('Missing product information')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const data = await api.post<Cart>(`shops/slug/${shopSlug}/cart/items`, {
        ...payload,
        cart_token: tokenRef.current,
      })
      handleCartResponse(data)
      notify.success('Added to cart')
    } catch (err: any) {
      const message = err?.message || 'Unable to add to cart'
      setError(message)
      notify.error(message)
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [shopSlug, handleCartResponse, notify])

  const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
    const cartToken = tokenRef.current
    if (!cartToken) {
      notify.error('Cart unavailable')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const data = await api.patch<Cart>(`shops/carts/${cartToken}/items/${itemId}`, { quantity })
      handleCartResponse(data)
    } catch (err: any) {
      const message = err?.message || 'Unable to update quantity'
      setError(message)
      notify.error(message)
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [handleCartResponse, notify])

  const removeItem = useCallback(async (itemId: number) => {
    const cartToken = tokenRef.current
    if (!cartToken) {
      notify.error('Cart unavailable')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const data = await api.delete<Cart>(`shops/carts/${cartToken}/items/${itemId}`)
      handleCartResponse(data)
    } catch (err: any) {
      const message = err?.message || 'Unable to remove item'
      setError(message)
      notify.error(message)
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [handleCartResponse, notify])

  const checkout = useCallback(async (payload: CheckoutPayload) => {
    const cartToken = tokenRef.current
    if (!cartToken) {
      notify.error('Cart unavailable')
      throw new Error('Cart unavailable')
    }
    setSubmitting(true)
    setError(null)
    try {
      const order = await api.post<Order>(`shops/carts/${cartToken}/checkout`, payload)
      notify.success('Order placed successfully')
      setCart(null)
      persistToken(null)
      return order
    } catch (err: any) {
      const message = err?.message || 'Checkout failed'
      setError(message)
      notify.error(message)
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [notify, persistToken])

  const refresh = useCallback(async () => {
    await fetchCart(tokenRef.current)
  }, [fetchCart])

  const reset = useCallback(() => {
    setCart(null)
    setToken(null)
    persistToken(null)
    setError(null)
  }, [persistToken])

  return {
    cart,
    loading,
    submitting,
    error,
    addItem,
    updateQuantity,
    removeItem,
    checkout,
    refresh,
    reset,
  }
}
