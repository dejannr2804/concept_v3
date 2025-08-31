import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import ProfileClient from './profile-client'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <main className="container">
      <div className="card">
        <h1>Profile</h1>
        <ProfileClient user={user} />
      </div>
    </main>
  )
}
