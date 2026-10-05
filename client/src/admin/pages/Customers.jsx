import { useState } from 'react';
import { adminApi, adminToken } from '../api';
import { useAdminData, PageHead, Panel, Table, Btn, Pagination, money, dateTime, useToast } from '../ui';

function CustomersList() {
  const [page, setPage] = useState(1);
  const { data, loading } = useAdminData(() => adminApi.customers.list({ page }), [page]);
  return (
    <Panel padded={false}>
      <Table loading={loading} rows={data?.items || []} columns={[
        { key: 'name', label: 'Customer', render: (r) => <span><span className="adm-strong">{r.name}</span><br /><small className="adm-muted"><a className="adm-link" href={`mailto:${r.email}`}>{r.email}</a></small></span> },
        { key: 'orders', label: 'Orders', align: 'right' },
        { key: 'spent', label: 'Spent', align: 'right', render: (r) => money(r.spent) },
        { key: 'lastOrderAt', label: 'Last order', render: (r) => <small className="adm-muted">{dateTime(r.lastOrderAt)}</small> },
        { key: 'createdAt', label: 'Joined', render: (r) => <small className="adm-muted">{dateTime(r.createdAt)}</small> },
      ]} empty="No customer accounts yet. Guest checkouts appear under Orders." />
      <Pagination page={data?.page} pages={data?.pages} onChange={setPage} />
    </Panel>
  );
}

function Subscribers() {
  const [page, setPage] = useState(1);
  const { data, loading, reload } = useAdminData(() => adminApi.subscribers.list({ page }), [page]);
  const toast = useToast();
  const remove = async (s) => { if (!window.confirm(`Remove ${s.email}?`)) return; try { await adminApi.subscribers.remove(s.id); toast('Removed'); reload(); } catch (err) { toast(err.message, { type: 'error' }); } };
  const exportCsv = async () => {
    try {
      const res = await fetch(`${(import.meta.env.VITE_API_URL || '')}/api/admin/subscribers?format=csv`, { headers: { Authorization: `Bearer ${adminToken.get()}` } });
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'noore-subscribers.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) { toast(err.message, { type: 'error' }); }
  };
  return (
    <Panel padded={false} actions={<Btn variant="ghost" size="sm" onClick={exportCsv}>Export CSV</Btn>}>
      <Table loading={loading} rows={data?.items || []} columns={[
        { key: 'email', label: 'Email' },
        { key: 'source', label: 'Source' },
        { key: 'createdAt', label: 'Subscribed', render: (r) => <small className="adm-muted">{dateTime(r.createdAt)}</small> },
        { key: 'actions', label: '', align: 'right', render: (r) => <button className="adm-iconbtn danger" onClick={() => remove(r)} title="Remove">🗑</button> },
      ]} empty="No subscribers yet." />
      <Pagination page={data?.page} pages={data?.pages} onChange={setPage} />
    </Panel>
  );
}

export default function Customers() {
  const [tab, setTab] = useState('customers');
  return (
    <>
      <PageHead title="Customers" sub="Account holders and newsletter subscribers." />
      <div className="adm-tabs">
        <button className={tab === 'customers' ? 'is-active' : ''} onClick={() => setTab('customers')}>Accounts</button>
        <button className={tab === 'subscribers' ? 'is-active' : ''} onClick={() => setTab('subscribers')}>Newsletter</button>
      </div>
      {tab === 'customers' ? <CustomersList /> : <Subscribers />}
    </>
  );
}
