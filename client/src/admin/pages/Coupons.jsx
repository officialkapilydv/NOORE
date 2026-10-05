import { useState } from 'react';
import { adminApi, issuesToErrors } from '../api';
import { useAdminData, PageHead, Panel, Table, Pill, Btn, Field, Input, Select, Toggle, Modal, money, useToast } from '../ui';

const EMPTY = { code: '', label: '', type: 'percent', value: 10, collections: [], minSubtotal: '', minItems: '', maxUses: '', expiresAt: '', active: true };
const COLS = ['essentials', 'premium', 'luxury', 'gifting'];

export default function Coupons() {
  const { data, loading, reload } = useAdminData(() => adminApi.coupons.list(), []);
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    setErrors({});
    const payload = { ...editing, value: Number(editing.value) || 0, minSubtotal: editing.minSubtotal === '' ? null : Number(editing.minSubtotal), minItems: editing.minItems === '' ? null : Number(editing.minItems), maxUses: editing.maxUses === '' ? null : Number(editing.maxUses), expiresAt: editing.expiresAt || null, collections: editing.collections?.length ? editing.collections : undefined };
    delete payload.usageCount; delete payload.createdAt; delete payload.updatedAt; delete payload._original;
    try {
      if (editing._original) await adminApi.coupons.update(editing._original, payload);
      else await adminApi.coupons.create(payload);
      toast('Coupon saved', { type: 'success' });
      setEditing(null);
      reload();
    } catch (err) {
      setErrors(issuesToErrors(err));
      toast(err.message, { type: 'error' });
    } finally { setSaving(false); }
  };
  const remove = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    try { await adminApi.coupons.remove(c.code); toast('Coupon deleted'); reload(); } catch (err) { toast(err.message, { type: 'error' }); }
  };
  const toggle = async (c) => {
    try { await adminApi.coupons.update(c.code, { ...c, active: !c.active }); reload(); } catch (err) { toast(err.message, { type: 'error' }); }
  };

  return (
    <>
      <PageHead title="Coupons" sub="Discount codes customers can enter at checkout."><Btn onClick={() => setEditing({ ...EMPTY })}>+ New coupon</Btn></PageHead>
      <Panel padded={false}>
        <Table
          loading={loading}
          rows={data?.items || []}
          rowKey={(r) => r.code}
          columns={[
            { key: 'code', label: 'Code', render: (r) => <span className="adm-code">{r.code}</span> },
            { key: 'label', label: 'Label' },
            { key: 'type', label: 'Discount', render: (r) => (r.type === 'percent' ? `${r.value}% off` : r.type === 'flat' ? `${money(r.value)} off` : 'Free shipping') },
            { key: 'rules', label: 'Rules', render: (r) => <small className="adm-muted">{[r.collections?.length && `Only ${r.collections.join(', ')}`, r.minSubtotal && `Min ${money(r.minSubtotal)}`, r.minItems && `Min ${r.minItems} items`, r.maxUses && `Max ${r.maxUses} uses`, r.expiresAt && `Expires ${new Date(r.expiresAt).toLocaleDateString('en-IN')}`].filter(Boolean).join(' · ') || '—'}</small> },
            { key: 'usageCount', label: 'Used', align: 'right' },
            { key: 'active', label: 'Active', render: (r) => <Toggle checked={r.active !== false} onChange={() => toggle(r)} /> },
            { key: 'actions', label: '', align: 'right', render: (r) => <span className="adm-row adm-row--end"><button className="adm-iconbtn" onClick={() => setEditing({ ...EMPTY, ...r, collections: r.collections || [], minSubtotal: r.minSubtotal ?? '', minItems: r.minItems ?? '', maxUses: r.maxUses ?? '', expiresAt: r.expiresAt ? r.expiresAt.slice(0, 10) : '', _original: r.code })} title="Edit">✎</button><button className="adm-iconbtn danger" onClick={() => remove(r)} title="Delete">🗑</button></span> },
          ]}
        />
      </Panel>
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?._original ? `Edit ${editing._original}` : 'New coupon'} footer={<><Btn variant="ghost" onClick={() => setEditing(null)}>Cancel</Btn><Btn onClick={save} loading={saving}>Save coupon</Btn></>}>
        {editing && (
          <div className="adm-form-grid">
            <Field label="Code" error={errors.code}><Input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder="DIWALI20" /></Field>
            <Field label="Label (shown to customer)" error={errors.label}><Input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="20% off for Diwali" /></Field>
            <Field label="Type"><Select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}><option value="percent">Percentage off</option><option value="flat">Flat amount off (₹)</option><option value="shipping">Free shipping</option></Select></Field>
            <Field label={editing.type === 'percent' ? 'Percent' : 'Amount (₹)'} error={errors.value}><Input type="number" min={0} value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} disabled={editing.type === 'shipping'} /></Field>
            <Field label="Minimum subtotal (₹)" hint="Optional"><Input type="number" min={0} value={editing.minSubtotal} onChange={(e) => setEditing({ ...editing, minSubtotal: e.target.value })} /></Field>
            <Field label="Minimum items" hint="Optional"><Input type="number" min={0} value={editing.minItems} onChange={(e) => setEditing({ ...editing, minItems: e.target.value })} /></Field>
            <Field label="Maximum uses" hint="Optional"><Input type="number" min={0} value={editing.maxUses} onChange={(e) => setEditing({ ...editing, maxUses: e.target.value })} /></Field>
            <Field label="Expires on" hint="Optional"><Input type="date" value={editing.expiresAt} onChange={(e) => setEditing({ ...editing, expiresAt: e.target.value })} /></Field>
            <Field label="Only for collections" hint="Leave all unselected to apply to everything" className="span-2">
              <span className="adm-chips">{COLS.map((c) => <button type="button" key={c} className={`adm-chip ${editing.collections.includes(c) ? 'is-on' : ''}`} onClick={() => setEditing({ ...editing, collections: editing.collections.includes(c) ? editing.collections.filter((x) => x !== c) : [...editing.collections, c] })}>{c}</button>)}</span>
            </Field>
            <div className="span-2"><Toggle checked={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} label="Active" /></div>
          </div>
        )}
      </Modal>
    </>
  );
}
