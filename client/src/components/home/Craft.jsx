import { motion } from 'framer-motion';
import { Counter, SectionHeading } from '@/components/ui/Primitives';

const STEPS = [
  { n: '01', title: 'Soy–coconut wax', text: 'A clean-burning plant blend that holds more fragrance and throws it further, with no soot and no paraffin.', icon: 'M12 3c3 5 7 8 7 13a7 7 0 0 1-14 0c0-5 4-8 7-13z' },
  { n: '02', title: 'Fine fragrance oils', text: 'Composed with perfumers, built on natural absolutes and phthalate-free aroma molecules. Loaded at 10–12%.', icon: 'M8 3h8M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3' },
  { n: '03', title: 'Cotton & wood wicks', text: 'Lead-free cotton for an even pool; crackling wooden wicks in Luxury for a fireside hush.', icon: 'M12 21V9M12 9c-2-2-2-5 0-6 2 1 2 4 0 6zM8 21h8' },
  { n: '04', title: 'Hand-poured, rested', text: 'Poured in batches of forty, then cured for two weeks so the scent settles before it reaches you.', icon: 'M4 14c2-3 5-3 8 0s6 3 8 0M4 18c2-3 5-3 8 0s6 3 8 0M12 3v6' },
];

const STATS = [
  { value: 45, suffix: 'h+', label: 'Burn time, Classic size' },
  { value: 100, suffix: '%', label: 'Vegan & cruelty-free' },
  { value: 21, suffix: '', label: 'Fragrances across 3 tiers' },
  { value: 14, suffix: ' days', label: 'Cured before shipping' },
];

export function Craft() {
  return (
    <section className="section craft" data-theme="cream">
      <div className="container">
        <SectionHeading eyebrow="The NOORÉ craft" title={<>Made slowly, <em>on purpose</em></>} lead="A candle is a simple thing done carefully. Four decisions make the difference between a scent that fills a room and one that merely sits in it." />
        <div className="craft__grid">
          {STEPS.map((s, i) => (
            <motion.article key={s.n} className="craft__card" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.9, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}>
              <span className="craft__n display">{s.n}</span>
              <svg className="craft__icon" width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <motion.path d={s.icon} stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, delay: 0.3 + i * 0.1, ease: 'easeInOut' }} />
              </svg>
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
              <span className="craft__line" />
            </motion.article>
          ))}
        </div>
        <div className="craft__stats">
          {STATS.map((s, i) => (
            <motion.div key={s.label} className="stat" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.1 }}>
              <span className="stat__value display"><Counter to={s.value} suffix={s.suffix} /></span>
              <span className="stat__label caps">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
