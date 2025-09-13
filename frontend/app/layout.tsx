import './styles/base.css'
import './styles/utilities.css'
import './styles/header.css'
import './styles/sidebar.css'
import './styles/notifications.css'
import './styles/auth.css'
import './styles/dashboard.css'
import './styles/product-editor.css'
import './styles/shops.css'
import './styles/shop-overview.css'
import './styles/products-page.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/components/AuthProvider'
import { NotificationsProvider } from '@/components/Notifications'
import { getCurrentUser } from '@/lib/auth'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Next + Django Starter',
  description: 'A scalable starter using Next.js and Django REST',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NotificationsProvider>
          <AuthProvider initialUser={user}>
            <Header />
            {children}
          </AuthProvider>
        </NotificationsProvider>
      </body>
    </html>
  )
}
