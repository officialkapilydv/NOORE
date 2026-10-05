/** Shared admin-panel primitives: panels, tables, fields, pickers, modals. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { adminApi } from './api';
import { useUI } from '@/store/ui';
import { cx, formatPrice } from '@/lib/format';

/* ─── Data hook ─── */
export function useAdminData(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    return fetcher().then((data) => setState({ data, loading: false, error: null })).catch((error) => setState({ data: null, loading: false, error }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  return { ...state, reload, setData: (data) => setState((s) => ({ ...s, data })) };
}

export const useToast = () => useUI((s) => s.toast);

/* ─── Layout ─── */
export function PageHead({ title, sub, children }) {
  return (
    <div className="adm-head">
      <div>
        <h1 className="adm-title">{title}</h1>
        {sub && <p className="adm-sub">{sub}</p>}
      </div>
      {children && <div className="adm-head__actions">{children}</div>}
    </div>
  );
}

export function Panel({ title, sub, actions, children, className = '', padded = true }) {
  return (
    <section className={cx('adm-panel', !padded && 'adm-panel--flush', className)}>
      {(title || actions) && (
        <header className="adm-panel__head">
          <div>{title && <h2>{title}</h2>}{sub && <p className="adm-sub">{sub}</p>}</div>
          {actions && <div className="adm-panel__actions">{actions}</div>}
        </header>
      )}
      <div className={cx('adm-panel__body', !padded && 'adm-panel__body--flush')}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, tone }) {
  return (
    <div className={cx('adm-stat', tone && `adm-stat--${tone}`)}>
      <span className="adm-stat__label">{label}</span>
      <span className="adm-stat__value">{value}</span>
      {hint && <span className="adm-stat__hint">{hint}</span>}
    </div>
  );
}

export function Btn({ children, variant = 'primary', size = 'md', className = '', loading, ...rest }) {
  return (
    <button className={cx('adm-btn', `adm-btn--${variant}`, `adm-btn--${size}`, loading && 'is-loading', className)} disabled={loading || rest.disabled} {...rest}>
      {loading ? <span className="adm-spinner" /> : children}
    </button>
  );
}

export function Pill({ children, tone = 'neutral' }) {
  return <span className={cx('adm-pill', `adm-pill--${tone}`)}>{children}</span>;
}

export const STATUS_TONE = { placed: 'info', confirmed: 'info', packed: 'warn', shipped: 'warn', delivered: 'ok', cancelled: 'bad', refunded: 'bad', new: 'info', open: 'info', 'in-progress': 'warn', 'proposal-sent': 'warn', won: 'ok', lost: 'bad', replied: 'ok', closed: 'neutral', paid: 'ok', pending: 'warn' };

/* ─── Table ─── */
export function Table({ columns, rows, rowKey = (r) => r.id, empty = 'Nothing here yet.', onRowClick, loading }) {
  if (loading && !rows?.length) return <div className="adm-loading"><span className="adm-spinner adm-spinner--dark" /></div>;
  if (!rows?.length) return <div className="adm-empty">{empty}</div>;
  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key} style={{ width: c.width, textAlign: c.align || 'left' }}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className={onRowClick ? 'is-clickable' : ''} onClick={onRowClick ? () => onRowClick(r) : undefined}>
              {columns.map((c) => <td key={c.key} style={{ textAlign: c.align || 'left' }}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="adm-pagination">
      <Btn variant="ghost" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>← Prev</Btn>
      <span>Page {page} of {pages}</span>
      <Btn variant="ghost" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next →</Btn>
    </div>
  );
}

/* ─── Fields ─── */
export function Field({ label, hint, error, className = '', children, inline }) {
  return (
    <label className={cx('adm-field', inline && 'adm-field--inline', error && 'has-error', className)}>
      {label && <span className="adm-field__label">{label}</span>}
      {children}
      {error ? <span className="adm-field__error">{error}</span> : hint ? <span className="adm-field__hint">{hint}</span> : null}
    </label>
  );
}

export const Input = ({ className = '', ...rest }) => <input className={cx('adm-input', className)} {...rest} />;
export const Textarea = ({ className = '', ...rest }) => <textarea className={cx('adm-input adm-textarea', className)} {...rest} />;
export const Select = ({ className = '', children, ...rest }) => <select className={cx('adm-input adm-select', className)} {...rest}>{children}</select>;

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" className={cx('adm-toggle', checked && 'is-on')} onClick={() => onChange(!checked)} role="switch" aria-checked={checked}>
      <span className="adm-toggle__track"><span className="adm-toggle__thumb" /></span>
      {label && <span>{label}</span>}
    </button>
  );
}

export function ColorField({ label, value, onChange, error }) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : '#000000';
  return (
    <Field label={label} error={error}>
      <span className="adm-color">
        <input type="color" value={safe} onChange={(e) => onChange(e.target.value)} aria-label={`${label} picker`} />
        <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="#c9a24a" maxLength={7} />
      </span>
    </Field>
  );
}

