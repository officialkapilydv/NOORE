import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { useUI } from '@/store/ui';
import { useIsTouch, usePrefersReducedMotion } from '@/hooks/useMedia';

/**
 * Custom cursor: a tiny gold dot that tracks instantly and a soft ring that lags
 * with a spring. Interactive elements enlarge the ring; elements with `data-cursor`
 * show a label ("View", "Drag", "Light").
 */
export function CustomCursor() {
  const isTouch = useIsTouch();
  const reduce = usePrefersReducedMotion();
  const cursor = useUI((s) => s.cursor);
  const setCursor = useUI((s) => s.setCursor);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 320, damping: 30, mass: 0.5 });
  const ry = useSpring(y, { stiffness: 320, damping: 30, mass: 0.5 });
  const visible = useRef(false);

  useEffect(() => {
    if (isTouch || reduce) return;
    document.body.classList.add('has-custom-cursor');
    const onMove = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!visible.current) { visible.current = true; document.body.classList.add('cursor-visible'); }
      const target = e.target.closest('[data-cursor], a, button, input, textarea, select, label, [role="button"]');
      if (!target) { if (cursor.variant !== 'default') setCursor('default'); return; }
      const labelled = e.target.closest('[data-cursor]');
      if (labelled) {
        const v = labelled.dataset.cursor;
        const label = labelled.dataset.cursorLabel || '';
        if (cursor.variant !== v || cursor.label !== label) setCursor(v, label);
      } else if (target.matches('input, textarea, select')) {
        if (cursor.variant !== 'text') setCursor('text');
      } else if (cursor.variant !== 'hover') setCursor('hover');
    };
    const onLeave = () => { visible.current = false; document.body.classList.remove('cursor-visible'); };
    const onDown = () => document.body.classList.add('cursor-down');
    const onUp = () => document.body.classList.remove('cursor-down');
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      document.body.classList.remove('has-custom-cursor', 'cursor-visible');
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isTouch, reduce, cursor.variant, cursor.label, setCursor, x, y]);

  if (isTouch || reduce) return null;

  return (
    <>
      <motion.div className="cursor-dot" style={{ x, y }} aria-hidden="true" />
      <motion.div className={`cursor-ring is-${cursor.variant}`} style={{ x: rx, y: ry }} aria-hidden="true">
        <AnimatePresence>
          {cursor.label && (
            <motion.span className="cursor-ring__label" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.25 }}>
              {cursor.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
