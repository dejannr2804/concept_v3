import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <main className="container">
      <div className="card">
        <h1>Profile</h1>
        <p>Username: {user.username}</p>
        <p>Email: {user.email}</p>
      </div>
    </main>
  )
}

