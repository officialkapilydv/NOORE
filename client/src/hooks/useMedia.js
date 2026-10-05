import { useEffect, useState } from 'react';

export function useMedia(query, initial = false) {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : initial));
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export const useIsMobile = () => useMedia('(max-width: 768px)');
export const useIsTouch = () => useMedia('(hover: none), (pointer: coarse)');
export const usePrefersReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)');

/** Rough GPU budget: low-end devices skip transmission/reflections/bloom. */
export function useQualityTier() {
  const isMobile = useIsMobile();
  const [tier, setTier] = useState('high');
  useEffect(() => {
    // Manual override: ?quality=low|medium|high (persisted for the session)
    try {
      const forced = new URLSearchParams(location.search).get('quality');
      if (forced && ['low', 'medium', 'high'].includes(forced)) sessionStorage.setItem('noore.quality', forced);
      const stored = sessionStorage.getItem('noore.quality');
      if (stored) return setTier(stored);
    } catch { /* ignore */ }
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 8;
    if (isMobile || cores <= 4 || mem <= 4) setTier('medium');
    if (isMobile && (cores <= 4 || mem <= 3)) setTier('low');
  }, [isMobile]);
  return tier;
}
