import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi, issuesToErrors } from '../api';
import { useAdminAuth } from '../store';
import { useAdminData, PageHead, Panel, Btn, Field, Input, Textarea, Toggle, TagInput, Table, Modal, dateTime, useToast } from '../ui';

const TABS = [
  ['brand', 'Brand & SEO'],
  ['contact', 'Contact & address'],
  ['social', 'Social links'],
  ['shipping', 'Shipping & fees'],
  ['home', 'Homepage & announcement'],
  ['faq', 'FAQ'],
  ['legal', 'Legal'],
  ['admins', 'Administrators'],
];

export default function Settings() {
  const { tab = 'brand' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, setData } = useAdminData(() => adminApi.settings.get(), []);
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setDraft(data); }, [data]);

  const set = (section, patch) => setDraft((d) => ({ ...d, [section]: { ...d[section], ...patch } }));
  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const { id, createdAt, updatedAt, ...payload } = draft;
      const saved = await adminApi.settings.update(payload);
      setData(saved);
      toast('Settings saved — the storefront updates on next load.', { type: 'success' });
    } catch (err) {
      setErrors(issuesToErrors(err));
      toast(err.message, { type: 'error', duration: 5000 });
    } finally { setSaving(false); }
  };
  const reset = async () => {
    if (!window.confirm('Reset ALL settings to the shipped defaults? Pages and products are not affected.')) return;
    try { const s = await adminApi.settings.reset(); setData(s); toast('Settings reset'); } catch (err) { toast(err.message, { type: 'error' }); }
  };

  if (loading && !draft) return <div className="adm-loading"><span className="adm-spinner adm-spinner--dark" /></div>;
  if (!draft) return null;
  const E = (p) => errors[p];

  return (
    <>
      <PageHead title="Settings" sub="Everything about the brand that is not a product: contact details, address, social links, fees, homepage copy, FAQ and legal.">
        {tab !== 'admins' && <><Btn variant="ghost" onClick={reset}>Reset defaults</Btn><Btn onClick={save} loading={saving}>Save settings</Btn></>}
      </PageHead>
      <div className="adm-tabs adm-tabs--wrap">
        {TABS.map(([k, l]) => <button key={k} className={tab === k ? 'is-active' : ''} onClick={() => navigate(`/admin/settings/${k}`)}>{l}</button>)}
      </div>

      {tab === 'brand' && (
        <Panel title="Brand & SEO">
          <div className="adm-form-grid">
            <Field label="Brand name" error={E('brand.name')}><Input value={draft.brand.name} onChange={(e) => set('brand', { name: e.target.value })} /></Field>
            <Field label="Tagline" error={E('brand.tagline')}><Input value={draft.brand.tagline} onChange={(e) => set('brand', { tagline: e.target.value })} /></Field>
            <Field label="Short description" hint="Footer and meta description fallback" className="span-2" error={E('brand.description')}><Textarea rows={3} value={draft.brand.description} onChange={(e) => set('brand', { description: e.target.value })} /></Field>
            <Field label="SEO title" error={E('seo.title')}><Input value={draft.seo.title} onChange={(e) => set('seo', { title: e.target.value })} /></Field>
            <Field label="SEO description" error={E('seo.description')}><Input value={draft.seo.description} onChange={(e) => set('seo', { description: e.target.value })} maxLength={200} /></Field>
          </div>
        </Panel>
      )}

      {tab === 'contact' && (
        <>
          <Panel title="Contact details" sub="Shown in the footer, the contact page and order emails.">
            <div className="adm-form-grid">
              <Field label="Email" error={E('contact.email')}><Input type="email" value={draft.contact.email} onChange={(e) => set('contact', { email: e.target.value })} /></Field>
              <Field label="Phone" error={E('contact.phone')}><Input value={draft.contact.phone} onChange={(e) => set('contact', { phone: e.target.value })} /></Field>
              <Field label="WhatsApp number" error={E('contact.whatsapp')}><Input value={draft.contact.whatsapp} onChange={(e) => set('contact', { whatsapp: e.target.value })} /></Field>
              <Field label="Hours" error={E('contact.hours')}><Input value={draft.contact.hours} onChange={(e) => set('contact', { hours: e.target.value })} /></Field>
              <Field label="Support promise" hint="e.g. 'A real person replies within one working day.'" className="span-2" error={E('contact.supportNote')}><Input value={draft.contact.supportNote} onChange={(e) => set('contact', { supportNote: e.target.value })} /></Field>
            </div>
          </Panel>
          <Panel title="Address">
            <div className="adm-form-grid">
              <Field label="Label" hint="e.g. 'The studio' or 'Head office'" error={E('address.label')}><Input value={draft.address.label} onChange={(e) => set('address', { label: e.target.value })} /></Field>
              <Field label="Line 1" error={E('address.line1')}><Input value={draft.address.line1} onChange={(e) => set('address', { line1: e.target.value })} /></Field>
              <Field label="Line 2" error={E('address.line2')}><Input value={draft.address.line2} onChange={(e) => set('address', { line2: e.target.value })} /></Field>
              <Field label="City" error={E('address.city')}><Input value={draft.address.city} onChange={(e) => set('address', { city: e.target.value })} /></Field>
              <Field label="State" error={E('address.state')}><Input value={draft.address.state} onChange={(e) => set('address', { state: e.target.value })} /></Field>
              <Field label="PIN code" error={E('address.postalCode')}><Input value={draft.address.postalCode} onChange={(e) => set('address', { postalCode: e.target.value })} /></Field>
              <Field label="Country" error={E('address.country')}><Input value={draft.address.country} onChange={(e) => set('address', { country: e.target.value })} /></Field>
              <Field label="Google Maps link" hint="Optional — otherwise we search the address" error={E('address.mapUrl')}><Input value={draft.address.mapUrl} onChange={(e) => set('address', { mapUrl: e.target.value })} placeholder="https://maps.app.goo.gl/…" /></Field>
              <Field label="Note" hint="e.g. 'Visits by appointment'" className="span-2" error={E('address.note')}><Input value={draft.address.note} onChange={(e) => set('address', { note: e.target.value })} /></Field>
            </div>
          </Panel>
        </>
      )}

      {tab === 'social' && (
        <Panel title="Social links" sub="Leave a field blank to hide that network from the footer.">
          <div className="adm-form-grid">
            {[['instagram', 'Instagram'], ['facebook', 'Facebook'], ['pinterest', 'Pinterest'], ['youtube', 'YouTube'], ['x', 'X (Twitter)'], ['whatsapp', 'WhatsApp link']].map(([k, l]) => (
              <Field key={k} label={l} error={E(`social.${k}`)}><Input value={draft.social[k] || ''} onChange={(e) => set('social', { [k]: e.target.value })} placeholder="https://…" /></Field>
            ))}
          </div>
        </Panel>
      )}

      {tab === 'shipping' && (
        <Panel title="Shipping & fees" sub="These drive cart pricing on the server as well as the copy on product pages.">
          <div className="adm-form-grid">
            <Field label="Free shipping over (₹)" error={E('shipping.freeOver')}><Input type="number" min={0} value={draft.shipping.freeOver} onChange={(e) => set('shipping', { freeOver: e.target.value })} /></Field>
            <Field label="Flat shipping fee (₹)" error={E('shipping.flat')}><Input type="number" min={0} value={draft.shipping.flat} onChange={(e) => set('shipping', { flat: e.target.value })} /></Field>
            <Field label="Gift wrap fee (₹)" error={E('shipping.giftWrap')}><Input type="number" min={0} value={draft.shipping.giftWrap} onChange={(e) => set('shipping', { giftWrap: e.target.value })} /></Field>
            <Field label="Dispatch within (working days)" error={E('shipping.dispatchDays')}><Input type="number" min={0} value={draft.shipping.dispatchDays} onChange={(e) => set('shipping', { dispatchDays: e.target.value })} /></Field>
            <Field label="Delivery window (days)" hint="Free text, e.g. 3–6" error={E('shipping.deliveryDays')}><Input value={draft.shipping.deliveryDays} onChange={(e) => set('shipping', { deliveryDays: e.target.value })} /></Field>
            <Field label="Returns window (days)" error={E('shipping.returnsDays')}><Input type="number" min={0} value={draft.shipping.returnsDays} onChange={(e) => set('shipping', { returnsDays: e.target.value })} /></Field>
          </div>
        </Panel>
      )}

      {tab === 'home' && (
        <>
          <Panel title="Announcement bar" sub="A slim gold strip above the navigation.">
            <div className="adm-form-grid">
              <div className="span-2"><Toggle checked={Boolean(draft.announcement.enabled)} onChange={(v) => set('announcement', { enabled: v })} label={draft.announcement.enabled ? 'Showing' : 'Hidden'} /></div>
              <Field label="Text" error={E('announcement.text')}><Input value={draft.announcement.text} onChange={(e) => set('announcement', { text: e.target.value })} maxLength={160} /></Field>
              <Field label="Link (optional)" error={E('announcement.link')}><Input value={draft.announcement.link} onChange={(e) => set('announcement', { link: e.target.value })} placeholder="/shop" /></Field>
            </div>
          </Panel>
          <Panel title="Homepage hero copy">
            <div className="adm-form-grid">
              <Field label="Eyebrow" error={E('home.eyebrow')}><Input value={draft.home.eyebrow} onChange={(e) => set('home', { eyebrow: e.target.value })} /></Field>
              <div />
              <Field label="Headline (first line)" error={E('home.title')}><Input value={draft.home.title} onChange={(e) => set('home', { title: e.target.value })} /></Field>
              <Field label="Headline (italic gold line)" error={E('home.titleItalic')}><Input value={draft.home.titleItalic} onChange={(e) => set('home', { titleItalic: e.target.value })} /></Field>
              <Field label="Lead paragraph" className="span-2" error={E('home.lead')}><Textarea rows={3} value={draft.home.lead} onChange={(e) => set('home', { lead: e.target.value })} /></Field>
              <Field label="Primary button" error={E('home.primaryCta')}><Input value={draft.home.primaryCta} onChange={(e) => set('home', { primaryCta: e.target.value })} /></Field>
              <Field label="Secondary button" error={E('home.secondaryCta')}><Input value={draft.home.secondaryCta} onChange={(e) => set('home', { secondaryCta: e.target.value })} /></Field>
              <TagInput label="Marquee strip phrases" value={draft.home.marquee || []} onChange={(v) => set('home', { marquee: v })} className="span-2" hint="Scroll under the hero. Press Enter after each phrase." />
            </div>
          </Panel>
        </>
      )}

      {tab === 'faq' && (
        <Panel title="FAQ" sub="Shown on the contact page. Drag order is top to bottom.">
          <div className="adm-stack">
            {(draft.faq || []).map((f, i) => (
              <div key={i} className="adm-faq">
                <div className="adm-faq__fields">
                  <Field label={`Question ${i + 1}`} error={E(`faq.${i}.q`)}><Input value={f.q} onChange={(e) => setDraft({ ...draft, faq: draft.faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })} /></Field>
                  <Field label="Answer" error={E(`faq.${i}.a`)}><Textarea rows={3} value={f.a} onChange={(e) => setDraft({ ...draft, faq: draft.faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })} /></Field>
                </div>
                <div className="adm-faq__actions">
                  <button type="button" className="adm-iconbtn" disabled={i === 0} onClick={() => { const f2 = [...draft.faq]; [f2[i - 1], f2[i]] = [f2[i], f2[i - 1]]; setDraft({ ...draft, faq: f2 }); }} aria-label="Move up">↑</button>
                  <button type="button" className="adm-iconbtn" disabled={i === draft.faq.length - 1} onClick={() => { const f2 = [...draft.faq]; [f2[i + 1], f2[i]] = [f2[i], f2[i + 1]]; setDraft({ ...draft, faq: f2 }); }} aria-label="Move down">↓</button>
                  <button type="button" className="adm-iconbtn danger" onClick={() => setDraft({ ...draft, faq: draft.faq.filter((_, j) => j !== i) })} aria-label="Remove">×</button>
                </div>
              </div>
            ))}
            <Btn type="button" variant="ghost" onClick={() => setDraft({ ...draft, faq: [...(draft.faq || []), { q: '', a: '' }] })}>+ Add question</Btn>
          </div>
        </Panel>
      )}

      {tab === 'legal' && (
        <Panel title="Legal" sub="Company details for the footer and invoices.">
          <div className="adm-form-grid">
            <Field label="Legal company name" error={E('legal.company')}><Input value={draft.legal.company} onChange={(e) => set('legal', { company: e.target.value })} /></Field>
            <Field label="GSTIN" error={E('legal.gstin')}><Input value={draft.legal.gstin} onChange={(e) => set('legal', { gstin: e.target.value })} /></Field>
            <Field label="Footer note" hint="e.g. 'Made with light in India'" className="span-2" error={E('legal.footerNote')}><Input value={draft.legal.footerNote} onChange={(e) => set('legal', { footerNote: e.target.value })} /></Field>
          </div>
          <p className="adm-muted adm-small">Terms, privacy and refund policies live under <strong>Pages</strong>.</p>
        </Panel>
      )}

      {tab === 'admins' && <Admins />}
    </>
  );
}

