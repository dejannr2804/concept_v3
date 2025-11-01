"use client"

import React, { createContext, useContext } from 'react'
import { useShopCart } from '@/hooks/useShopCart'
import type { UseShopCartState } from '@/hooks/useShopCart'

const CartContext = createContext<UseShopCartState | null>(null)

export function CartProvider({ shopSlug, children }: { shopSlug: string; children: React.ReactNode }) {
  const cartState = useShopCart(shopSlug)
  return <CartContext.Provider value={cartState}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
