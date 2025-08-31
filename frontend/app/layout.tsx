import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/components/AuthProvider'
import { NotificationsProvider } from '@/components/Notifications'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Next + Django Starter',
  description: 'A scalable starter using Next.js and Django REST',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  return (
    <html lang="en">
      <body>
        <NotificationsProvider>
          <AuthProvider initialUser={user}>
            {children}
          </AuthProvider>
        </NotificationsProvider>
      </body>
    </html>
  )
}
