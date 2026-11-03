import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fallbackProducts } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { CandleThumb } from '@/components/shop/CandleThumb';
import { SplitText } from '@/components/ui/Reveal';
import { useMedia, usePrefersReducedMotion } from '@/hooks/useMedia';

const MorphCandleScene = lazy(() => import('@/components/three/MorphCandle').then((m) => ({ default: m.MorphCandleScene })));

const ROOMS = [
  { room: 'The living room', slug: 'amber-and-saffron', line: 'Golden, generous, made for company. Light it an hour before guests arrive.' },
  { room: 'The bedroom', slug: 'lavender-fields', line: 'Twenty minutes before bed. The exhale at the end of the day.' },
  { room: 'The study', slug: 'oud-and-oak', line: 'Smoke, leather and oak for late pages and long thoughts.' },
  { room: 'The bath', slug: 'eucalyptus-mint', line: 'Forest air and cool mint — the spa you already own.' },
  { room: 'The kitchen', slug: 'citrus-zest', line: 'Sunlight in a tumbler. Clears the room, lifts the mood.' },
];

/** Phones and tablets: the candle morphs in place as the room cards are swiped beneath it. */
function SpaceSlider({ steps, active, onActive, scene, intro }) {
  const track = useRef(null);
  const reduce = usePrefersReducedMotion();
  const count = steps.length;

  useEffect(() => {
    const el = track.current;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = el.scrollWidth - el.clientWidth;
        if (max > 0) onActive(Math.round((el.scrollLeft / max) * (count - 1)));
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [count, onActive]);

  const goTo = (i) => {
    const el = track.current;
    const slide = el.children[Math.max(0, Math.min(count - 1, i))];
    el.scrollTo({ left: slide.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft), behavior: reduce ? 'auto' : 'smooth' });
  };
  // Swiping the candle itself turns the slider too.
  const onPanEnd = (_, { offset }) => {
    if (Math.abs(offset.x) > 40 && Math.abs(offset.x) > Math.abs(offset.y)) goTo(active + (offset.x < 0 ? 1 : -1));
  };

  return (
    <section className="section section--flush space space--slider" data-theme="dark">
      <div className="container">{intro}</div>
      <motion.div className="space__scene" onPanEnd={onPanEnd}>{scene}</motion.div>
      <div role="group" aria-roledescription="carousel" aria-label="Candles for every room">
        <div ref={track} className="space__track" tabIndex={0}>
          {steps.map((s, i) => (
            <div key={s.slug} className={`space__slide ${active === i ? 'is-active' : ''}`} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`}>
              <span className="space__index">0{i + 1}</span>
              <h3 className="space__room display">{s.room}</h3>
              <p className="space__line lead">{s.line}</p>
              <p className="space__notes caps">{s.product.notes.top[0]} · {s.product.notes.heart[0]} · {s.product.notes.base[0]}</p>
              <Link to={`/products/${s.slug}`} className="space__link">Discover {s.product.name} →</Link>
            </div>
          ))}
        </div>
        <div className="space__nav container">
          <button type="button" className="arrow-btn" aria-label="Previous room" disabled={active === 0} onClick={() => goTo(active - 1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="space__dots">
            {steps.map((s, i) => (
              <button key={s.slug} type="button" className={`space__dot ${active === i ? 'is-active' : ''}`} aria-label={`Go to ${s.room}`} aria-current={active === i ? 'true' : undefined} onClick={() => goTo(i)}><span /></button>
            ))}
          </div>
          <button type="button" className="arrow-btn" aria-label="Next room" disabled={active === count - 1} onClick={() => goTo(active + 1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
}

/** Scrollytelling: sticky morphing candle on the left, rooms scroll on the right. Becomes a slider on narrow screens. */
export function SignatureSpace() {
  const [active, setActive] = useState(0);
  const refs = useRef([]);
  const narrow = useMedia('(max-width: 960px)');
  const steps = ROOMS.map((r) => ({ ...r, product: fallbackProducts.find((p) => p.slug === r.slug) }));
  const product = steps[active].product;

  useEffect(() => {
    if (narrow) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(Number(e.target.dataset.index)); });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [narrow]);

  const scene = (
    <>
      <Suspense fallback={<div className="scene__fallback"><CandleThumb vessel={product.vessel} size={220} lit /></div>}>
        <MorphCandleScene product={product} />
      </Suspense>
      <motion.div key={product.slug} className="space__caption" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <span className="caps gold">{String(active + 1).padStart(2, '0')} / 0{steps.length}</span>
        <Link to={`/products/${product.slug}`} className="space__product">{product.name} <span className="faint">· {formatPrice(product.price)}</span></Link>
      </motion.div>
    </>
  );
  const intro = (
    <div className="space__intro">
      <p className="eyebrow">Create your signature space</p>
      <h2 className="display"><SplitText text="A candle for every" /> <em><SplitText text="corner of home." delay={0.3} /></em></h2>
    </div>
  );

  if (narrow) return <SpaceSlider steps={steps} active={active} onActive={setActive} scene={scene} intro={intro} />;

  return (
    <section className="section section--flush space" data-theme="dark">
      <div className="space__sticky">
        <div className="space__scene">{scene}</div>
      </div>
      <div className="space__steps container">
        {intro}
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
