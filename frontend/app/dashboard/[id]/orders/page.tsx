export default function OrdersPage({ params }: { params: { id: string } }) {
  return (
    <div className="products-page-container">
      <div className="top-line">
        <h1 className="heading">Orders</h1>
      </div>

      {/* Filters-style placeholder */}
      <div className="filters">
        <div className="filter">
          <input type="text" placeholder='Search orders...'/>
        </div>
        <div className="filter">
          <span>Status</span>
          <img src="/img/chevron-down.svg" alt="" className="nav-icon"/>
        </div>
        <div className="filter">
          <span>Date range</span>
          <img src="/img/chevron-down.svg" alt="" className="nav-icon"/>
        </div>
        <div className="filter">
          <span>Channel</span>
          <img src="/img/chevron-down.svg" alt="" className="nav-icon"/>
        </div>
      </div>

      {/* Placeholder skeleton rows */}
      <div className="orders-skeleton">
        <div className="row">
          <div className="pill pill--sm" />
          <div className="pill pill--md" />
          <div className="pill pill--lg" />
          <div className="pill pill--sm" />
        </div>
        <div className="row">
          <div className="pill pill--sm" />
          <div className="pill pill--md" />
          <div className="pill pill--lg" />
          <div className="pill pill--sm" />
        </div>
        <div className="row">
          <div className="pill pill--sm" />
          <div className="pill pill--md" />
          <div className="pill pill--lg" />
          <div className="pill pill--sm" />
        </div>
        <div className="row">
          <div className="pill pill--sm" />
          <div className="pill pill--md" />
          <div className="pill pill--lg" />
          <div className="pill pill--sm" />
        </div>
        <div className="row">
          <div className="pill pill--sm" />
          <div className="pill pill--md" />
          <div className="pill pill--lg" />
          <div className="pill pill--sm" />
        </div>
      </div>
    </div>
  )
}