function Admins() {
  const { data, loading, reload } = useAdminData(() => adminApi.admins.list(), []);
  const me = useAdminAuth((s) => s.admin);
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [pw, setPw] = useState(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try { await adminApi.admins.create(form); toast('Administrator added', { type: 'success' }); setForm(null); reload(); } catch (err) { toast(err.message, { type: 'error' }); } finally { setBusy(false); }
  };
  const changePw = async () => {
    setBusy(true);
    try { await adminApi.admins.password(pw.id, pw.password); toast('Password updated', { type: 'success' }); setPw(null); } catch (err) { toast(err.message, { type: 'error' }); } finally { setBusy(false); }
  };
  const remove = async (a) => {
    if (!window.confirm(`Remove ${a.email} as an administrator?`)) return;
    try { await adminApi.admins.remove(a.id); toast('Administrator removed'); reload(); } catch (err) { toast(err.message, { type: 'error' }); }
  };

  return (
    <>
      <Panel title="Administrators" sub="People who can sign in to this studio." actions={<Btn size="sm" onClick={() => setForm({ name: '', email: '', password: '' })}>+ Add administrator</Btn>} padded={false}>
        <Table loading={loading} rows={data?.items || []} columns={[
          { key: 'name', label: 'Name', render: (r) => <span className="adm-strong">{r.name}{r.id === me?.id && <small className="adm-muted"> (you)</small>}</span> },
          { key: 'email', label: 'Email' },
          { key: 'createdAt', label: 'Added', render: (r) => <small className="adm-muted">{dateTime(r.createdAt)}</small> },
          { key: 'actions', label: '', align: 'right', render: (r) => <span className="adm-row adm-row--end"><Btn variant="ghost" size="sm" onClick={() => setPw({ id: r.id, email: r.email, password: '' })}>Change password</Btn>{r.id !== me?.id && <button className="adm-iconbtn danger" onClick={() => remove(r)} title="Remove">🗑</button>}</span> },
        ]} />
      </Panel>
      <Modal open={Boolean(form)} onClose={() => setForm(null)} title="Add administrator" width={520} footer={<><Btn variant="ghost" onClick={() => setForm(null)}>Cancel</Btn><Btn onClick={create} loading={busy}>Add</Btn></>}>
        {form && <div className="adm-stack">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Password" hint="At least 8 characters"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        </div>}
      </Modal>
      <Modal open={Boolean(pw)} onClose={() => setPw(null)} title={`New password for ${pw?.email || ''}`} width={480} footer={<><Btn variant="ghost" onClick={() => setPw(null)}>Cancel</Btn><Btn onClick={changePw} loading={busy} disabled={(pw?.password || '').length < 8}>Update password</Btn></>}>
        {pw && <Field label="New password" hint="At least 8 characters"><Input type="password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} autoFocus /></Field>}
      </Modal>
    </>
  );
}
