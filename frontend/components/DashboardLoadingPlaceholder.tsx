"use client"

import { useEffect, useState } from 'react'

const LOADER_DELAY_MS = 2000

export function DashboardLoadingPlaceholder() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), LOADER_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div
      className="dlp-wrapper"
      role={visible ? 'status' : undefined}
      aria-live="polite"
      aria-label="Loading dashboard content"
    >
      {visible ? (
        <>
          <span className="dlp-srOnly">Loading dashboard content…</span>
          <div className="loader" />
        </>
      ) : null}
    </div>
  )
}

export default DashboardLoadingPlaceholder
