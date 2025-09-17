"use client"

export function DashboardLoadingPlaceholder() {
  return (
    <div className="dlp-wrapper" role="status" aria-live="polite" aria-label="Loading dashboard content">
      <span className="dlp-srOnly">Loading dashboard content…</span>
      <div className="dlp-spinner" />
    </div>
  )
}

export default DashboardLoadingPlaceholder
