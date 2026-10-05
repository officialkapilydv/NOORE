import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi, issuesToErrors } from '../api';
import { useAdminData, PageHead, Panel, Btn, Field, Input, Textarea, Select, Toggle, ColorField, TagInput, ImagePicker, useToast } from '../ui';
import { CandleThumb } from '@/components/shop/CandleThumb';
import { FAMILY_LABEL, slugify } from '@/lib/format';

const ProductViewer = lazy(() => import('@/components/three/ProductViewer').then((m) => ({ default: m.ProductViewer })));

const VESSEL_TYPES = [['glass', 'Glass (clear, tinted)'], ['tinted', 'Tinted glass (pastel, semi-opaque)'], ['porcelain', 'Porcelain / glossy ceramic'], ['stone', 'Speckled stoneware'], ['marble', 'Marble (with veins)'], ['matte', 'Matte / black glass']];
const BADGES = ['Bestseller', 'New', 'Signature', 'Limited', 'Gift'];

const EMPTY = {
  name: '', slug: '', collection: 'essentials', family: 'floral', kind: 'single', includes: [],
  tagline: '', description: '', story: '',
  notes: { top: [], heart: [], base: [] }, moods: [], rooms: [], badges: [],
  price: 899, sizes: [{ id: 'classic', label: 'Classic', weight: '200 g', burnTime: '42–45 h', price: 899 }],
  stock: 20, rating: 5, reviewCount: 0, featured: false, published: true, image: '', gallery: [],
  vessel: { type: 'glass', color: '#d98a3a', wax: '#f4dfb7', lid: 'gold', labelBg: '#f6ead3', labelText: '#4a2a10', accent: '#d9b162', glow: '#ffb15c', veins: '#c9a24a' },
};

