import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../api';
import { useAdminData, PageHead, Panel, Table, Btn, Pill, Toggle, Input, Select, money, useToast } from '../ui';
import { CandleThumb } from '@/components/shop/CandleThumb';
import { COLLECTION_LABEL } from '@/lib/format';

export default function Products() {
  const { data, loading, reload, setData } = useAdminData(() => adminApi.products.list(), []);
  const toast = useToast();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [col, setCol] = useState('');
  const [busySlug, setBusySlug] = useState(null);

  const rows = useMemo(() => {
    let list = data?.items || [];
    if (col) list = list.filter((p) => p.collection === col);
    if (q) { const n = q.toLowerCase(); list = list.filter((p) => [p.name, p.slug, p.family, p.tagline].join(' ').toLowerCase().includes(n)); }
    return list;
  }, [data, q, col]);

  const patch = async (slug, payload) => {
    setBusySlug(slug);
    try {
      const saved = await adminApi.products.patch(slug, payload);
      setData({ ...data, items: data.items.map((p) => (p.slug === slug ? saved : p)) });
    } catch (err) { toast(err.message, { type: 'error' }); } finally { setBusySlug(null); }
  };
  const duplicate = async (slug) => {
    try { const copy = await adminApi.products.duplicate(slug); toast(`Created "${copy.name}" as a draft`, { type: 'success' }); navigate(`/admin/products/${copy.slug}`); } catch (err) { toast(err.message, { type: 'error' }); }
  };
  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try { await adminApi.products.remove(p.slug); toast('Product deleted'); reload(); } catch (err) { toast(err.message, { type: 'error' }); }
  };
  const move = async (index, dir) => {
    const list = [...(data?.items || [])];
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];
    setData({ ...data, items: list });
    try { await adminApi.products.reorder(list.map((p) => p.slug)); } catch (err) { toast(err.message, { type: 'error' }); reload(); }
  };

  return (
    <>
      <PageHead title="Products" sub={`${data?.items?.length || 0} candles & sets · the order below is the storefront's default order`}>
        <Link to="/admin/products/new" className="adm-btn adm-btn--primary adm-btn--md">+ New product</Link>
      </PageHead>
      <Panel padded={false} actions={(
        <div className="adm-row">
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 220 }} />
          <Select value={col} onChange={(e) => setCol(e.target.value)} style={{ width: 170 }}>
            <option value="">All collections</option>
            {(data?.collections || []).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </Select>
        </div>
      )}>
        <Table
          loading={loading}
          rows={rows}
          rowKey={(r) => r.slug}
          columns={[
            { key: 'order', label: '', width: 64, render: (r) => { const i = (data?.items || []).indexOf(r); return (
              <span className="adm-reorder">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || Boolean(q) || Boolean(col)} aria-label="Move up">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === (data?.items?.length || 0) - 1 || Boolean(q) || Boolean(col)} aria-label="Move down">↓</button>
              </span>); } },
            { key: 'name', label: 'Product', render: (r) => (
              <span className="adm-cell-thumb">
                <CandleThumb vessel={r.vessel} size={34} lit={false} />
                <span><Link to={`/admin/products/${r.slug}`} className="adm-link adm-strong">{r.name}</Link><br /><small className="adm-muted">/{r.slug} · {r.family}</small></span>
              </span>) },
            { key: 'collection', label: 'Collection', render: (r) => COLLECTION_LABEL[r.collection] || r.collection },
            { key: 'price', label: 'From', align: 'right', render: (r) => money(r.price) },
            { key: 'stock', label: 'Stock', width: 110, render: (r) => (
              <Input type="number" min={0} value={r.stock} className="adm-input--sm" onChange={(e) => setData({ ...data, items: data.items.map((p) => (p.slug === r.slug ? { ...p, stock: Number(e.target.value) } : p)) })} onFocus={(e) => { e.target.dataset.before = e.target.value; }} onBlur={(e) => { if (e.target.value !== e.target.dataset.before) patch(r.slug, { stock: Number(e.target.value) }); }} />) },
            { key: 'featured', label: 'Featured', width: 90, render: (r) => <Toggle checked={Boolean(r.featured)} onChange={(v) => patch(r.slug, { featured: v })} /> },
            { key: 'published', label: 'Live', width: 120, render: (r) => <span className="adm-row"><Toggle checked={r.published !== false} onChange={(v) => patch(r.slug, { published: v })} />{busySlug === r.slug ? <span className="adm-spinner adm-spinner--dark adm-spinner--xs" /> : r.published === false ? <Pill tone="neutral">Draft</Pill> : null}</span> },
            { key: 'actions', label: '', align: 'right', render: (r) => (
              <span className="adm-row adm-row--end">
                <a href={`/products/${r.slug}`} target="_blank" rel="noreferrer" className="adm-iconbtn" title="View on storefront">↗</a>
                <button type="button" className="adm-iconbtn" title="Duplicate" onClick={() => duplicate(r.slug)}>⧉</button>
                <button type="button" className="adm-iconbtn danger" title="Delete" onClick={() => remove(r)}>🗑</button>
              </span>) },
          ]}
          empty="No products match."
        />
      </Panel>
    </>
  );
}
