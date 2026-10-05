import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUI } from '@/store/ui';
import { FlameMark } from '@/components/ui/Logo';
import { useFontsReady } from '@/hooks/useFonts';

const LETTERS = ['N', 'O', 'O', 'R', 'É'];

/**
 * Opening sequence: the flame draws itself, the wordmark rises letter by letter,
 * a counter climbs to 100 and the curtain parts to reveal the hero.
 * Runs once per session.
 */
export function Preloader() {
  const done = useUI((s) => s.preloaderDone);
  const finish = useUI((s) => s.finishPreloader);
  const fontsReady = useFontsReady();
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (done) return;
    let raf;
    const start = performance.now();
    const minDuration = 2300;
    const tick = (t) => {
      const elapsed = t - start;
      const base = Math.min(1, elapsed / minDuration);
      // slow near the end until fonts are ready, then snap to 100
      const cap = fontsReady ? 1 : 0.92;
      const eased = 1 - Math.pow(1 - base, 3);
      setProgress(Math.round(Math.min(cap, eased) * 100));
      if (base >= 1 && fontsReady) {
        setLeaving(true);
        setTimeout(finish, 1100);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [done, fontsReady, finish]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div className="preloader" aria-hidden="true" exit={{ opacity: 0, transition: { duration: 0.01 } }}>
          <motion.div className="preloader__panel preloader__panel--left" animate={leaving ? { x: '-100%' } : { x: 0 }} transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }} />
          <motion.div className="preloader__panel preloader__panel--right" animate={leaving ? { x: '100%' } : { x: 0 }} transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }} />
          <motion.div className="preloader__content" animate={leaving ? { opacity: 0, scale: 0.96, filter: 'blur(10px)' } : { opacity: 1 }} transition={{ duration: 0.6 }}>
            <div className="preloader__flame">
              <FlameMark size={46} animate />
              <motion.span className="preloader__glow" animate={{ opacity: [0.3, 0.8, 0.4], scale: [1, 1.25, 1.05] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
            </div>
            <h1 className="preloader__word">
              {LETTERS.map((l, i) => (
                <span className="split__mask" key={i}>
                  <motion.span className="split__item" initial={{ y: '110%' }} animate={{ y: '0%' }} transition={{ delay: 0.5 + i * 0.08, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}>{l}</motion.span>
                </span>
              ))}
            </h1>
            <motion.p className="preloader__tag caps" initial={{ opacity: 0, letterSpacing: '0.1em' }} animate={{ opacity: 1, letterSpacing: '0.42em' }} transition={{ delay: 1.1, duration: 1.4 }}>Made to make moments</motion.p>
            <div className="preloader__bar"><motion.span style={{ scaleX: progress / 100 }} /></div>
            <span className="preloader__count">{String(progress).padStart(3, '0')}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
