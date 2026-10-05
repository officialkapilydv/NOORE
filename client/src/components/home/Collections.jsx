import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCollections } from '@/hooks/useCatalog';
import { formatPrice } from '@/lib/format';
import { SectionHeading, TiltCard } from '@/components/ui/Primitives';
import { CandleThumb } from '@/components/shop/CandleThumb';

const TONE = {
  essentials: { bg: 'linear-gradient(160deg, #f3e9dc 0%, #e4d2bb 60%, #d8c2a4 100%)', fg: '#2b1c15', accent: '#8d6f2a' },
  premium: { bg: 'linear-gradient(160deg, #5a3a22 0%, #2f1c12 55%, #1a100b 100%)', fg: '#f6efe4', accent: '#e8cf8a' },
  luxury: { bg: 'linear-gradient(160deg, #1b1512 0%, #0f0a08 60%, #060403 100%)', fg: '#f6efe4', accent: '#d7b56d' },
};

export function CollectionsShowcase() {
  const { data } = useCollections();
  const items = (data?.items || []).filter((c) => c.slug !== 'gifting');

  return (
    <section className="section collections" data-theme="dark">
      <div className="container">
        <SectionHeading eyebrow="The collections" title={<>Three tiers of <em>light</em></>} lead="From the pastel glass of the Essentials to the marble and brass of Luxury, every NOORÉ candle is poured by hand with the same wax, the same wicks and the same obsession." />
        <div className="collections__grid">
          {items.map((c, i) => {
            const tone = TONE[c.slug] || TONE.premium;
            return (
              <motion.div key={c.slug} initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 1, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}>
                <TiltCard className="ccard" max={8} style={{ '--card-bg': tone.bg, '--card-fg': tone.fg, '--card-accent': tone.accent }}>
                  <Link to={`/collections/${c.slug}`} className="ccard__inner" data-cursor="view" data-cursor-label="Discover">
                    <span className="ccard__img" style={{ backgroundImage: `url(${c.image})` }} aria-hidden="true" />
                    <span className="ccard__num">0{i + 1}</span>
                    <span className="ccard__trio" aria-hidden="true">
                      {(c.preview || []).map((p, j) => (
                        <motion.span key={p.slug} className="ccard__candle" style={{ zIndex: j === 1 ? 2 : 1 }} whileHover={{ y: -8 }}>
                          <CandleThumb vessel={p.vessel} size={j === 1 ? 118 : 92} lit />
                        </motion.span>
                      ))}
                    </span>
                    <span className="ccard__text">
                      <span className="ccard__name display">{c.name}</span>
                      <span className="ccard__title">{c.title}</span>
                      <span className="ccard__foot">
                        <span className="caps">From {formatPrice(c.from)}</span>
                        <span className="ccard__arrow">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </span>
                      </span>
                    </span>
                  </Link>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
