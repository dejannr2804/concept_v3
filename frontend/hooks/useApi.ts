"use client"
import { useMemo } from 'react'
import { ApiClient } from '@/components/ApiClient'
import { useAuth } from '@/hooks/useAuth'

export function useApi() {
  const { user } = useAuth()
  // Recreate the client when auth state changes so future requests include fresh cookies.
  return useMemo(() => new ApiClient(), [user?.id])
}
