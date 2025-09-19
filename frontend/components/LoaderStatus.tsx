"use client"

import { useEffect, useMemo, useState } from 'react'

type LoaderStatusProps = {
  label?: string
  delay?: number
}

const DEFAULT_LABEL = 'Loading…'

export default function LoaderStatus({ label = DEFAULT_LABEL, delay = 0 }: LoaderStatusProps) {
  const [visible, setVisible] = useState(delay <= 0)

  useEffect(() => {
    if (delay <= 0) return
    const timer = window.setTimeout(() => setVisible(true), delay)
    return () => window.clearTimeout(timer)
  }, [delay])

  const ariaLabel = useMemo(() => label || DEFAULT_LABEL, [label])

  return (
    <div
      className={`dlp-wrapper ${visible ? 'dlp-fadeIn' : ''}`}
      role={visible ? 'status' : undefined}
      aria-live="polite"
      aria-label={ariaLabel}
    >
      {visible ? (
        <>
          <span className="dlp-srOnly">{ariaLabel}</span>
          <div className="loader" />
        </>
      ) : null}
    </div>
  )
}
