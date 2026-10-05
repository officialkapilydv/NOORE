import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { FlameMark } from '@/components/ui/Logo';

const BURST = Array.from({ length: 22 }).map((_, i) => ({ id: i, angle: (i / 22) * Math.PI * 2, dist: 90 + (i % 5) * 28, size: 4 + (i % 3) * 3 }));

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setState('loading');
    try {
      const res = await api.subscribe(email, 'home');
      setMessage(res.message);
      setState('done');
    } catch (err) {
      setMessage(err.message);
      setState('error');
    }
  };

  return (
    <section className="section newsletter" data-theme="cream">
      <div className="container newsletter__inner">
        <motion.div className="newsletter__mark" initial={{ scale: 0.6, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
          <FlameMark size={40} animate />
          <AnimatePresence>
            {state === 'done' && BURST.map((b) => (
              <motion.span key={b.id} className="burst" style={{ width: b.size, height: b.size }} initial={{ x: 0, y: 0, opacity: 1, scale: 0 }} animate={{ x: Math.cos(b.angle) * b.dist, y: Math.sin(b.angle) * b.dist, opacity: 0, scale: 1.4 }} transition={{ duration: 1.3, ease: 'easeOut' }} />
            ))}
          </AnimatePresence>
        </motion.div>
        <h2 className="display">Light arrives <em>first</em> by letter</h2>
        <p className="lead">New fragrances, early access to limited pours and 10% off your first order. One email a month, written by a human.</p>
        <AnimatePresence mode="wait">
          {state === 'done' ? (
            <motion.p key="done" className="newsletter__done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>✦ {message}</motion.p>
          ) : (
            <motion.form key="form" className="newsletter__form" onSubmit={submit} exit={{ opacity: 0, y: -10 }}>
              <input type="email" required placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address" />
              <Button type="submit" variant="dark" loading={state === 'loading'} magnetic={false} arrow>Subscribe</Button>
              {state === 'error' && <span className="newsletter__error">{message}</span>}
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
