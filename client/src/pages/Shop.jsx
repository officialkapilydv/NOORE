import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useProducts } from '@/hooks/useCatalog';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useMedia } from '@/hooks/useMedia';
import { Filters } from '@/components/shop/Filters';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { SplitText } from '@/components/ui/Reveal';
import { COLLECTION_LABEL } from '@/lib/format';

const KEYS = ['collection', 'family', 'q', 'sort', 'maxPrice'];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => Object.fromEntries(KEYS.map((k) => [k, params.get(k) || ''])), [params]);
  const { data, loading, error, refetch } = useProducts(Object.fromEntries(Object.entries(state).filter(([, v]) => v)));
  const [mobileOpen, setMobileOpen] = useState(false);
  // Tracks resizes/rotation; reading window.innerWidth during render left the panel missing after widening.
  const wide = useMedia('(min-width: 961px)');
  const items = data?.items || [];
  usePageTitle(state.q ? `Search “${state.q}”` : state.collection ? COLLECTION_LABEL[state.collection] : 'Shop all candles');

  const onChange = (next) => {
    const sp = new URLSearchParams();
    KEYS.forEach((k) => { if (next[k]) sp.set(k, next[k]); });
    setParams(sp, { replace: true });
  };

  return (
    <main className="shop" data-theme="dark">
      <header className="shop__hero container">
        <p className="eyebrow">The shop</p>
        <h1 className="display"><SplitText text={state.q ? `Results for “${state.q}”` : state.collection ? `${COLLECTION_LABEL[state.collection]} candles` : 'All candles'} animateKey={state.q + state.collection} /></h1>
        <p className="lead">Twenty-one fragrances across three tiers. Filter by family, collection or budget — or simply follow your nose.</p>
      </header>
      <div className="container shop__layout">
        <button className="shop__filter-toggle" aria-expanded={mobileOpen || wide} onClick={() => setMobileOpen((o) => !o)}>{mobileOpen ? 'Hide filters' : 'Filters & sort'}</button>
        <AnimatePresence initial={false}>
          {(mobileOpen || wide) && (
            <motion.div className="shop__side" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.5 }}>
              <Filters state={state} onChange={onChange} facets={data?.facets} total={items.length} />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="shop__main">
          <ProductGrid products={items} loading={loading} error={error} onRetry={refetch} columns={3} />
        </div>
      </div>
    </main>
  );
}
