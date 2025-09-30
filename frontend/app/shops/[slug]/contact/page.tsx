"use client"

import LoaderStatus from '@/components/LoaderStatus'
import { useShop } from '@/hooks/useShop'
import { useEffect } from 'react'

const ensureProtocol = (url?: string | null) => {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

export default function ShopContactPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const { shop, loading, error } = useShop(slug)

  useEffect(() => {
    if (loading) {
      document.title = 'Loading contact…'
      return
    }
    if (error) {
      document.title = 'Contact – Error'
      return
    }
    if (shop) {
      document.title = `${shop.name} · Contact`
    } else {
      document.title = 'Contact'
    }
  }, [loading, error, shop])

  if (loading) return <LoaderStatus label="Loading contact details" delay={600} />

  if (error) {
    return (
      <main className="public-shop-page">
        <section className="public-shop-content">
          <p>{error}</p>
        </section>
      </main>
    )
  }

  if (!shop) {
    return (
      <main className="public-shop-page">
        <section className="public-shop-content">
          <p>Shop not found.</p>
        </section>
      </main>
    )
  }

  const email = shop.contact_email || `hello@${shop.slug}.com`
  const phone = shop.contact_phone || '+1 (555) 123-4567'
  const website = ensureProtocol(shop.contact_website || `${shop.slug}.com`)
  const address = shop.contact_address || 'We operate online and will share our studio address soon.'

  return (
    <main className="public-shop-page">
      <section className="public-shop-content public-shop-contact">
        <div className="public-shop-contentHeader">
          <h2>Let&apos;s connect</h2>
          <p>
            We love hearing from you. Reach out to {shop.name} through the channel that suits you best and
            we&apos;ll respond shortly.
          </p>
        </div>
        <div className="public-shop-contactGrid">
          <article className="public-shop-contactCard">
            <h3>Email</h3>
            <p>Drop us a note and we&apos;ll follow up within one business day.</p>
            <a href={`mailto:${email}`} className="public-shop-contactLink">{email}</a>
          </article>
          <article className="public-shop-contactCard">
            <h3>Phone</h3>
            <p>Prefer to talk it through? Give us a call.</p>
            <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="public-shop-contactLink">{phone}</a>
          </article>
          <article className="public-shop-contactCard">
            <h3>Visit</h3>
            <p>{address}</p>
            {website ? (
              <a href={website} target="_blank" rel="noreferrer" className="public-shop-contactLink">
                Visit website
              </a>
            ) : null}
          </article>
        </div>
      </section>
    </main>
  )
}
