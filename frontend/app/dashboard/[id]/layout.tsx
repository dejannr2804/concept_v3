import Sidebar from './Sidebar'

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const { id } = params
  return (
    <div className="pe-shell">
      <Sidebar shopId={id} />
      <div className="pe-content">
        {children}
      </div>
    </div>
  )
}

