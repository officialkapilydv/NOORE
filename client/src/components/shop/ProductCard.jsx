import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '@/store/cart';
import { useUI } from '@/store/ui';
import { formatPrice, COLLECTION_LABEL, shade, isDark } from '@/lib/format';
import { CandleThumb } from './CandleThumb';
import { Badge, Stars, TiltCard } from '@/components/ui/Primitives';

/** Fires the fly-to-cart animation from a DOM element and adds the item. */
export function useQuickAdd() {
  const add = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);
  const fly = useUI((s) => s.fly);
  const toast = useUI((s) => s.toast);
  return (product, size, quantity = 1, fromEl, { open = false } = {}) => {
    const chosen = size || product.sizes.find((s) => s.id === 'classic') || product.sizes[0];
    add(product, chosen, quantity);
    if (fromEl) {
      const r = fromEl.getBoundingClientRect();
      fly({ x: r.left + r.width / 2, y: r.top + r.height / 2, vessel: product.vessel });
    }
    if (open) setTimeout(openCart, 700);
    else toast(`${product.name} added to your bag`, { type: 'success' });
  };
}

export function ProductCard({ product, index = 0, layout = true, compact = false }) {
  const quickAdd = useQuickAdd();
  const thumbRef = useRef(null);
  const [hover, setHover] = useState(false);
  const v = product.vessel;
  const dark = isDark(v.color);
  const bgA = dark ? shade(v.color, 0.22) : shade(v.color, -0.42);
  const bgB = '#120c09';
  const defaultSize = product.sizes.find((s) => s.id === 'classic') || product.sizes[0];

  return (
    <motion.article
      className={`pcard ${compact ? 'pcard--compact' : ''}`}
      layout={layout ? 'position' : false}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.8, delay: Math.min(index, 8) * 0.06, ease: [0.16, 1, 0.3, 1] }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <TiltCard className="pcard__tilt" max={7} scale={1.015}>
        <Link to={`/products/${product.slug}`} className="pcard__media" data-cursor="view" data-cursor-label="View" style={{ '--bg-a': bgA, '--bg-b': bgB, '--glow': v.glow }}>
          <span className="pcard__photo" style={{ backgroundImage: `url(${product.image})` }} aria-hidden="true" />
          <span className="pcard__halo" aria-hidden="true" />
          <motion.span ref={thumbRef} className="pcard__candle" animate={{ y: hover ? -10 : 0, rotate: hover ? -2 : 0, scale: hover ? 1.04 : 1 }} transition={{ type: 'spring', stiffness: 220, damping: 20 }}>
            <CandleThumb vessel={v} size={compact ? 120 : 160} lit />
          </motion.span>
          <span className="pcard__badges">
            {product.badges?.slice(0, 2).map((b) => <Badge key={b} tone={b === 'Limited' ? 'dark' : 'gold'}>{b}</Badge>)}
          </span>
          <span className="pcard__collection caps">{COLLECTION_LABEL[product.collection]}</span>
        </Link>
        <AnimatePresence>
          {hover && (
            <motion.button
              className="pcard__quick"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => { e.preventDefault(); quickAdd(product, defaultSize, 1, thumbRef.current); }}
            >
              Quick add · {defaultSize.label}
            </motion.button>
          )}
        </AnimatePresence>
      </TiltCard>
      <div className="pcard__body">
        <div className="pcard__row">
          <Link to={`/products/${product.slug}`} className="pcard__name">{product.name}</Link>
          <span className="pcard__price">{formatPrice(product.price)}</span>
        </div>
        <p className="pcard__tagline">{product.tagline}</p>
        <div className="pcard__meta">
          <Stars value={product.rating} size={12} />
          <span className="faint small">{product.rating.toFixed(1)} · {product.reviewCount} reviews</span>
        </div>
      </div>
    </motion.article>
  );
}