export function TagInput({ label, value = [], onChange, placeholder = 'Type and press Enter', hint, error, className }) {
  const [draft, setDraft] = useState('');
  const add = (raw) => {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    onChange([...value, ...parts.filter((p) => !value.includes(p))]);
    setDraft('');
  };
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      <span className="adm-tags">
        {value.map((t) => (
          <span key={t} className="adm-tag">{t}<button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`}>×</button></span>
        ))}
        <input
          className="adm-tags__input"
          value={draft}
          placeholder={value.length ? '' : placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(draft); } if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1)); }}
          onBlur={() => draft && add(draft)}
        />
      </span>
    </Field>
  );
}

/* ─── Modal ─── */
export function Modal({ open, onClose, title, children, width = 720, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="adm-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="adm-modal__bg" onClick={onClose} />
          <motion.div className="adm-modal__panel" style={{ maxWidth: width }} initial={{ y: 24, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 16, scale: 0.98 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} role="dialog" aria-modal="true">
            <header className="adm-modal__head"><h3>{title}</h3><button className="adm-modal__close" onClick={onClose} aria-label="Close">×</button></header>
            <div className="adm-modal__body">{children}</div>
            {footer && <footer className="adm-modal__foot">{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Media library & image picker ─── */
export function MediaLibrary({ onPick, selectable = false }) {
  const { data, loading, reload } = useAdminData(() => adminApi.media.list(), []);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const upload = async (files) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const res = await adminApi.media.upload(files);
      toast(`${res.items.length} image${res.items.length > 1 ? 's' : ''} uploaded`, { type: 'success' });
      await reload();
      if (selectable && res.items[0]) onPick?.(res.items[0].url);
    } catch (err) {
      toast(err.message, { type: 'error' });
    } finally {
      setBusy(false);
    }
  };
  const remove = async (name) => {
    if (!window.confirm('Delete this image? Products using it will show a broken image.')) return;
    try { await adminApi.media.remove(name); toast('Image deleted'); reload(); } catch (err) { toast(err.message, { type: 'error' }); }
  };

  return (
    <div className="adm-media">
      <div
        className={cx('adm-dropzone', busy && 'is-busy')}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
        {busy ? <span className="adm-spinner adm-spinner--dark" /> : <><strong>Drop images here</strong><span>or click to upload · JPG, PNG, WEBP, SVG · up to 6 MB</span></>}
      </div>
      {loading && !data ? <div className="adm-loading"><span className="adm-spinner adm-spinner--dark" /></div> : (
        <>
          {data?.items?.length > 0 && (
            <>
              <p className="adm-media__label">Uploads</p>
              <div className="adm-media__grid">
                {data.items.map((m) => (
                  <figure key={m.name} className="adm-media__item">
                    <button type="button" className="adm-media__thumb" onClick={() => onPick?.(m.url)} title={selectable ? 'Use this image' : m.name}><img src={m.url} alt="" loading="lazy" /></button>
                    <figcaption>
                      <span title={m.name}>{m.name}</span>
                      <span className="adm-media__actions">
                        <button type="button" onClick={() => { navigator.clipboard?.writeText(m.url); toast('URL copied'); }}>Copy URL</button>
                        <button type="button" className="danger" onClick={() => remove(m.name)}>Delete</button>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </>
          )}
          {data?.bundled?.length > 0 && (
            <>
              <p className="adm-media__label">Bundled catalog imagery</p>
              <div className="adm-media__grid adm-media__grid--small">
                {data.bundled.map((m) => (
                  <figure key={m.name} className="adm-media__item">
                    <button type="button" className="adm-media__thumb" onClick={() => onPick?.(m.url)} title={m.name}><img src={m.url} alt="" loading="lazy" /></button>
                    <figcaption><span title={m.name}>{m.name}</span></figcaption>
                  </figure>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export function ImagePicker({ label = 'Image', value, onChange, hint, error }) {
  const [open, setOpen] = useState(false);
  return (
    <Field label={label} hint={hint} error={error}>
      <div className="adm-imgpick">
        <div className="adm-imgpick__preview">{value ? <img src={value} alt="" /> : <span>No image</span>}</div>
        <div className="adm-imgpick__controls">
          <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="/images/products/… or https://…" />
          <div className="adm-row">
            <Btn type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>Choose / upload</Btn>
            {value && <Btn type="button" variant="ghost" size="sm" onClick={() => onChange('')}>Clear</Btn>}
          </div>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Media library" width={960}>
        <MediaLibrary selectable onPick={(url) => { onChange(url); setOpen(false); }} />
      </Modal>
    </Field>
  );
}

export const money = (v) => formatPrice(v);
export const dateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
