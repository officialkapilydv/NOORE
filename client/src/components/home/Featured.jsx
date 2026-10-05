import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useProducts } from '@/hooks/useCatalog';
import { ProductCard } from '@/components/shop/ProductCard';
import { SectionHeading } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';

/** Draggable, inertial product carousel with a gold progress rail. */
export function FeaturedCarousel({ title = <>Loved by <em>candlelight</em></>, eyebrow = 'Bestsellers', params = { featured: true, limit: 8 }, cta = { to: '/shop', label: 'Shop all candles' }, theme = 'cream' }) {
  const { data, loading } = useProducts(params);
  const items = data?.items || [];
  const track = useRef(null);
  const viewport = useRef(null);
  const [bounds, setBounds] = useState(0);
  const x = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 120, damping: 24 });
  const progress = useTransform(x, [0, -Math.max(bounds, 1)], [0, 1]);

  useEffect(() => {
    const measure = () => {
      if (!track.current || !viewport.current) return;
      setBounds(Math.max(0, track.current.scrollWidth - viewport.current.clientWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewport.current) ro.observe(viewport.current);
    if (track.current) ro.observe(track.current);
    return () => ro.disconnect();
  }, [items.length]);

  const nudge = (dir) => {
    const step = viewport.current ? viewport.current.clientWidth * 0.6 : 400;
    x.set(Math.max(-bounds, Math.min(0, x.get() - dir * step)));
  };

  return (
    <section className="section featured" data-theme={theme}>
      <div className="container featured__head">
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className="featured__nav">
          <button className="arrow-btn" onClick={() => nudge(-1)} aria-label="Previous"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 12H5m6-6l-6 6 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
          <button className="arrow-btn" onClick={() => nudge(1)} aria-label="Next"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6l6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
        </div>
      </div>
      <div className="featured__viewport" ref={viewport} data-cursor="drag" data-cursor-label="Drag">
        <motion.div ref={track} className="featured__track" drag="x" dragConstraints={{ left: -bounds, right: 0 }} dragElastic={0.08} dragTransition={{ power: 0.25, timeConstant: 220 }} style={{ x: sx }} onDragEnd={() => x.set(sx.get())}>
          {(loading && !items.length ? Array.from({ length: 4 }).map((_, i) => ({ placeholder: i })) : items).map((p, i) => (
            <div className="featured__item" key={p.slug || `ph-${i}`}>
              {p.slug ? <ProductCard product={p} index={i} layout={false} /> : <div className="pcard"><div className="pcard__media skeleton" /></div>}
            </div>
          ))}
        </motion.div>
      </div>
      <div className="container featured__foot">
        <div className="rail"><motion.span style={{ scaleX: progress }} /></div>
        {cta && <Button to={cta.to} variant="link" arrow>{cta.label}</Button>}
      </div>
    </section>
  );
}
