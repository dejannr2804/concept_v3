"use client"
import React from 'react'

type UsageMeterProps = {
  label?: string
  used: number
  max: number
  bars?: number
  className?: string
}

export default function UsageMeter({ label = 'Products', used, max, bars = 20, className = '' }: UsageMeterProps) {
  const clampedUsed = Math.max(0, used)
  const clampedMax = Math.max(1, max)
  const pct = Math.min(1, clampedUsed / clampedMax)
  const filled = Math.round(pct * bars)
  const ariaPercent = `${Math.round(pct * 100)}%`
  const caption = `${clampedUsed} of ${clampedMax} products`

  return (
    <div className={`pe-usageBlock ${className}`} aria-label={`${label} usage`}>
      <div className="pe-usageHeader">
        <div className="pe-usageIcon" aria-hidden>
          <img src="/img/shopping-bag-02.svg" alt="" className="pe-icon pe-icon--inline" />
        </div>
        <div className="pe-usageTitle">{label}</div>
      </div>
      <div className="pe-meterBars" role="img" aria-label={`${ariaPercent} of product capacity used`}>
        {Array.from({ length: bars }).map((_, i) => (
          <span key={i} className={`pe-meterBar ${i < filled ? 'is-filled' : ''}`} />
        ))}
      </div>
      <div className="pe-meterCaption">
        <span className="pe-meterCount">{caption}</span>
      </div>
    </div>
  )
}
