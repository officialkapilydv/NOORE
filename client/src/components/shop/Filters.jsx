import { motion } from 'framer-motion';
import { FAMILY_LABEL, COLLECTION_LABEL, formatPrice, cx } from '@/lib/format';

const SORTS = [
  ['featured', 'Featured'],
  ['price-asc', 'Price · low to high'],
  ['price-desc', 'Price · high to low'],
  ['rating', 'Top rated'],
  ['newest', 'New arrivals'],
  ['name-asc', 'A – Z'],
];

function Chip({ active, onClick, children }) {
  return (
    <button type="button" className={cx('chip', active && 'is-active')} onClick={onClick} aria-pressed={active}>
      {active && <motion.span layoutId="chip-bg" className="chip__bg" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
      <span>{children}</span>
    </button>
  );
}

export function Filters({ state, onChange, facets, total, className = '' }) {
  const families = facets?.families || ['floral', 'woody', 'fresh', 'amber', 'citrus', 'gourmand', 'herbal'];
  const set = (patch) => onChange({ ...state, ...patch });
  const max = 8000;
  const activeCount = [state.collection, state.family, state.q, state.maxPrice && Number(state.maxPrice) < max].filter(Boolean).length;

  return (
    <aside className={cx('filters', className)} aria-label="Filters">
      <div className="filters__head">
        <span className="caps">Refine</span>
        <span className="faint small" aria-live="polite">{total} {total === 1 ? 'candle' : 'candles'}</span>
      </div>

      {state.q && (
        <div className="filters__group">
          <p className="filters__label">Searching</p>
          <button className="filters__q" onClick={() => set({ q: '' })} aria-label={`Clear search “${state.q}”`}>“{state.q}” <span aria-hidden="true">×</span></button>
        </div>
      )}

      <div className="filters__group">
        <p className="filters__label">Collection</p>
        <div className="filters__chips">
          {['', 'essentials', 'premium', 'luxury', 'gifting'].map((c) => (
            <button key={c || 'all'} type="button" className={cx('fchip', (state.collection || '') === c && 'is-active')} aria-pressed={(state.collection || '') === c} onClick={() => set({ collection: c })}>
              {c ? COLLECTION_LABEL[c] : 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="filters__group">
        <p className="filters__label">Fragrance family</p>
        <div className="filters__chips">
          {families.map((f) => (
            <button key={f} type="button" className={cx('fchip', state.family === f && 'is-active')} aria-pressed={state.family === f} onClick={() => set({ family: state.family === f ? '' : f })}>
              {FAMILY_LABEL[f] || f}
            </button>
          ))}
        </div>
      </div>

      <div className="filters__group">
        <p className="filters__label">Up to <strong>{formatPrice(state.maxPrice || max)}</strong></p>
        <input className="range" type="range" min={500} max={max} step={100} value={state.maxPrice || max} onChange={(e) => set({ maxPrice: Number(e.target.value) >= max ? '' : e.target.value })} aria-label="Maximum price" />
        <div className="range__ticks faint small"><span>₹500</span><span>₹8,000</span></div>
      </div>

      <div className="filters__group">
        <p className="filters__label">Sort</p>
        <div className="select">
          <select value={state.sort || 'featured'} onChange={(e) => set({ sort: e.target.value })} aria-label="Sort products">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {activeCount > 0 && (
        <button className="filters__clear" onClick={() => onChange({ sort: state.sort })}>Clear filters ({activeCount})</button>
      )}
    </aside>
  );
}

export { Chip };
