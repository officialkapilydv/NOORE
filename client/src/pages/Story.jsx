import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SplitText, Reveal } from '@/components/ui/Reveal';
import { Counter } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Newsletter } from '@/components/home/Newsletter';

const VALUES = [
  ['Light, not noise', 'A candle should change how a room feels without announcing itself. We compose for presence, not projection.'],
  ['Vessels worth keeping', 'Glass, stone and marble you will refill with pens, matches or flowers long after the last burn.'],
  ['Small batches, real people', 'Forty candles at a time, poured by a team of eleven in our studio. Every label is checked by hand.'],
  ['Honest materials', 'Plant waxes, cotton and wood wicks, phthalate-free oils. No paraffin, no dyes, no shortcuts.'],
];

const TIMELINE = [
  ['2021', 'A kitchen in Jaipur', 'Our founder pours the first Amber & Saffron in a borrowed pot, trying to recreate the smell of her grandmother\'s prayer room.'],
  ['2022', 'The first forty', 'A batch of forty sells out at a weekend market in two hours. The second batch is pre-sold before it cools.'],
  ['2023', 'Three tiers', 'Essentials, Premium and Luxury launch together — one philosophy, three expressions. The gifting studio opens.'],
  ['2025', 'Forty cities', 'NOORÉ candles burn in hotel lobbies, wedding mandaps and 40,000 homes across India.'],
];

export default function Story() {
  usePageTitle('Our story', 'The NOORÉ story — hand-poured fragrance candles made to make moments.');
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  return (
    <main className="story" data-theme="dark">
      <section ref={heroRef} className="story__hero">
        <motion.div className="story__hero-img" style={{ y: imgY, scale: imgScale, backgroundImage: 'url(/images/banners/hero-lifestyle.jpg)' }} />
        <div className="story__hero-shade" />
        <div className="story__hero-copy container">
          <p className="eyebrow">Our story</p>
          <h1 className="display"><SplitText text="Made to make" inView={false} delay={0.4} /> <em><SplitText text="moments." inView={false} delay={0.8} /></em></h1>
          <p className="lead">NOORÉ means light. We make candles for the quiet rituals and the loud celebrations — the first coffee, the last dance, and all the ordinary evenings in between.</p>
        </div>
      </section>

      <section className="section" data-theme="cream">
        <div className="container story__letter">
          <Reveal>
            <p className="eyebrow">A letter from the founder</p>
            <h2 className="display">We started with a <em>smell we couldn't buy.</em></h2>
          </Reveal>
          <Reveal delay={0.1} className="story__letter-body">
            <p>My grandmother's prayer room smelled of sandalwood, saffron and the ghee lamp she lit before dawn. When she passed, I went looking for that smell in shops and found candles that were either synthetic and loud or precious and faint. Nothing in between. Nothing that smelled like <em>here</em>.</p>
            <p>So I learned to pour. The first batches were terrible — tunnelling wax, soot, a saffron that smelled of hay. The fortieth was Amber & Saffron, more or less as you can buy it today. I lit it in my kitchen and cried, which I think is the right response to a good candle.</p>
            <p>Three years on, we are eleven people and three collections. The philosophy hasn't moved: fine materials, small batches, vessels you keep, and fragrances that belong to the places we actually live. Thank you for letting us into your rooms.</p>
            <p className="story__sign display">— Noor Khanna, founder</p>
          </Reveal>
        </div>
      </section>

      <section className="section" data-theme="dark">
        <div className="container">
          <div className="sec-head">
            <p className="eyebrow">What we believe</p>
            <h2 className="display">Four <em>principles</em></h2>
          </div>
          <div className="values">
            {VALUES.map(([t, d], i) => (
              <motion.div key={t} className="value" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: i * 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
                <span className="value__n display">0{i + 1}</span>
                <h3>{t}</h3>
                <p className="muted">{d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" data-theme="amber">
        <div className="container">
          <div className="sec-head">
            <p className="eyebrow">The journey</p>
            <h2 className="display">From one pot <em>to forty cities</em></h2>
          </div>
          <ol className="timeline">
            {TIMELINE.map(([year, title, text], i) => (
              <motion.li key={year} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: i * 0.1, duration: 0.8 }}>
                <span className="timeline__year display">{year}</span>
                <span className="timeline__dot" />
                <div><h3>{title}</h3><p className="muted">{text}</p></div>
              </motion.li>
            ))}
          </ol>
          <div className="craft__stats">
            {[[40000, '+', 'Homes lit'], [11, '', 'People in the studio'], [40, '', 'Candles per batch'], [21, '', 'Fragrances']].map(([v, s, l]) => (
              <div key={l} className="stat"><span className="stat__value display"><Counter to={v} suffix={s} /></span><span className="stat__label caps">{l}</span></div>
            ))}
          </div>
          <div className="center" style={{ marginTop: 56 }}>
            <Button to="/shop" variant="gold" size="lg" arrow>Find your fragrance</Button>
          </div>
        </div>
      </section>
      <Newsletter />
    </main>
  );
}
