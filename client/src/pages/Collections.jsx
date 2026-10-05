import { lazy, Suspense } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCollection } from '@/hooks/useCatalog';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { CollectionsShowcase } from '@/components/home/Collections';
import { GiftingBanner } from '@/components/home/Gifting';
import { SplitText } from '@/components/ui/Reveal';
import { CandleThumb } from '@/components/shop/CandleThumb';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/format';

const CandleRow = lazy(() => import('@/components/three/CandleRow').then((m) => ({ default: m.CandleRow })));

const BG = { essentials: '#120d0b', premium: '#1a100b', luxury: '#0b0806' };

export function CollectionsIndex() {
  usePageTitle('Collections');
  return (
    <main data-theme="dark">
      <header className="page-hero container">
        <p className="eyebrow">Collections</p>
        <h1 className="display"><SplitText text="Essentials, Premium" /> <em><SplitText text="& Luxury." delay={0.3} /></em></h1>
        <p className="lead">Same wax, same wicks, same obsession — three expressions. Choose by occasion, by vessel, or by how much of the room you want to fill.</p>
      </header>
      <CollectionsShowcase />
      <GiftingBanner />
    </main>
  );
}

export default function Collection() {
  const { slug } = useParams();
  const { data, loading, error } = useCollection(slug);
  usePageTitle(data?.name ? `${data.name} collection` : 'Collection');

  if (slug === 'gifting') return <Navigate to="/gifting" replace />;
  if (error) return <NotFoundInline />;
  if (loading && !data) return <div className="page-loading" />;

  const products = data.products || [];
  return (
    <main className="collection" data-theme="dark" style={{ '--col-accent': data.accent }}>
      <section className="collection__hero" style={{ background: BG[slug] || '#0d0907' }}>
        <div className="collection__scene">
          <Suspense fallback={<div className="scene__fallback">{products[0] && <CandleThumb vessel={products[0].vessel} size={200} lit />}</div>}>
            <CandleRow products={products.slice(0, 5)} background={BG[slug] || '#0d0907'} />
          </Suspense>
        </div>
        <div className="collection__copy container--wide">
          <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>The {data.name} collection · {data.count} fragrances</motion.p>
          <h1 className="display"><SplitText text={data.title} inView={false} delay={0.5} /></h1>
          <motion.p className="lead" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.9 }}>{data.description}</motion.p>
          <motion.div className="collection__meta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
            <span className="caps">From {formatPrice(data.from)}</span>
            <span className="faint">·</span>
            <span className="caps">{data.specs?.wax}</span>
            <span className="faint">·</span>
            <span className="caps">{data.specs?.wick}</span>
          </motion.div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="collection__specs">
            {Object.entries(data.specs || {}).map(([k, v], i) => (
              <motion.div key={k} className="spec" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.7 }}>
                <span className="caps faint">{k}</span>
                <strong>{v}</strong>
              </motion.div>
            ))}
          </div>
          <ProductGrid products={products} loading={loading} columns={3} />
          <div className="collection__more">
            <Button to="/shop" variant="ghost" arrow>Browse every candle</Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function NotFoundInline() {
  return (
    <main className="page-hero container" data-theme="dark">
      <h1 className="display">That collection <em>drifted away.</em></h1>
      <p className="lead">Try <Link to="/collections/essentials" className="gold">Essentials</Link>, <Link to="/collections/premium" className="gold">Premium</Link> or <Link to="/collections/luxury" className="gold">Luxury</Link>.</p>
    </main>
  );
}
