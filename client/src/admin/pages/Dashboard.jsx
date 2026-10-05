import { Link } from 'react-router-dom';
import { adminApi } from '../api';
import { useAdminData, PageHead, Panel, Stat, Table, Pill, STATUS_TONE, money, dateTime } from '../ui';
import { CandleThumb } from '@/components/shop/CandleThumb';

export default function Dashboard() {
  const { data, loading, error } = useAdminData(() => adminApi.overview(), []);
  if (error) return <div className="adm-empty">{error.message}</div>;
  if (loading && !data) return <div className="adm-loading"><span className="adm-spinner adm-spinner--dark" /></div>;
  const { stats, recentOrders, lowStock, salesByDay, bestsellers } = data;
  const max = Math.max(1, ...salesByDay.map((d) => d.revenue));

  return (
    <>
      <PageHead title="Good day, studio." sub="Here is how NOORÉ is doing." />
      <div className="adm-stats">
        <Stat label="Revenue (all time)" value={money(stats.revenue)} hint={`${money(stats.revenueLast30)} in the last 30 days`} tone="gold" />
        <Stat label="Orders" value={stats.orders} hint={`${stats.pendingOrders} awaiting fulfilment`} />
        <Stat label="Average order" value={money(stats.averageOrder)} />
        <Stat label="Customers" value={stats.customers} hint={`${stats.subscribers} newsletter subscribers`} />
        <Stat label="Open enquiries" value={stats.enquiries + stats.contacts} hint={`${stats.enquiries} corporate · ${stats.contacts} messages`} tone={stats.enquiries + stats.contacts > 0 ? 'warn' : undefined} />
        <Stat label="Products" value={stats.products} hint={stats.unpublished ? `${stats.unpublished} unpublished` : 'All published'} />
      </div>

      <div className="adm-grid-2">
        <Panel title="Sales · last 30 days" sub={salesByDay.length ? `${salesByDay.reduce((s, d) => s + d.orders, 0)} orders` : 'No orders yet'}>
          {salesByDay.length === 0 ? <div className="adm-empty">Sales will chart here as orders arrive.</div> : (
            <div className="adm-bars">
              {salesByDay.map((d) => (
                <div key={d.day} className="adm-bar" title={`${d.day}: ${money(d.revenue)} · ${d.orders} orders`}>
                  <span style={{ height: `${Math.max(4, (d.revenue / max) * 100)}%` }} />
                  <small>{d.day.slice(5)}</small>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Bestsellers">
          <Table
            columns={[
              { key: 'name', label: 'Candle', render: (r) => <Link to={`/admin/products/${r.slug}`} className="adm-link">{r.name}</Link> },
              { key: 'units', label: 'Units', align: 'right' },
              { key: 'revenue', label: 'Revenue', align: 'right', render: (r) => money(r.revenue) },
            ]}
            rows={bestsellers}
            rowKey={(r) => r.slug}
            empty="No sales yet."
          />
        </Panel>
      </div>

      <div className="adm-grid-2">
        <Panel title="Recent orders" actions={<Link to="/admin/orders" className="adm-link">All orders →</Link>} padded={false}>
          <Table
            columns={[
              { key: 'orderNumber', label: 'Order', render: (r) => <Link to={`/admin/orders/${r.id}`} className="adm-link">{r.orderNumber}</Link> },
              { key: 'email', label: 'Customer', render: (r) => <span>{r.address?.fullName || r.email}<br /><small className="adm-muted">{r.email}</small></span> },
              { key: 'total', label: 'Total', align: 'right', render: (r) => money(r.total) },
              { key: 'status', label: 'Status', render: (r) => <Pill tone={STATUS_TONE[r.status]}>{r.status}</Pill> },
              { key: 'createdAt', label: 'Placed', render: (r) => <small className="adm-muted">{dateTime(r.createdAt)}</small> },
            ]}
            rows={recentOrders}
            empty="No orders yet — share the storefront!"
          />
        </Panel>
        <Panel title="Low stock" sub="10 or fewer left" padded={false}>
          <Table
            columns={[
              { key: 'name', label: 'Candle', render: (r) => <span className="adm-cell-thumb"><CandleThumb vessel={r.vessel} size={28} lit={false} /><Link to={`/admin/products/${r.slug}`} className="adm-link">{r.name}</Link></span> },
              { key: 'collection', label: 'Collection' },
              { key: 'stock', label: 'Stock', align: 'right', render: (r) => <Pill tone={r.stock === 0 ? 'bad' : 'warn'}>{r.stock}</Pill> },
            ]}
            rows={lowStock}
            rowKey={(r) => r.slug}
            empty="Everything is well stocked."
          />
        </Panel>
      </div>
    </>
  );
}
