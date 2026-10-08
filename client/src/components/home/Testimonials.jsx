import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { Stars } from '@/components/ui/Primitives';
import { CandleThumb } from '@/components/shop/CandleThumb';
import { fallbackProducts } from '@/lib/api';

const ITEMS = [
  { name: 'Ananya R.', city: 'Mumbai', slug: 'amber-and-saffron', quote: 'Lit Amber & Saffron for a dinner party and three people asked where it was from before the starters arrived.' },
  { name: 'Rohan & Mira', city: 'Bengaluru', slug: 'the-luxury-signature-box', quote: 'We gave the Luxury box as a wedding present. The couple sent a photo of it on their mantel a month later — still burning.' },
  { name: 'Devika S.', city: 'New Delhi', slug: 'lavender-fields', quote: 'Lavender Fields is the only thing that gets my toddler — and me — to sleep. Ordered the Grand size twice.' },
  { name: 'Arjun K.', city: 'Hyderabad', slug: 'oud-and-oak', quote: 'Oud & Oak smells like a library in a very old hotel. I did not know I wanted my study to smell like that. I did.' },
  { name: 'The Lotus Hotel', city: 'Jaipur', slug: 'royal-oud', quote: 'Our lobby candle for two seasons now. Guests ask for it by name; we order 60 Royal Ouds a month.' },
];

/** 3D coverflow testimonials, auto-advancing. */
export function Testimonials() {
  const [i, setI] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduce = useReducedMotion();
  const n = ITEMS.length;

  // Only rotate while someone can see it, and never under a pointer, keyboard focus or reduced motion.
  const paused = hovered || focused || !inView || reduce;
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 4800);
    return () => clearInterval(t);
  }, [paused, n]);

  return (
    <section
      ref={ref}
      className="section testimonials"
      data-theme="dark"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}
    >
      <div className="container">
        <div className="sec-head sec-head--center">
          <p className="eyebrow eyebrow--plain">Loved in 40+ cities</p>
          <h2 className="display">Moments, <em>made</em></h2>
        </div>
        <div className="coverflow" aria-roledescription="carousel">
          {ITEMS.map((t, k) => {
            let offset = k - i;
            if (offset > n / 2) offset -= n;
            if (offset < -n / 2) offset += n;
            const abs = Math.abs(offset);
            const product = fallbackProducts.find((p) => p.slug === t.slug);
            return (
              <motion.figure
                key={t.name}
                className={`tcard ${offset === 0 ? 'is-active' : ''}`}
                animate={{ x: `${offset * 62}%`, scale: offset === 0 ? 1 : 0.84 - abs * 0.04, rotateY: offset * -28, opacity: abs > 2 ? 0 : 1 - abs * 0.3, zIndex: 10 - abs, filter: `blur(${abs * 1.5}px)` }}
                transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                onClick={() => setI(k)}
                style={{ transformPerspective: 1200 }}
              >
                <div className="tcard__thumb"><CandleThumb vessel={product.vessel} size={70} lit={offset === 0} /></div>
                <Stars value={5} size={13} className="gold" />
                <blockquote>“{t.quote}”</blockquote>
                <figcaption><strong>{t.name}</strong><span className="faint"> · {t.city}</span></figcaption>
              </motion.figure>
            );
          })}
        </div>
        <div className="coverflow__dots">
          {ITEMS.map((t, k) => (
            <button key={t.name} className={k === i ? 'is-active' : ''} onClick={() => setI(k)} aria-label={`Testimonial ${k + 1} of ${n}`} aria-current={k === i ? 'true' : undefined}>
              <AnimatePresence>{k === i && <motion.span layoutId="dot" />}</AnimatePresence>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
