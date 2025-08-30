"use client"
import { useMemo } from 'react'
import { ApiClient } from '@/components/ApiClient'
import { useAuth } from '@/hooks/useAuth'

export function useApi() {
  const { token } = useAuth()
  return useMemo(() => new ApiClient({ getToken: () => token }), [token])
}

