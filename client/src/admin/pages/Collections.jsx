import { useEffect, useState } from 'react';
import { adminApi, issuesToErrors } from '../api';
import { useAdminData, PageHead, Panel, Btn, Field, Input, Textarea, Select, ColorField, ImagePicker, useToast } from '../ui';

function CollectionForm({ col, onSaved }) {
  const toast = useToast();
  const [draft, setDraft] = useState(col);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(col), [col]);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const specs = Object.entries(draft.specs || {});

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const { count, ...payload } = draft;
      const saved = await adminApi.collections.update(col.slug, payload);
      toast(`${saved.name} saved`, { type: 'success' });
      onSaved(saved);
    } catch (err) {
      setErrors(issuesToErrors(err));
      toast(err.message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title={col.name} sub={`/collections/${col.slug} · ${col.count} products`} actions={<Btn size="sm" onClick={save} loading={saving}>Save</Btn>}>
      <div className="adm-form-grid">
        <Field label="Name" error={errors.name}><Input value={draft.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Headline" error={errors.title}><Input value={draft.title} onChange={(e) => set({ title: e.target.value })} /></Field>
        <Field label="Description" className="span-2" error={errors.description}><Textarea rows={3} value={draft.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        <Field label="Tone"><Select value={draft.tone} onChange={(e) => set({ tone: e.target.value })}><option value="light">Light</option><option value="amber">Amber</option><option value="dark">Dark</option></Select></Field>
        <Field label="'From' price (₹)" error={errors.from}><Input type="number" value={draft.from} onChange={(e) => set({ from: e.target.value })} /></Field>
        <ColorField label="Card colour" value={draft.color} onChange={(v) => set({ color: v })} error={errors.color} />
        <ColorField label="Accent colour" value={draft.accent} onChange={(v) => set({ accent: v })} error={errors.accent} />
        <ImagePicker label="Banner image" value={draft.image} onChange={(v) => set({ image: v })} />
        <div className="adm-field span-2">
          <span className="adm-field__label">Specifications (shown on the collection page & product details)</span>
          <div className="adm-kv">
            {specs.map(([k, v], i) => (
              <div key={i} className="adm-kv__row">
                <Input value={k} placeholder="wax" onChange={(e) => { const next = specs.map(([kk, vv], j) => (j === i ? [e.target.value, vv] : [kk, vv])); set({ specs: Object.fromEntries(next) }); }} />
                <Input value={v} placeholder="Soy–coconut blend" onChange={(e) => { const next = specs.map(([kk, vv], j) => (j === i ? [kk, e.target.value] : [kk, vv])); set({ specs: Object.fromEntries(next) }); }} />
                <button type="button" className="adm-iconbtn danger" onClick={() => set({ specs: Object.fromEntries(specs.filter((_, j) => j !== i)) })} aria-label="Remove">×</button>
              </div>
            ))}
            <Btn type="button" variant="ghost" size="sm" onClick={() => set({ specs: { ...draft.specs, [`detail-${specs.length + 1}`]: '' } })}>+ Add specification</Btn>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default function Collections() {
  const { data, loading, setData } = useAdminData(() => adminApi.collections.list(), []);
  if (loading && !data) return <div className="adm-loading"><span className="adm-spinner adm-spinner--dark" /></div>;
  return (
    <>
      <PageHead title="Collections" sub="Names, headlines, colours and specifications for Essentials, Premium, Luxury and Gifting." />
      {(data?.items || []).map((c) => (
        <CollectionForm key={c.slug} col={c} onSaved={(saved) => setData({ items: data.items.map((x) => (x.slug === saved.slug ? { ...x, ...saved } : x)) })} />
      ))}
    </>
  );
}
