import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { useLenis } from 'lenis/react';
import { useUI } from '@/store/ui';
import { api, onOfflineChange, isOffline } from '@/lib/api';
import { formatPrice, COLLECTION_LABEL } from '@/lib/format';
import { CandleThumb } from '@/components/shop/CandleThumb';
import { useDialog } from '@/hooks/useDialog';

/* ─── Gold scroll progress bar ─── */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}

/* ─── Page transition curtain ─── */
const CURTAIN_EASE = [0.76, 0, 0.24, 1];

export function PageTransition({ children }) {
  const { pathname } = useLocation();
  const lenis = useLenis();
  const setPageSettled = useUI((s) => s.setPageSettled);
  const [announcement, setAnnouncement] = useState('');

  // The new page is fully revealed: move keyboard focus to it (the link that was clicked is
  // gone, so focus would otherwise fall back to <body>) and announce it to screen readers.
  const onSettled = () => {
    setPageSettled(true);
    const main = document.getElementById('main');
    if (main && (!document.activeElement || document.activeElement === document.body)) main.focus({ preventScroll: true });
    setAnnouncement(document.title);
  };

  // The old page has left and the new one is still behind the curtain: reset scroll now, unseen.
  const onExitComplete = () => {
    setPageSettled(false);
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  };

  return (
    <>
      <AnimatePresence mode="wait" initial={false} onExitComplete={onExitComplete}>
        <motion.div key={pathname} className="page">
          <motion.div
            id="main"
            tabIndex={-1}
            className="page__content"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.25 } }}
            exit={{ opacity: 0, y: -16, transition: { duration: 0.3, ease: CURTAIN_EASE } }}
          >
            {children}
          </motion.div>
          <motion.div className="curtain curtain--a" initial={{ scaleY: 1 }} animate={{ scaleY: 0, transition: { duration: 0.7, ease: CURTAIN_EASE, delay: 0.05 } }} exit={{ scaleY: 1, transition: { duration: 0.45, ease: CURTAIN_EASE } }} style={{ originY: 0 }} />
          <motion.div
            className="curtain curtain--b"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0, transition: { duration: 0.7, ease: CURTAIN_EASE, delay: 0.12 } }}
            exit={{ scaleY: 1, transition: { duration: 0.45, ease: CURTAIN_EASE, delay: 0.06 } }}
            onAnimationComplete={(def) => def?.scaleY === 0 && onSettled()}
            style={{ originY: 0 }}
          />
        </motion.div>
      </AnimatePresence>
      <p className="sr-only" aria-live="polite">{announcement}</p>
    </>
  );
}

/* ─── Toasts ─── */
export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismissToast);
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} className={`toast toast--${t.type}`} layout initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} onClick={() => dismiss(t.id)}>
            <span className="toast__dot" />
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── "Fly to cart" clones ─── */
export function FlyToCart() {
  const flyers = useUI((s) => s.flyers);
  const target = useUI((s) => s.cartIconRect);
  return (
    <div className="flyers" aria-hidden="true">
      <AnimatePresence>
        {flyers.map((f) => {
          const tx = target ? target.left + target.width / 2 - 28 : window.innerWidth - 60;
          const ty = target ? target.top + target.height / 2 - 28 : 30;
          return (
            <motion.div
              key={f.id}
              className="flyer"
              initial={{ x: f.x - 28, y: f.y - 28, scale: 1.2, opacity: 1 }}
              animate={{ x: [f.x - 28, (f.x + tx) / 2, tx], y: [f.y - 28, Math.min(f.y, ty) - 160, ty], scale: [1.2, 0.9, 0.25], opacity: [1, 1, 0.6] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.95, ease: [0.4, 0, 0.2, 1], times: [0, 0.5, 1] }}
            >
              <CandleThumb vessel={f.vessel} size={56} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ─── Search overlay ─── */
export function SearchOverlay() {
  const open = useUI((s) => s.searchOpen);
  const setOpen = useUI((s) => s.setSearchOpen);
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  // The input is focused below once the panel has animated in.
  const dialogRef = useDialog(open, () => setOpen(false), { initialFocus: false });

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 350);
    else { setQ(''); setItems([]); }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    if (q.trim().length < 2) { setItems([]); return; }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      api.suggest(q.trim(), ctrl.signal).then((r) => setItems(r.items)).catch(() => {}).finally(() => setLoading(false));
    }, 180);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
    setOpen(false);
  };

  const QUICK = ['Oud', 'Rose', 'Vanilla', 'Gift sets', 'Lavender', 'Saffron'];

  return (
    <AnimatePresence>
      {open && (
        <motion.div ref={dialogRef} className="search" role="dialog" aria-modal="true" aria-label="Search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
          <motion.div className="search__bg" onClick={() => setOpen(false)} />
          <motion.div className="search__panel" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} data-lenis-prevent>
            <form className="search__form" onSubmit={submit}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.2" /><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fragrances, notes, moods…" aria-label="Search" />
              <button type="button" className="search__close" onClick={() => setOpen(false)} aria-label="Close search">Esc</button>
            </form>
            <div className="search__body">
              {q.trim().length < 2 ? (
                <div className="search__quick">
                  <p className="caps faint">Popular</p>
                  <div>
                    {QUICK.map((w) => <button key={w} type="button" onClick={() => setQ(w)}>{w}</button>)}
                  </div>
                </div>
              ) : (
                <ul className="search__results">
                  <AnimatePresence mode="popLayout">
                    {items.map((p, i) => (
                      <motion.li key={p.slug} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}>
                        <Link to={`/products/${p.slug}`} className="search__result" onClick={() => setOpen(false)}>
                          <CandleThumb vessel={p.vessel} size={48} />
                          <span className="search__result-text">
                            <span className="search__result-name">{p.name}</span>
                            <span className="faint">{COLLECTION_LABEL[p.collection]} · {p.tagline}</span>
                          </span>
                          <span className="search__result-price">{formatPrice(p.price)}</span>
                        </Link>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                  {!loading && items.length === 0 && <li className="search__empty muted">No matches — try a note like “oud” or a mood like “calming”.</li>}
                </ul>
              )}
              <p className="sr-only" aria-live="polite">{q.trim().length >= 2 && !loading ? `${items.length} ${items.length === 1 ? 'result' : 'results'}` : ''}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Offline catalog banner ─── */
export function OfflineBanner() {
  const [offline, setOffline] = useState(isOffline());
  useEffect(() => onOfflineChange(setOffline), []);
  return (
    <AnimatePresence>
      {offline && (
        <motion.div className="offline" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
          Showing the bundled catalog — start the API (<code>npm run dev</code> at the project root) for cart pricing & checkout.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
