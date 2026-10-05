import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi, issuesToErrors } from '../api';
import { useAdminData, PageHead, Panel, Table, Pill, Btn, Field, Input, Textarea, Toggle, dateTime, useToast } from '../ui';
import { Markdown } from '@/lib/markdown.jsx';
import { slugify } from '@/lib/format';

const EMPTY = { slug: '', title: '', summary: '', body: '# Title\n\nWrite your content here. Use **bold**, *italic*, lists and ## headings.', published: true, showInFooter: true };

function Editor({ slug }) {
  const isNew = slug === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error } = useAdminData(() => (isNew ? Promise.resolve(EMPTY) : adminApi.pages.get(slug)), [slug]);
  const [draft, setDraft] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(true);
  useEffect(() => { if (data) setDraft(data); }, [data]);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const payload = { slug: slugify(draft.slug || draft.title), title: draft.title, summary: draft.summary || '', body: draft.body, published: draft.published, showInFooter: draft.showInFooter };
      const saved = isNew ? await adminApi.pages.create(payload) : await adminApi.pages.update(slug, payload);
      toast('Page saved', { type: 'success' });
      if (saved.slug !== slug) navigate(`/admin/pages/${saved.slug}`, { replace: true });
    } catch (err) {
      setErrors(issuesToErrors(err));
      toast(err.message, { type: 'error' });
    } finally { setSaving(false); }
  };
  const remove = async () => {
    if (!window.confirm(`Delete "${draft.title}"? Links to /pages/${slug} will stop working.`)) return;
    try { await adminApi.pages.remove(slug); toast('Page deleted'); navigate('/admin/pages'); } catch (err) { toast(err.message, { type: 'error' }); }
  };

  if (error) return <div className="adm-empty">{error.message}</div>;
  if (loading && !data) return <div className="adm-loading"><span className="adm-spinner adm-spinner--dark" /></div>;

  return (
    <>
      <PageHead title={isNew ? 'New page' : draft.title} sub={isNew ? 'A new information page, e.g. a warranty or wholesale policy.' : <>Live at <a className="adm-link" href={`/pages/${slug}`} target="_blank" rel="noreferrer">/pages/{slug} ↗</a></>}>
        <Btn variant="ghost" onClick={() => navigate('/admin/pages')}>Back</Btn>
        {!isNew && <Btn variant="danger" onClick={remove}>Delete</Btn>}
        <Btn onClick={save} loading={saving}>Save page</Btn>
      </PageHead>
      <div className="adm-editor">
        <div className="adm-editor__main">
          <Panel title="Content" actions={<Btn variant="ghost" size="sm" type="button" onClick={() => setPreview((p) => !p)}>{preview ? 'Hide preview' : 'Show preview'}</Btn>}>
            <div className="adm-form-grid">
              <Field label="Title" error={errors.title}><Input value={draft.title} onChange={(e) => set({ title: e.target.value })} /></Field>
              <Field label="URL slug" error={errors.slug} hint={`/pages/${slugify(draft.slug || draft.title) || '…'}`}><Input value={draft.slug} onChange={(e) => set({ slug: e.target.value })} /></Field>
              <Field label="Summary" hint="One sentence under the title" className="span-2" error={errors.summary}><Input value={draft.summary} onChange={(e) => set({ summary: e.target.value })} /></Field>
            </div>
            <div className={`adm-md ${preview ? 'adm-md--split' : ''}`}>
              <Field label="Body (Markdown)" error={errors.body}><Textarea className="adm-md__editor" value={draft.body} onChange={(e) => set({ body: e.target.value })} spellCheck /></Field>
              {preview && <div className="adm-md__preview"><span className="adm-field__label">Preview</span><div className="adm-prose"><Markdown source={draft.body} className="prose" /></div></div>}
            </div>
            <p className="adm-muted adm-small">Formatting: <code># Heading</code>, <code>## Sub-heading</code>, <code>**bold**</code>, <code>*italic*</code>, <code>- list item</code>, <code>1. numbered</code>, <code>[link](https://…)</code>, <code>---</code> for a divider.</p>
          </Panel>
        </div>
        <aside className="adm-editor__side">
          <Panel title="Visibility">
            <div className="adm-stack">
              <Toggle checked={draft.published} onChange={(v) => set({ published: v })} label={draft.published ? 'Published' : 'Unpublished (404 on storefront)'} />
              <Toggle checked={draft.showInFooter} onChange={(v) => set({ showInFooter: v })} label="Link in the footer's Help column" />
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}

export default function Pages() {
  const { slug } = useParams();
  const { data, loading } = useAdminData(() => adminApi.pages.list(), [slug]);
  if (slug) return <Editor key={slug} slug={slug} />;
  return (
    <>
      <PageHead title="Pages" sub="Terms, privacy, shipping, refunds, candle care — and anything else customers should be able to read.">
        <Link to="/admin/pages/new" className="adm-btn adm-btn--primary adm-btn--md">+ New page</Link>
      </PageHead>
      <Panel padded={false}>
        <Table loading={loading} rows={data?.items || []} rowKey={(r) => r.slug} columns={[
          { key: 'title', label: 'Page', render: (r) => <span><Link className="adm-link adm-strong" to={`/admin/pages/${r.slug}`}>{r.title}</Link><br /><small className="adm-muted">/pages/{r.slug}</small></span> },
          { key: 'summary', label: 'Summary', render: (r) => <span className="adm-clamp adm-clamp--wide">{r.summary}</span> },
          { key: 'length', label: 'Length', align: 'right', render: (r) => <small className="adm-muted">{Math.round((r.length || 0) / 6)} words</small> },
          { key: 'published', label: 'Status', render: (r) => <span className="adm-row">{r.published === false ? <Pill tone="neutral">Unpublished</Pill> : <Pill tone="ok">Live</Pill>}{r.showInFooter && <Pill tone="info">Footer</Pill>}</span> },
          { key: 'updatedAt', label: 'Updated', render: (r) => <small className="adm-muted">{dateTime(r.updatedAt)}</small> },
          { key: 'view', label: '', align: 'right', render: (r) => <a className="adm-iconbtn" href={`/pages/${r.slug}`} target="_blank" rel="noreferrer" title="View">↗</a> },
        ]} empty="No pages yet." />
      </Panel>
    </>
  );
}
