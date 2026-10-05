import { useEffect } from 'react';
import { ReactLenis, useLenis } from 'lenis/react';
import { useLocation } from 'react-router-dom';
import { usePrefersReducedMotion } from '@/hooks/useMedia';
import { useCart } from '@/store/cart';
import { useUI } from '@/store/ui';
import 'lenis/dist/lenis.css';

/** Lenis smooth scrolling + route-change scroll reset + scroll lock for overlays. */
export function SmoothScroll({ children }) {
  const reduce = usePrefersReducedMotion();
  return (
    <ReactLenis root options={{ lerp: reduce ? 1 : 0.085, duration: 1.2, smoothWheel: !reduce, wheelMultiplier: 0.95, touchMultiplier: 1.4 }}>
      <ScrollController />
      {children}
    </ReactLenis>
  );
}

function ScrollController() {
  const lenis = useLenis();
  const { pathname } = useLocation();
  const cartOpen = useCart((s) => s.isOpen);
  const menuOpen = useUI((s) => s.menuOpen);
  const searchOpen = useUI((s) => s.searchOpen);
  const preloaderDone = useUI((s) => s.preloaderDone);

  useEffect(() => {
    if (!lenis) return;
    // Give the page-transition curtain a beat before jumping to the top.
    const t = setTimeout(() => lenis.scrollTo(0, { immediate: true, force: true }), 420);
    return () => clearTimeout(t);
  }, [pathname, lenis]);

  useEffect(() => {
    if (!lenis) return;
    const locked = cartOpen || menuOpen || searchOpen || !preloaderDone;
    if (locked) lenis.stop(); else lenis.start();
    document.documentElement.classList.toggle('is-locked', locked);
  }, [lenis, cartOpen, menuOpen, searchOpen, preloaderDone]);

  return null;
}