export default function ProductEditor() {
  const { slug } = useParams();
  const isNew = !slug;
  const navigate = useNavigate();
  const toast = useToast();
  const { data: existing, loading, error } = useAdminData(() => (isNew ? Promise.resolve(null) : adminApi.products.get(slug)), [slug]);
  const { data: lists } = useAdminData(() => adminApi.products.list(), []);
  const [draft, setDraft] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [show3d, setShow3d] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (existing) setDraft({ ...EMPTY, ...existing, vessel: { ...EMPTY.vessel, ...existing.vessel }, notes: { ...EMPTY.notes, ...existing.notes } });
    if (isNew) setDraft(EMPTY);
    setDirty(false);
  }, [existing, isNew]);

  const set = (patch) => { setDraft((d) => ({ ...d, ...patch })); setDirty(true); };
  const setVessel = (patch) => set({ vessel: { ...draft.vessel, ...patch } });
  const setNotes = (k, v) => set({ notes: { ...draft.notes, [k]: v } });
  const setSize = (i, patch) => set({ sizes: draft.sizes.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  const previewProduct = useMemo(() => ({ ...draft, name: draft.name || 'New candle', notes: draft.notes, includesProducts: [] }), [draft]);
  const otherProducts = (lists?.items || []).filter((p) => p.kind !== 'set' && p.slug !== slug);

  const save = async (andClose = false) => {
    setSaving(true);
    setErrors({});
    try {
      const payload = { ...draft, slug: draft.slug ? slugify(draft.slug) : undefined, price: Number(draft.price) || Number(draft.sizes[0]?.price) || 0, sizes: draft.sizes.map((s) => ({ ...s, price: Number(s.price) })), kind: draft.collection === 'gifting' ? 'set' : 'single' };
      delete payload.includesProducts; delete payload.reviews; delete payload.related; delete payload.specs; delete payload.collectionMeta;
      const saved = isNew ? await adminApi.products.create(payload) : await adminApi.products.update(slug, payload);
      toast(isNew ? `"${saved.name}" created` : 'Saved', { type: 'success' });
      setDirty(false);
      if (andClose) navigate('/admin/products');
      else if (isNew || saved.slug !== slug) navigate(`/admin/products/${saved.slug}`, { replace: true });
    } catch (err) {
      const e = issuesToErrors(err);
      setErrors(e);
      toast(Object.values(e)[0] || err.message, { type: 'error', duration: 5000 });
    } finally {
      setSaving(false);
    }
  };

  if (error) return <div className="adm-empty">{error.message} — <Link to="/admin/products" className="adm-link">back to products</Link></div>;
  if (!isNew && loading && !existing) return <div className="adm-loading"><span className="adm-spinner adm-spinner--dark" /></div>;

  return (
    <>
      <PageHead title={isNew ? 'New product' : draft.name} sub={isNew ? 'Fill in the essentials, choose a vessel, and publish when ready.' : <>/{draft.slug} · {draft.published ? 'Live on the storefront' : 'Draft (hidden)'} {dirty && <em className="adm-dirty">· unsaved changes</em>}</>}>
        {!isNew && <a href={`/products/${draft.slug}`} target="_blank" rel="noreferrer" className="adm-btn adm-btn--ghost adm-btn--md">View ↗</a>}
        <Btn variant="ghost" onClick={() => navigate('/admin/products')}>Cancel</Btn>
        <Btn onClick={() => save(false)} loading={saving}>{isNew ? 'Create product' : 'Save'}</Btn>
      </PageHead>

      <div className="adm-editor">
        <div className="adm-editor__main">
          <Panel title="Basics">
            <div className="adm-form-grid">
              <Field label="Name" error={errors.name} className="span-2"><Input value={draft.name} onChange={(e) => set({ name: e.target.value, slug: isNew && !draft.slug ? '' : draft.slug })} placeholder="Amber & Saffron" /></Field>
              <Field label="URL slug" hint="Leave blank to generate from the name" error={errors.slug}><Input value={draft.slug || ''} onChange={(e) => set({ slug: e.target.value })} placeholder={slugify(draft.name || 'amber-and-saffron')} /></Field>
              <Field label="Collection" error={errors.collection}>
                <Select value={draft.collection} onChange={(e) => set({ collection: e.target.value })}>
                  {(lists?.collections || [{ slug: 'essentials', name: 'Essentials' }, { slug: 'premium', name: 'Premium' }, { slug: 'luxury', name: 'Luxury' }, { slug: 'gifting', name: 'Gifting' }]).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Fragrance family" error={errors.family}>
                <Select value={draft.family} onChange={(e) => set({ family: e.target.value })}>
                  {Object.entries(FAMILY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
              <Field label="Tagline" hint="One line shown on cards" error={errors.tagline} className="span-2"><Input value={draft.tagline} onChange={(e) => set({ tagline: e.target.value })} maxLength={160} /></Field>
              <Field label="Description" error={errors.description} className="span-2"><Textarea rows={4} value={draft.description} onChange={(e) => set({ description: e.target.value })} /></Field>
              <Field label="The story" hint="Shown in the story band on the product page" error={errors.story} className="span-2"><Textarea rows={3} value={draft.story} onChange={(e) => set({ story: e.target.value })} /></Field>
              <Field label="Badges" className="span-2">
                <span className="adm-chips">
                  {BADGES.map((b) => <button type="button" key={b} className={`adm-chip ${draft.badges.includes(b) ? 'is-on' : ''}`} onClick={() => set({ badges: draft.badges.includes(b) ? draft.badges.filter((x) => x !== b) : [...draft.badges, b] })}>{b}</button>)}
                </span>
              </Field>
              <TagInput label="Moods" value={draft.moods} onChange={(v) => set({ moods: v })} placeholder="Cosy, Romantic…" />
              <TagInput label="Best in rooms" value={draft.rooms} onChange={(v) => set({ rooms: v })} placeholder="Living room, Bedroom…" />
            </div>
          </Panel>

          {draft.collection === 'gifting' && (
            <Panel title="Gift set contents" sub="Choose the candles inside this box — they render together in the 3D viewer.">
              <div className="adm-picklist">
                {otherProducts.map((p) => {
                  const on = (draft.includes || []).includes(p.slug);
                  return (
                    <button type="button" key={p.slug} className={`adm-pick ${on ? 'is-on' : ''}`} onClick={() => set({ includes: on ? draft.includes.filter((s) => s !== p.slug) : [...(draft.includes || []), p.slug] })}>
                      <CandleThumb vessel={p.vessel} size={36} lit={false} /><span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </Panel>
          )}

          <Panel title="Fragrance notes">
            <div className="adm-form-grid">
              <TagInput label="Top notes" value={draft.notes.top} onChange={(v) => setNotes('top', v)} placeholder="Saffron, Pink pepper" />
              <TagInput label="Heart notes" value={draft.notes.heart} onChange={(v) => setNotes('heart', v)} placeholder="Honeyed amber, Rose" />
              <TagInput label="Base notes" value={draft.notes.base} onChange={(v) => setNotes('base', v)} placeholder="Labdanum, Benzoin" className="span-2" />
            </div>
          </Panel>

          <Panel title="Pricing, sizes & stock">
            <div className="adm-form-grid">
              <Field label="Display price (₹)" hint="The 'from' price on cards; usually the Classic size" error={errors.price}><Input type="number" min={0} value={draft.price} onChange={(e) => set({ price: e.target.value })} /></Field>
              <Field label="Stock on hand" error={errors.stock}><Input type="number" min={0} value={draft.stock} onChange={(e) => set({ stock: e.target.value })} /></Field>
              <Field label="Rating (0–5)" error={errors.rating}><Input type="number" min={0} max={5} step={0.1} value={draft.rating} onChange={(e) => set({ rating: e.target.value })} /></Field>
              <Field label="Review count" error={errors.reviewCount}><Input type="number" min={0} value={draft.reviewCount} onChange={(e) => set({ reviewCount: e.target.value })} /></Field>
            </div>
            <div className="adm-sizes">
              <div className="adm-sizes__head"><span>ID</span><span>Label</span><span>Weight</span><span>Burn time</span><span>Price (₹)</span><span /></div>
              {draft.sizes.map((s, i) => (
                <div className="adm-sizes__row" key={i}>
                  <Input value={s.id} onChange={(e) => setSize(i, { id: slugify(e.target.value) })} placeholder="classic" />
                  <Input value={s.label} onChange={(e) => setSize(i, { label: e.target.value })} placeholder="Classic" />
                  <Input value={s.weight} onChange={(e) => setSize(i, { weight: e.target.value })} placeholder="200 g" />
                  <Input value={s.burnTime} onChange={(e) => setSize(i, { burnTime: e.target.value })} placeholder="42–45 h" />
                  <Input type="number" min={0} value={s.price} onChange={(e) => setSize(i, { price: e.target.value })} />
                  <button type="button" className="adm-iconbtn danger" onClick={() => set({ sizes: draft.sizes.filter((_, j) => j !== i) })} disabled={draft.sizes.length === 1} aria-label="Remove size">×</button>
                </div>
              ))}
              {errors.sizes && <p className="adm-field__error">{errors.sizes}</p>}
              <Btn type="button" variant="ghost" size="sm" onClick={() => set({ sizes: [...draft.sizes, { id: `size-${draft.sizes.length + 1}`, label: '', weight: '', burnTime: '', price: draft.price }] })}>+ Add size</Btn>
            </div>
          </Panel>

          <Panel title="Vessel & 3D appearance" sub="These colours drive the 3D render, the card illustration and the label.">
            <div className="adm-form-grid">
              <Field label="Vessel material" error={errors['vessel.type']}>
                <Select value={draft.vessel.type} onChange={(e) => setVessel({ type: e.target.value })}>
                  {VESSEL_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </Field>
              <Field label="Lid" error={errors['vessel.lid']}>
                <Select value={draft.vessel.lid} onChange={(e) => setVessel({ lid: e.target.value })}>
                  <option value="none">No lid</option><option value="gold">Brass / gold lid</option><option value="wood">Wooden lid</option>
                </Select>
              </Field>
              <ColorField label="Vessel colour" value={draft.vessel.color} onChange={(v) => setVessel({ color: v })} error={errors['vessel.color']} />
              <ColorField label="Wax colour" value={draft.vessel.wax} onChange={(v) => setVessel({ wax: v })} error={errors['vessel.wax']} />
              {draft.vessel.type === 'marble' && <ColorField label="Vein colour" value={draft.vessel.veins} onChange={(v) => setVessel({ veins: v })} error={errors['vessel.veins']} />}
              <ColorField label="Flame glow" value={draft.vessel.glow} onChange={(v) => setVessel({ glow: v })} error={errors['vessel.glow']} />
              <ColorField label="Label background" value={draft.vessel.labelBg} onChange={(v) => setVessel({ labelBg: v })} error={errors['vessel.labelBg']} />
              <ColorField label="Label text" value={draft.vessel.labelText} onChange={(v) => setVessel({ labelText: v })} error={errors['vessel.labelText']} />
              <ColorField label="Accent (border, mark)" value={draft.vessel.accent} onChange={(v) => setVessel({ accent: v })} error={errors['vessel.accent']} />
            </div>
          </Panel>

          <Panel title="Photography">
            <ImagePicker label="Main photograph" value={draft.image} onChange={(v) => set({ image: v })} hint="Shown behind the card on hover, in the photo toggle and the story band" error={errors.image} />
          </Panel>
        </div>

        <aside className="adm-editor__side">
          <Panel title="Status">
            <div className="adm-stack">
              <Toggle checked={draft.published} onChange={(v) => set({ published: v })} label={draft.published ? 'Published — visible in the shop' : 'Draft — hidden from customers'} />
              <Toggle checked={draft.featured} onChange={(v) => set({ featured: v })} label="Featured on the homepage carousel" />
            </div>
          </Panel>
          <Panel title="Live preview" sub="Updates as you edit" actions={<Btn type="button" variant="ghost" size="sm" onClick={() => setShow3d((s) => !s)}>{show3d ? 'Illustration' : 'Preview in 3D'}</Btn>}>
            <div className={`adm-preview ${show3d ? 'adm-preview--3d' : ''}`}>
              {show3d ? (
                <Suspense fallback={<span className="adm-spinner adm-spinner--dark" />}>
                  <ProductViewer product={previewProduct} lit lidOpen hotspots={false} />
                </Suspense>
              ) : (
                <CandleThumb vessel={draft.vessel} size={170} lit />
              )}
            </div>
            <p className="adm-preview__name">{draft.name || 'New candle'}</p>
            <p className="adm-muted adm-small">{draft.tagline || 'Tagline appears here'}</p>
          </Panel>
          <Panel title="Save">
            <div className="adm-stack">
              <Btn onClick={() => save(false)} loading={saving}>{isNew ? 'Create product' : 'Save changes'}</Btn>
              <Btn variant="ghost" onClick={() => save(true)} loading={saving}>Save & close</Btn>
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}
