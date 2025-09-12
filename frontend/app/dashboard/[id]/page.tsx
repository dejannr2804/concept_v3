"use client"
import Link from 'next/link'
import { useResourceItem } from '@/hooks/resource'

type Shop = { id: number; name: string; slug: string }

export default function ShopDashboardPage({ params }: { params: { id: string } }) {
  const { id } = params
  const shop = useResourceItem<Shop>(`shops/${id}`)

  return (
    <main>
      {shop.loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="shop-overview-container">
            <div className="top-line">
              {shop.data && (
                  <>
                    <Link href={`/shops/${shop.data.slug}`}>
                      <h1>{shop.data ? shop.data.name : 'Shop'}</h1>
                      <img src="/img/arrow-narrow-up-right-d.svg" alt="" className="nav-icon"/>
                    </Link>{' '}
                  </>
              )}
            </div>
            <div className="main">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
