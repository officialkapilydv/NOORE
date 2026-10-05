import { motion } from 'framer-motion';

const TIERS = [
  { key: 'top', label: 'Top', hint: 'The first breath · 0–15 min', width: 46 },
  { key: 'heart', label: 'Heart', hint: 'The character · 15 min–2 h', width: 72 },
  { key: 'base', label: 'Base', hint: 'The memory · 2 h onward', width: 100 },
];

/** The fragrance pyramid, drawn tier by tier as it scrolls into view. */
export function NotesPyramid({ notes, accent = '#c9a24a' }) {
  if (!notes) return null;
  return (
    <div className="pyramid" style={{ '--accent': accent }}>
      {TIERS.map((t, i) => (
        <motion.div
          key={t.key}
          className={`pyramid__tier pyramid__tier--${t.key}`}
          style={{ '--w': `${t.width}%` }}
          initial={{ opacity: 0, y: 24, scaleX: 0.6 }}
          whileInView={{ opacity: 1, y: 0, scaleX: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.9, delay: i * 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="pyramid__shape" aria-hidden="true" />
          <div className="pyramid__text">
            <span className="caps">{t.label}</span>
            <strong>{(notes[t.key] || []).join(' · ')}</strong>
            <span className="faint small">{t.hint}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
