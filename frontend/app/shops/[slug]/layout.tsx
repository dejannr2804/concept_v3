"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import LoaderStatus from '@/components/LoaderStatus'
import { useShop } from '@/hooks/useShop'
import { CartProvider, useCart } from '@/components/cart/CartProvider'

const normalize = (value: string) => value.replace(/\/$/, '')

export default function ShopLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { slug: string }
}) {
  const { slug } = params
  const { shop, loading } = useShop(slug)
  const pathname = usePathname()
  const basePath = `/shops/${slug}`

  const navLinks = useMemo(
    () => [
      { href: basePath, label: 'Home' },
      { href: `${basePath}/products`, label: 'Products' },
      { href: `${basePath}/contact`, label: 'Contact' },
    ],
    [basePath],
  )

  const normalizedPath = pathname ? normalize(pathname) : ''
  const normalizedBase = normalize(basePath)

  const isActive = (href: string) => {
    const normalizedHref = normalize(href)
    if (normalizedHref === normalizedBase) {
      return normalizedPath === normalizedBase
    }
    return normalizedPath.startsWith(normalizedHref)
  }

  const activeClass = (href: string) => (isActive(href) ? ' is-active' : '')

  const brandInitial = shop?.name?.charAt(0)?.toUpperCase() || '?'

  if (loading && !shop) {
    return (
      <div className="public-shop-layout">
        <LoaderStatus label="Loading shop" delay={600} />
      </div>
    )
  }

  return (
    <CartProvider shopSlug={slug}>
      <div className="public-shop-layout">
        <header className="public-shop-header">
          <div className="public-shop-headerInner">
            <Link href={basePath} className="public-shop-brand" aria-label={`${shop?.name || 'Shop'} home`}>
              {shop?.profile_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.profile_image_url} alt="Logo" className="public-shop-brandLogo" />
              ) : (
                <div className="public-shop-brandFallback">{brandInitial}</div>
              )}
              <div className="public-shop-brandCopy">
                <span className="public-shop-brandNameText">{shop?.name || 'Loading shop'}</span>
              </div>
            </Link>
            <nav className="public-shop-nav" aria-label="Shop navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`public-shop-navLink${activeClass(link.href)}`}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="cart">
              <CartButton shopSlug={slug} />
            </div>
          </div>
        </header>
        <div className="public-shop-body">{children}</div>
      </div>
    </CartProvider>
  )
}

function CartButton({ shopSlug }: { shopSlug: string }) {
  const { cart } = useCart()
  const count = cart?.total_items ?? 0
  return (
    <Link href={`/shops/${shopSlug}/cart`} className="cart-button" aria-label="View cart">
      <img src="/img/shopping-bag-02.svg" alt="" />
      <span>Cart</span>
      {count > 0 ? <span className="cart-count-pill">{count}</span> : null}
    </Link>
  )
}
