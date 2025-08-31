import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import ShopsClient from './shops-client'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <main className="container">
      <div className="card">
        <h1>Your Shops</h1>
        <div className="spacer" />
        <ShopsClient />
        <div className="spacer" />
        <Link href="/dashboard/new">Create a new shop</Link>
      </div>
    </main>
  )
}

