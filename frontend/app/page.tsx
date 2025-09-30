import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home',
}

export default function HomePage() {
  return (
    <main className="container">
      <div className="card">
        <h1>This is index page</h1>
      </div>
    </main>
  )
}
