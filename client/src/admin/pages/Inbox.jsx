import { useState } from 'react';
import { adminApi } from '../api';
import { useAdminData, PageHead, Panel, Table, Pill, Select, Pagination, STATUS_TONE, dateTime, useToast } from '../ui';

function List({ kind }) {
  const api = adminApi[kind];
  const [params, setParams] = useState({ page: 1, status: '' });
  const { data, loading, reload } = useAdminData(() => api.list(params), [kind, params.page, params.status]);
  const toast = useToast();
  const setStatus = async (row, status) => { try { await api.update(row.id, { status }); reload(); } catch (err) { toast(err.message, { type: 'error' }); } };
  const remove = async (row) => { if (!window.confirm('Delete this message?')) return; try { await api.remove(row.id); toast('Deleted'); reload(); } catch (err) { toast(err.message, { type: 'error' }); } };

  const columns = kind === 'enquiries' ? [
    { key: 'company', label: 'Company', render: (r) => <span><span className="adm-strong">{r.company}</span><br /><small className="adm-muted">{r.name} · <a className="adm-link" href={`mailto:${r.email}`}>{r.email}</a>{r.phone && ` · ${r.phone}`}</small></span> },
    { key: 'quantity', label: 'Qty', align: 'right' },
    { key: 'budgetPerGift', label: 'Budget / gift', align: 'right', render: (r) => (r.budgetPerGift ? `₹${Number(r.budgetPerGift).toLocaleString('en-IN')}` : '—') },
    { key: 'occasion', label: 'Occasion', render: (r) => <span>{r.occasion || '—'}{r.deliveryBy && <><br /><small className="adm-muted">by {r.deliveryBy}</small></>}{r.branding && <><br /><small className="adm-muted">wants branding</small></>}</span> },
    { key: 'message', label: 'Message', render: (r) => <span className="adm-clamp" title={r.message}>{r.message || '—'}</span> },
  ] : [
    { key: 'name', label: 'From', render: (r) => <span><span className="adm-strong">{r.name}</span><br /><small className="adm-muted"><a className="adm-link" href={`mailto:${r.email}`}>{r.email}</a></small></span> },
    { key: 'topic', label: 'Topic', render: (r) => <Pill tone="neutral">{r.topic}</Pill> },
    { key: 'message', label: 'Message', render: (r) => <span className="adm-clamp adm-clamp--wide" title={r.message}>{r.message}</span> },
  ];

  return (
    <Panel padded={false} actions={(
      <Select value={params.status} onChange={(e) => setParams({ status: e.target.value, page: 1 })} style={{ width: 170 }}>
        <option value="">All statuses</option>
        {(data?.statuses || []).map((s) => <option key={s} value={s}>{s}</option>)}
      </Select>
    )}>
      <Table
        loading={loading}
        rows={data?.items || []}
        columns={[
          ...columns,
          { key: 'status', label: 'Status', width: 150, render: (r) => <Select value={r.status} className="adm-input--sm" onChange={(e) => setStatus(r, e.target.value)}>{(data?.statuses || []).map((s) => <option key={s} value={s}>{s}</option>)}</Select> },
          { key: 'createdAt', label: 'Received', render: (r) => <small className="adm-muted">{dateTime(r.createdAt)}</small> },
          { key: 'actions', label: '', align: 'right', render: (r) => <span className="adm-row adm-row--end"><a className="adm-iconbtn" href={`mailto:${r.email}?subject=${encodeURIComponent(`Re: your message to NOORÉ`)}`} title="Reply by email">✉</a><button className="adm-iconbtn danger" onClick={() => remove(r)} title="Delete">🗑</button></span> },
        ]}
        empty={kind === 'enquiries' ? 'No corporate enquiries yet.' : 'No messages yet.'}
      />
      <Pagination page={data?.page} pages={data?.pages} onChange={(page) => setParams({ ...params, page })} />
    </Panel>
  );
}

export default function Inbox() {
  const [tab, setTab] = useState('enquiries');
  return (
    <>
      <PageHead title="Inbox" sub="Corporate gifting enquiries and contact-form messages." />
      <div className="adm-tabs">
        <button className={tab === 'enquiries' ? 'is-active' : ''} onClick={() => setTab('enquiries')}>Corporate enquiries</button>
        <button className={tab === 'contacts' ? 'is-active' : ''} onClick={() => setTab('contacts')}>Contact messages</button>
      </div>
      <List key={tab} kind={tab} />
    </>
  );
}
