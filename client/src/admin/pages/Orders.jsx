import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../api';
import { useAdminData, PageHead, Panel, Table, Pill, Btn, Field, Input, Select, Textarea, Pagination, Modal, STATUS_TONE, money, dateTime, useToast } from '../ui';
import { CandleThumb } from '@/components/shop/CandleThumb';

function OrderDetail({ id, onClose, onChanged }) {
  const { data: order, loading, setData } = useAdminData(() => adminApi.orders.get(id), [id]);
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const current = form || (order ? { status: order.status, trackingNumber: order.trackingNumber || '', trackingUrl: order.trackingUrl || '', internalNote: order.internalNote || '' } : null);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await adminApi.orders.update(order.id, current);
      setData(updated);
      setForm(null);
      onChanged?.(updated);
      toast(`Order ${updated.orderNumber} updated`, { type: 'success' });
    } catch (err) { toast(err.message, { type: 'error' }); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={order ? `Order ${order.orderNumber}` : 'Order'} width={980} footer={order && <><Btn variant="ghost" onClick={onClose}>Close</Btn><Btn onClick={save} loading={saving}>Save changes</Btn></>}>
      {loading && !order ? <div className="adm-loading"><span className="adm-spinner adm-spinner--dark" /></div> : order && (
        <div className="adm-order">
          <div className="adm-order__main">
            <div className="adm-order__meta">
              <Pill tone={STATUS_TONE[order.status]}>{order.status}</Pill>
              <Pill tone={STATUS_TONE[order.payment?.status] || 'neutral'}>{order.payment?.method?.toUpperCase()} · {order.payment?.status}</Pill>
              <span className="adm-muted adm-small">Placed {dateTime(order.createdAt)}</span>
            </div>
            <table className="adm-table adm-table--compact">
              <thead><tr><th>Item</th><th>Size</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
              <tbody>
                {order.lines.map((l) => (
                  <tr key={`${l.slug}-${l.sizeId}`}>
                    <td><span className="adm-cell-thumb"><CandleThumb vessel={l.vessel} size={28} lit={false} /><Link className="adm-link" to={`/admin/products/${l.slug}`}>{l.name}</Link></span></td>
                    <td>{l.sizeLabel}</td>
                    <td style={{ textAlign: 'right' }}>{l.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{money(l.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="adm-totals">
              <div><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
              {order.discount > 0 && <div><span>Discount {order.coupon?.code && `(${order.coupon.code})`}</span><span>− {money(order.discount)}</span></div>}
              <div><span>Shipping</span><span>{order.shipping === 0 ? 'Free' : money(order.shipping)}</span></div>
              {order.giftWrap && <div><span>Gift wrap</span><span>{money(order.giftWrapFee)}</span></div>}
              <div className="adm-totals__grand"><span>Total</span><span>{money(order.total)}</span></div>
            </div>
            {order.giftMessage && <p className="adm-note"><strong>Gift message:</strong> “{order.giftMessage}”</p>}
            {order.notes && <p className="adm-note"><strong>Customer notes:</strong> {order.notes}</p>}
            <h4 className="adm-h4">Timeline</h4>
            <ul className="adm-timeline">{order.timeline?.map((t, i) => <li key={i}><span>{t.label}</span><small className="adm-muted">{dateTime(t.at)}{t.by ? ` · ${t.by}` : ''}</small></li>)}</ul>
          </div>
          <aside className="adm-order__side">
            <h4 className="adm-h4">Deliver to</h4>
            <p>{order.address?.fullName}<br />{order.address?.line1}{order.address?.line2 && <>, {order.address.line2}</>}<br />{order.address?.city}, {order.address?.state} {order.address?.postalCode}<br /><a className="adm-link" href={`tel:${order.address?.phone}`}>{order.address?.phone}</a><br /><a className="adm-link" href={`mailto:${order.email}`}>{order.email}</a></p>
            <h4 className="adm-h4">Fulfilment</h4>
            <Field label="Status"><Select value={current.status} onChange={(e) => setForm({ ...current, status: e.target.value })}>{['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'].map((s) => <option key={s}>{s}</option>)}</Select></Field>
            <Field label="Tracking number"><Input value={current.trackingNumber} onChange={(e) => setForm({ ...current, trackingNumber: e.target.value })} /></Field>
            <Field label="Tracking URL"><Input value={current.trackingUrl} onChange={(e) => setForm({ ...current, trackingUrl: e.target.value })} placeholder="https://" /></Field>
            <Field label="Internal note" hint="Never shown to the customer"><Textarea rows={3} value={current.internalNote} onChange={(e) => setForm({ ...current, internalNote: e.target.value })} /></Field>
          </aside>
        </div>
      )}
    </Modal>
  );
}

export default function Orders() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useState({ page: 1, status: '', q: '' });
  const { data, loading, setData } = useAdminData(() => adminApi.orders.list(params), [params.page, params.status, params.q]);

  return (
    <>
      <PageHead title="Orders" sub={data ? `${data.total} orders` : ''} />
      <Panel padded={false} actions={(
        <div className="adm-row">
          <Input placeholder="Search order #, email, name, city…" value={params.q} onChange={(e) => setParams({ ...params, q: e.target.value, page: 1 })} style={{ width: 280 }} />
          <Select value={params.status} onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })} style={{ width: 160 }}>
            <option value="">All statuses</option>
            {(data?.statuses || []).map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      )}>
        <Table
          loading={loading}
          rows={data?.items || []}
          onRowClick={(r) => navigate(`/admin/orders/${r.id}`)}
          columns={[
            { key: 'orderNumber', label: 'Order', render: (r) => <span className="adm-strong">{r.orderNumber}</span> },
            { key: 'customer', label: 'Customer', render: (r) => <span>{r.address?.fullName || r.email}<br /><small className="adm-muted">{r.email}{r.address?.city && ` · ${r.address.city}`}</small></span> },
            { key: 'lines', label: 'Items', render: (r) => <span className="adm-thumbs">{r.lines.slice(0, 4).map((l) => <CandleThumb key={`${l.slug}-${l.sizeId}`} vessel={l.vessel} size={24} lit={false} />)}{r.lines.length > 4 && <small>+{r.lines.length - 4}</small>}</span> },
            { key: 'total', label: 'Total', align: 'right', render: (r) => money(r.total) },
            { key: 'payment', label: 'Payment', render: (r) => <Pill tone={STATUS_TONE[r.payment?.status] || 'neutral'}>{r.payment?.method} · {r.payment?.status}</Pill> },
            { key: 'status', label: 'Status', render: (r) => <Pill tone={STATUS_TONE[r.status]}>{r.status}</Pill> },
            { key: 'createdAt', label: 'Placed', render: (r) => <small className="adm-muted">{dateTime(r.createdAt)}</small> },
          ]}
          empty="No orders match."
        />
        <Pagination page={data?.page} pages={data?.pages} onChange={(page) => setParams({ ...params, page })} />
      </Panel>
      {id && <OrderDetail id={id} onClose={() => navigate('/admin/orders')} onChanged={(u) => data && setData({ ...data, items: data.items.map((o) => (o.id === u.id ? u : o)) })} />}
    </>
  );
}
