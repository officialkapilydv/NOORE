import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api';
import { useAdminData, PageHead, Panel, Table, Toggle, Pagination, dateTime, useToast } from '../ui';
import { Stars } from '@/components/ui/Primitives';

export default function Reviews() {
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useAdminData(() => adminApi.reviews.list({ page }), [page]);
  const toast = useToast();
  const update = async (r, patch) => { try { await adminApi.reviews.update(r.id, patch); reload(); } catch (err) { toast(err.message, { type: 'error' }); } };
  const remove = async (r) => { if (!window.confirm('Delete this review?')) return; try { await adminApi.reviews.remove(r.id); toast('Review deleted'); reload(); } catch (err) { toast(err.message, { type: 'error' }); } };

  return (
    <>
      <PageHead title="Reviews" sub="Customer reviews submitted on product pages. Hidden reviews stay in the database but never display." />
      <Panel padded={false}>
        <Table
          loading={loading}
          rows={data?.items || []}
          columns={[
            { key: 'productSlug', label: 'Product', render: (r) => <Link className="adm-link" to={`/admin/products/${r.productSlug}`}>{r.productSlug}</Link> },
            { key: 'rating', label: 'Rating', render: (r) => <span className="adm-gold"><Stars value={r.rating} size={12} /></span> },
            { key: 'title', label: 'Review', render: (r) => <span><span className="adm-strong">{r.title}</span><br /><small className="adm-muted adm-clamp adm-clamp--wide" title={r.body}>{r.body}</small></span> },
            { key: 'name', label: 'By' },
            { key: 'approved', label: 'Visible', render: (r) => <Toggle checked={r.approved !== false} onChange={(v) => update(r, { approved: v })} /> },
            { key: 'verified', label: 'Verified', render: (r) => <Toggle checked={Boolean(r.verified)} onChange={(v) => update(r, { verified: v })} /> },
            { key: 'createdAt', label: 'Posted', render: (r) => <small className="adm-muted">{dateTime(r.createdAt)}</small> },
            { key: 'actions', label: '', align: 'right', render: (r) => <button className="adm-iconbtn danger" onClick={() => remove(r)} title="Delete">🗑</button> },
          ]}
          empty="No reviews yet."
        />
        <Pagination page={data?.page} pages={data?.pages} onChange={setPage} />
      </Panel>
    </>
  );
}
