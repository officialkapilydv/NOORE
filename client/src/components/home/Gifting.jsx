import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { SplitText } from '@/components/ui/Reveal';

function ParallaxCard({ image, eyebrow, title, text, cta, to, align = 'left', dark = true }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-12%', '12%']);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1.05, 1.15]);
  return (
    <motion.div ref={ref} className={`gcard gcard--${align} ${dark ? 'gcard--dark' : ''}`} initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
      <motion.span className="gcard__img" style={{ backgroundImage: `url(${image})`, y, scale }} aria-hidden="true" />
      <span className="gcard__shade" aria-hidden="true" />
      <div className="gcard__text">
        <p className="eyebrow">{eyebrow}</p>
        <h3 className="display">{title}</h3>
        <p className="lead">{text}</p>
        <Button to={to} variant={dark ? 'gold' : 'dark'} arrow>{cta}</Button>
      </div>
    </motion.div>
  );
}

export function GiftingBanner() {
  return (
    <section className="section gifting-home" data-theme="amber">
      <div className="container">
        <div className="gifting-home__head">
          <p className="eyebrow">Gifting</p>
          <h2 className="display"><SplitText text="Thoughtful gifts for" /> <em><SplitText text="every occasion." delay={0.25} /></em></h2>
        </div>
        <div className="gifting-home__grid">
          <ParallaxCard image="/images/banners/gifting.jpg" eyebrow="Gift sets" title={<>Ribboned, boxed, <em>remembered</em></>} text="Curated trios and duos in linen-textured boxes with a hand-written note. From ₹2,499." cta="View gifting" to="/gifting" />
          <ParallaxCard image="/images/banners/corporate.jpg" eyebrow="Corporate gifting" title={<>For your team <em>& clients</em></>} text="Custom labels, engraved lids and volume pricing from ten pieces. Proposals within 48 hours." cta="Enquire now" to="/gifting#corporate" align="right" />
        </div>
      </div>
    </section>
  );
}
