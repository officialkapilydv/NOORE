import { useRef, useEffect } from 'react';
import { useIsTouch } from './useMedia';

/**
 * Magnetic hover: the element leans toward the pointer and springs back on leave.
 * Pure rAF + CSS transform — no re-renders.
 */
export function useMagnetic({ strength = 0.35, radius = 110, scale = 1.04 } = {}) {
  const ref = useRef(null);
  const isTouch = useIsTouch();

  useEffect(() => {
    const el = ref.current;
    if (!el || isTouch) return;
    let raf = 0;
    let target = { x: 0, y: 0, s: 1 };
    let current = { x: 0, y: 0, s: 1 };
    let active = false;

    const tick = () => {
      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;
      current.s += (target.s - current.s) * 0.18;
      el.style.transform = `translate3d(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px, 0) scale(${current.s.toFixed(3)})`;
      if (Math.abs(target.x - current.x) > 0.05 || Math.abs(target.y - current.y) > 0.05 || Math.abs(target.s - current.s) > 0.001 || active) {
        raf = requestAnimationFrame(tick);
      } else {
        el.style.transform = '';
        raf = 0;
      }
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < radius + Math.max(r.width, r.height) / 2) {
        active = true;
        target = { x: dx * strength, y: dy * strength, s: scale };
      } else if (active) {
        active = false;
        target = { x: 0, y: 0, s: 1 };
      }
      start();
    };
    const onLeave = () => { active = false; target = { x: 0, y: 0, s: 1 }; start(); };

    window.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength, radius, scale, isTouch]);

  return ref;
}
