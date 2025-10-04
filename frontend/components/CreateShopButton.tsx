"use client"
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/components/Notifications'

export default function CreateShopButton({ currentCount, accountType }: { currentCount: number; accountType?: 'free' | 'paid' | 'enterprise' | string | null }) {
  const router = useRouter()
  const notify = useNotifications()

  function maxAllowed(type?: string | null): number | null {
    if (!type || type === 'free') return 1
    if (type === 'paid') return 5
    if (type === 'enterprise') return null
    // Unknown future plan -> treat as unlimited to avoid false negatives
    return null
  }

  function onClick(e: React.MouseEvent) {
    e.preventDefault()
    const max = maxAllowed(accountType)
    if (max !== null && currentCount >= max) {
      const plan = (accountType || 'free')
      notify.error(`You have reached your shop limit for the '${plan}' plan. Max shops: ${max}.`)
      return
    }
    router.push('/dashboard/new')
  }

  return (
    <button className="create-new-shop" onClick={onClick}>
      <img src="/img/plus.svg" alt="" className="nav-icon"/>
      Create a new shop
    </button>
  )
}

