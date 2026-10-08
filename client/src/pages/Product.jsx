import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useProduct } from '@/hooks/useCatalog';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatPrice, COLLECTION_LABEL, FAMILY_LABEL } from '@/lib/format';
import { useQuickAdd } from '@/components/shop/ProductCard';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { NotesPyramid } from '@/components/shop/NotesPyramid';
import { Reviews } from '@/components/shop/Reviews';
import { CandleThumb } from '@/components/shop/CandleThumb';
import { Button } from '@/components/ui/Button';
import { SplitText } from '@/components/ui/Reveal';
import { Accordion, Badge, Stars, Stepper } from '@/components/ui/Primitives';
import { useSettings } from '@/store/settings';

const ProductViewer = lazy(() => import('@/components/three/ProductViewer').then((m) => ({ default: m.ProductViewer })));

export default function Product() {
  const { slug } = useParams();
  const { data: product, loading, error } = useProduct(slug);
  const navigate = useNavigate();
  const quickAdd = useQuickAdd();
  const [sizeId, setSizeId] = useState(null);
  const [qty, setQty] = useState(1);
  const [lit, setLit] = useState(true);
  const [lidOpen, setLidOpen] = useState(true);
  const [showPhoto, setShowPhoto] = useState(false);
  const [added, setAdded] = useState(false);
  const addBtn = useRef(null);
  const ship = useSettings((s) => s.settings.shipping);
  usePageTitle(product?.name, product?.tagline);

  useEffect(() => { setSizeId(null); setQty(1); setLit(true); setLidOpen(true); setShowPhoto(false); }, [slug]);

  const size = useMemo(() => product?.sizes.find((s) => s.id === (sizeId || 'classic')) || product?.sizes[0], [product, sizeId]);
  if (error) return <main className="page-hero container" data-theme="dark"><h1 className="display">We couldn't find <em>that candle.</em></h1><p className="lead"><Link to="/shop" className="gold">Back to the shop</Link></p></main>;
  if (loading && !product) return <div className="page-loading" />;
  if (!product) return null;

  const hasLid = product.vessel.lid && product.vessel.lid !== 'none';
  const soldOut = product.stock <= 0;
  const maxQty = Math.max(1, Math.min(10, product.stock ?? 10));
  const isSet = product.kind === 'set';
  const add = (open) => {
    if (soldOut) return;
    quickAdd(product, size, Math.min(qty, maxQty), addBtn.current, { open });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const accordion = [
    { title: 'Fragrance notes', content: <NotesPyramid notes={product.notes} accent={product.vessel.accent} /> },
    { title: 'The details', content: (
      <dl className="specs">
        {Object.entries(product.specs || {}).map(([k, v]) => <div key={k}><dt className="caps faint">{k}</dt><dd>{v}</dd></div>)}
        <div><dt className="caps faint">Family</dt><dd>{FAMILY_LABEL[product.family]}</dd></div>
        <div><dt className="caps faint">Best in</dt><dd>{product.rooms.join(', ')}</dd></div>
      </dl>
    ) },
    { title: 'Candle care', content: <p className="muted">Burn for 2–3 hours on the first light so the pool reaches the edge. Trim the wick to 5 mm before every burn. Keep away from drafts, and stop burning when 1 cm of wax remains. Wash the vessel with warm soapy water and keep it.</p> },
    { title: 'Shipping & returns', content: <p className="muted">Complimentary shipping on orders over {formatPrice(ship.freeOver)}; otherwise {formatPrice(ship.flat)}. Dispatched within {ship.dispatchDays} working days and delivered across India in {ship.deliveryDays} days. Unlit candles may be returned within {ship.returnsDays} days. <Link to="/pages/shipping-and-returns" className="gold">Read the full policy</Link>.</p> },
  ];

  return (
    <main className="product" data-theme="dark">
      <div className="product__layout container--wide">
        <div className="product__stage-wrap">
          <div className="product__stage">
            <Suspense fallback={<div className="scene__fallback"><CandleThumb vessel={product.vessel} size={240} lit /></div>}>
              <ProductViewer product={product} lit={lit} lidOpen={lidOpen} hotspots={!isSet} includes={product.includesProducts || []} />
            </Suspense>
            <AnimatePresence>
              {showPhoto && (
                <motion.div className="product__photo" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.6 }}>
                  <img src={product.image} alt={product.name} />
                  <span className="product__photo-note caps">Concept photograph</span>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="product__controls">
              {!isSet && <button className={`ctrl ${lit ? 'is-on' : ''}`} onClick={() => setLit((l) => !l)} data-cursor="hover">{lit ? 'Snuff' : 'Light'}</button>}
              {hasLid && <button className={`ctrl ${lidOpen ? 'is-on' : ''}`} onClick={() => setLidOpen((o) => !o)} data-cursor="hover">{lidOpen ? 'Close lid' : 'Lift lid'}</button>}
              <button className={`ctrl ${showPhoto ? 'is-on' : ''}`} onClick={() => setShowPhoto((p) => !p)} data-cursor="hover">{showPhoto ? '3D view' : 'Photo'}</button>
            </div>
            <span className="product__drag caps faint">Drag to rotate · tap the dots for notes</span>
          </div>
        </div>

        <div className="product__info">
          <nav className="crumbs small faint" aria-label="Breadcrumb">
            <Link to="/shop">Shop</Link> / <Link to={product.collection === 'gifting' ? '/gifting' : `/collections/${product.collection}`}>{COLLECTION_LABEL[product.collection]}</Link> / <span>{product.name}</span>
          </nav>
          <div className="product__badges">{product.badges?.map((b) => <Badge key={b} tone={b === 'Limited' ? 'dark' : 'gold'}>{b}</Badge>)}</div>
          <h1 className="display product__name"><SplitText text={product.name} inView={false} delay={0.3} animateKey={slug} /></h1>
          <p className="product__tagline">{product.tagline}</p>
          <div className="product__rating">
            <Stars value={product.rating} size={15} />
            <span className="small muted">{product.rating.toFixed(1)} · {product.reviewCount} reviews</span>
          </div>
          <div className="product__price">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={size.id} initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -18, opacity: 0 }} transition={{ duration: 0.35 }}>{formatPrice(size.price)}</motion.span>
            </AnimatePresence>
            <span className="small faint">incl. taxes</span>
          </div>
          <p className="product__desc lead">{product.description}</p>

          {isSet && product.includesProducts?.length > 0 && (
            <div className="product__includes">
              <p className="caps faint">Inside the box</p>
              <ul>
                {product.includesProducts.map((p) => (
                  <li key={p.slug}><Link to={`/products/${p.slug}`}><CandleThumb vessel={p.vessel} size={44} lit /><span>{p.name}</span><span className="faint small">{p.tagline}</span></Link></li>
                ))}
              </ul>
            </div>
          )}

          <div className="product__sizes">
            <p className="caps faint">{isSet ? 'Format' : 'Size'}</p>
            <div className="sizes">
              {product.sizes.map((s) => (
                <button key={s.id} className={`size ${size.id === s.id ? 'is-active' : ''}`} onClick={() => setSizeId(s.id)} aria-pressed={size.id === s.id}>
                  {size.id === s.id && <motion.span layoutId="size-bg" className="size__bg" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                  <span className="size__label">{s.label}</span>
                  <span className="size__meta">{s.weight} · {s.burnTime}</span>
                  <span className="size__price">{formatPrice(s.price)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="product__buy">
            <Stepper value={Math.min(qty, maxQty)} onChange={setQty} max={maxQty} />
            <Button ref={addBtn} variant="gold" size="lg" className="product__add" onClick={() => add(false)} magnetic={false} disabled={soldOut}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={added ? 'a' : 'b'} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.25 }}>
                  {soldOut ? 'Sold out' : added ? '✦ Added to bag' : `Add to bag · ${formatPrice(size.price * Math.min(qty, maxQty))}`}
                </motion.span>
              </AnimatePresence>
            </Button>
            <Button variant="ghost" size="lg" onClick={() => { add(false); setTimeout(() => navigate('/checkout'), 500); }} magnetic={false} disabled={soldOut}>Buy now</Button>
          </div>
          <p className="product__stock small">{product.stock <= 0 ? <span className="gold">Sold out — back soon</span> : product.stock <= 10 ? <span className="gold">Only {product.stock} left in this pour</span> : `In stock · ships in ${ship.dispatchDays} working days`} · Free shipping over {formatPrice(ship.freeOver)}</p>

          <div className="product__moods">
            {product.moods.map((m) => <span key={m} className="mood">{m}</span>)}
          </div>

          <Accordion items={accordion} defaultOpen={0} className="product__accordion" />
        </div>
      </div>

      <section className="section product__story" data-theme="cream">
        <div className="container grid-2">
          <motion.div className="product__story-img" initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}>
            <img src={product.image} alt="" />
            <span className="product__story-candle"><CandleThumb vessel={product.vessel} size={150} lit /></span>
          </motion.div>
          <div>
            <p className="eyebrow">The story</p>
            <h2 className="display">Why <em>{product.name}</em> smells the way it does</h2>
            <p className="lead">{product.story}</p>
            <div className="product__story-notes">
              {['top', 'heart', 'base'].map((k) => (
                <div key={k}><span className="caps faint">{k}</span><strong>{product.notes[k].join(', ')}</strong></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {product.related?.length > 0 && (
        <section className="section" data-theme="dark">
          <div className="container">
            <div className="sec-head">
              <p className="eyebrow">Pairs beautifully with</p>
              <h2 className="display">You may also <em>love</em></h2>
            </div>
            <ProductGrid products={product.related} columns={4} />
          </div>
        </section>
      )}

      <section className="section section--tight" data-theme="dark">
        <div className="container">
          <Reviews product={product} initial={product.reviews || []} />
        </div>
      </section>
    </main>
  );
}
