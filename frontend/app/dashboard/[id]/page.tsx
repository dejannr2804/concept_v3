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
                    <h1>{shop.data ? shop.data.name : 'Shop'}</h1>
                    <Link href={`/shops/${shop.data.slug}`} className="preview">
                      <img src="/img/arrow-narrow-up-right.svg" alt="" className="nav-icon"/>
                      <span>Preview</span>
                    </Link>
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
