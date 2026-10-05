import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useUI } from '@/store/ui';
import { Button } from '@/components/ui/Button';
import { Field, Stars } from '@/components/ui/Primitives';

const SEED = [
  { id: 's1', name: 'Ananya R.', rating: 5, title: 'The whole flat smells like a hotel lobby', body: 'Lit it for a dinner party and three people asked where it was from. Throw is strong but never headache-y, and the vessel is now a pen holder.', createdAt: '2026-08-12T10:00:00Z', verified: true },
  { id: 's2', name: 'Karan M.', rating: 5, title: 'Gifted, then bought my own', body: 'Received as a Diwali gift and ordered two more the same week. The wooden wick crackle is unreasonably relaxing.', createdAt: '2026-07-03T10:00:00Z', verified: true },
  { id: 's3', name: 'Priya S.', rating: 4, title: 'Beautiful, slow burn', body: 'Takes a little while to fill a large room, but once it does it lingers for hours after. Packaging is genuinely luxurious.', createdAt: '2026-06-21T10:00:00Z', verified: false },
];

export function Reviews({ product, initial = [] }) {
  const toast = useUI((s) => s.toast);
  const [reviews, setReviews] = useState([...initial, ...SEED]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', rating: 5, title: '', body: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Please add your name.';
    if (form.title.trim().length < 2) errs.title = 'Give your review a title.';
    if (form.body.trim().length < 10) errs.body = 'Tell us a little more.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const saved = await api.addReview(product.slug, form);
      setReviews((r) => [saved, ...r]);
      setForm({ name: '', rating: 5, title: '', body: '' });
      setOpen(false);
      toast('Thank you — your review is live.', { type: 'success' });
    } catch (err) {
      toast(err.message, { type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : product.rating;

  return (
    <section className="reviews">
      <div className="reviews__head">
        <div>
          <p className="eyebrow">Reviews</p>
          <h2 className="display">What people <em>say</em></h2>
        </div>
        <div className="reviews__score">
          <span className="reviews__avg">{avg.toFixed(1)}</span>
          <div><Stars value={avg} size={16} /><span className="faint small">{product.reviewCount + reviews.length - SEED.length} reviews</span></div>
          <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>{open ? 'Cancel' : 'Write a review'}</Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.form className="reviews__form" onSubmit={submit} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}>
            <div className="reviews__form-grid">
              <Field label="Your name" name="rv-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
              <div className="field">
                <span className="field__label">Rating</span>
                <div className="rating-pick">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" className={n <= form.rating ? 'is-on' : ''} onClick={() => setForm({ ...form, rating: n })} aria-label={`${n} stars`}>★</button>
                  ))}
                </div>
              </div>
              <Field label="Title" name="rv-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={errors.title} className="span-2" />
              <Field label="Your review" name="rv-body" as="textarea" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} error={errors.body} className="span-2" />
            </div>
            <Button type="submit" variant="gold" loading={busy} magnetic={false}>Publish review</Button>
          </motion.form>
        )}
      </AnimatePresence>

      <ul className="reviews__list">
        {reviews.map((r, i) => (
          <motion.li key={r.id} className="review" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: (i % 3) * 0.08 }}>
            <div className="review__head">
              <Stars value={r.rating} size={13} />
              <span className="faint small">{formatDate(r.createdAt)}</span>
            </div>
            <h4 className="review__title">{r.title}</h4>
            <p className="muted">{r.body}</p>
            <p className="review__by small">— {r.name}{r.verified && <span className="review__verified">✦ Verified purchase</span>}</p>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
