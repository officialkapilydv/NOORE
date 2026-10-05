import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fallbackProducts } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { CandleThumb } from '@/components/shop/CandleThumb';
import { SplitText } from '@/components/ui/Reveal';

const MorphCandleScene = lazy(() => import('@/components/three/MorphCandle').then((m) => ({ default: m.MorphCandleScene })));

const ROOMS = [
  { room: 'The living room', slug: 'amber-and-saffron', line: 'Golden, generous, made for company. Light it an hour before guests arrive.' },
  { room: 'The bedroom', slug: 'lavender-fields', line: 'Twenty minutes before bed. The exhale at the end of the day.' },
  { room: 'The study', slug: 'oud-and-oak', line: 'Smoke, leather and oak for late pages and long thoughts.' },
  { room: 'The bath', slug: 'eucalyptus-mint', line: 'Forest air and cool mint — the spa you already own.' },
  { room: 'The kitchen', slug: 'citrus-zest', line: 'Sunlight in a tumbler. Clears the room, lifts the mood.' },
];

/** Scrollytelling: sticky morphing candle on the left, rooms scroll on the right. */
export function SignatureSpace() {
  const [active, setActive] = useState(0);
  const refs = useRef([]);
  const steps = ROOMS.map((r) => ({ ...r, product: fallbackProducts.find((p) => p.slug === r.slug) }));
  const product = steps[active].product;

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(Number(e.target.dataset.index)); });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="section section--flush space" data-theme="dark">
      <div className="space__sticky">
        <div className="space__scene">
          <Suspense fallback={<div className="scene__fallback"><CandleThumb vessel={product.vessel} size={220} lit /></div>}>
            <MorphCandleScene product={product} />
          </Suspense>
          <motion.div key={product.slug} className="space__caption" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="caps gold">{String(active + 1).padStart(2, '0')} / 0{steps.length}</span>
            <Link to={`/products/${product.slug}`} className="space__product">{product.name} <span className="faint">· {formatPrice(product.price)}</span></Link>
          </motion.div>
        </div>
      </div>
      <div className="space__steps container">
        <div className="space__intro">
          <p className="eyebrow">Create your signature space</p>
          <h2 className="display"><SplitText text="A candle for every" /> <em><SplitText text="corner of home." delay={0.3} /></em></h2>
        </div>
        {steps.map((s, i) => (
          <div key={s.slug} ref={(el) => (refs.current[i] = el)} data-index={i} className={`space__step ${active === i ? 'is-active' : ''}`}>
            <span className="space__index">0{i + 1}</span>
            <h3 className="space__room display">{s.room}</h3>
            <p className="space__line lead">{s.line}</p>
            <p className="space__notes caps">{s.product.notes.top[0]} · {s.product.notes.heart[0]} · {s.product.notes.base[0]}</p>
            <Link to={`/products/${s.slug}`} className="space__link">Discover {s.product.name} →</Link>
          </div>
        ))}
        <div className="space__spacer" />
      </div>
    </section>
  );
}
