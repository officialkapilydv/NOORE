import { lazy, Suspense, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { SplitText } from '@/components/ui/Reveal';
import { useUI } from '@/store/ui';
import { CandleThumb } from '@/components/shop/CandleThumb';
import { useMedia } from '@/hooks/useMedia';
import { useSettings } from '@/store/settings';

const loadHeroScene = () => import('@/components/three/HeroScene');
const HeroScene = lazy(() => loadHeroScene().then((m) => ({ default: m.HeroScene })));

const HERO_VESSEL = { type: 'glass', color: '#d98a3a', wax: '#f4dfb7', lid: 'gold', labelBg: '#f6ead3', labelText: '#4a2a10', accent: '#d9b162', glow: '#ffb15c' };

export function Hero() {
  const ref = useRef(null);
  const ready = useUI((s) => s.preloaderDone);
  const narrow = useMedia('(max-width: 960px)');
  const home = useSettings((s) => s.settings.home);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  // Fetch three.js while the intro plays, so the scene is ready the moment the curtain parts.
  useEffect(() => { loadHeroScene().catch(() => {}); }, []);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <section ref={ref} className="hero" aria-label="Introduction">
      <div className="hero__scene">
        <Suspense fallback={<div className="scene__fallback"><CandleThumb vessel={HERO_VESSEL} size={240} lit /></div>}>
          {ready && <HeroScene scroll={scrollYProgress} shift={narrow ? 0 : -1.25} narrow={narrow} />}
        </Suspense>
        <div className="hero__vignette" aria-hidden="true" />
      </div>

      <motion.div className="hero__content container--wide" style={{ y: textY, opacity: textOpacity }}>
        <motion.p className="eyebrow" initial={{ opacity: 0, x: -20 }} animate={ready ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.4, duration: 1 }}>
          {home.eyebrow}
        </motion.p>
        <h1 className="hero__title display">
          {ready && (
            <>
              <SplitText text={home.title} inView={false} delay={0.55} stagger={0.08} />
              <br />
              <SplitText text={home.titleItalic} inView={false} delay={0.95} className="italic gold-text" />
            </>
          )}
        </h1>
        <motion.p className="hero__lead lead" initial={{ opacity: 0, y: 20 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.4, duration: 1 }}>
          {home.lead}
        </motion.p>
        <motion.div className="hero__cta" initial={{ opacity: 0, y: 20 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.65, duration: 1 }}>
          <Button to="/shop" variant="gold" size="lg" arrow>{home.primaryCta}</Button>
          <Button to="/gifting" variant="ghost" size="lg">{home.secondaryCta}</Button>
        </motion.div>
        <motion.ul className="hero__facts" initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : {}} transition={{ delay: 2, duration: 1 }}>
          <li><strong>45h+</strong><span>clean burn</span></li>
          <li><strong>100%</strong><span>vegan wax</span></li>
          <li><strong>21</strong><span>fragrances</span></li>
        </motion.ul>
      </motion.div>

      <motion.div className="hero__hint" style={{ opacity: hintOpacity }} initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : {}} transition={{ delay: 2.4 }}>
        <span className="caps">Scroll</span>
        <span className="hero__hint-line"><motion.span animate={{ y: ['-100%', '100%'] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} /></span>
      </motion.div>

      <motion.div className="hero__side caps" initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : {}} transition={{ delay: 2.2 }}>
        Home · Gifting · Occasions
      </motion.div>
    </section>
  );
}
