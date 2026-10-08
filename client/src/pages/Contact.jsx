import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLenis } from 'lenis/react';
import { api } from '@/lib/api';
import { useUI } from '@/store/ui';
import { useSettings } from '@/store/settings';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/Button';
import { SplitText } from '@/components/ui/Reveal';
import { Accordion, Field } from '@/components/ui/Primitives';
import { FlameMark } from '@/components/ui/Logo';

export default function Contact() {
  usePageTitle('Contact', 'Get in touch with NOORÉ — orders, products, gifting and press.');
  const toast = useUI((s) => s.toast);
  const { contact, address, faq } = useSettings((s) => s.settings);
  const { hash } = useLocation();
  const lenis = useLenis();
  const [form, setForm] = useState({ name: '', email: '', topic: 'order', message: '' });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle');

  useEffect(() => {
    if (hash && lenis) setTimeout(() => lenis.scrollTo(hash, { offset: -100, duration: 1.4 }), 700);
  }, [hash, lenis]);

  const submit = async (e) => {
    e.preventDefault();
    setState('loading');
    setErrors({});
    try {
      const res = await api.contact(form);
      setState('done');
      toast(res.message, { type: 'success', duration: 5000 });
    } catch (err) {
      setState('idle');
      if (err.payload?.issues) setErrors(Object.fromEntries(err.payload.issues.map((i) => [i.path, i.message])));
      else toast(err.message, { type: 'error' });
    }
  };

  const faqItems = (faq || []).map((f) => ({ title: f.q, content: <p className="muted">{f.a}</p> }));
  const mapQuery = encodeURIComponent([address.line1, address.city, address.state, address.postalCode].filter(Boolean).join(', '));

  return (
    <main className="contact" data-theme="dark">
      <header className="page-hero container">
        <p className="eyebrow">Contact</p>
        <h1 className="display"><SplitText text="We'd love to" /> <em><SplitText text="hear from you." delay={0.3} /></em></h1>
        <p className="lead">Questions about an order, a fragrance, a wedding or a thousand corporate boxes. {contact.supportNote}</p>
      </header>

      <section className="section section--tight">
        <div className="container grid-2 contact__grid">
          <AnimatePresence mode="wait">
            {state === 'done' ? (
              <motion.div key="done" className="form-card form-card--done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                <FlameMark size={44} animate className="gold" />
                <h3 className="display">Message received.</h3>
                <p className="muted">Thank you, {form.name.split(' ')[0]}. We'll reply to {form.email} within one working day.</p>
                <Button variant="ghost" onClick={() => { setState('idle'); setForm({ name: '', email: '', topic: 'order', message: '' }); }} magnetic={false}>Send another</Button>
              </motion.div>
            ) : (
              <motion.form key="form" className="form-card" onSubmit={submit} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3 }}>
                <div className="form-grid">
                  <Field label="Your name" name="name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
                  <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
                  <label className="field span-2" htmlFor="topic">
                    <span className="field__label">Topic</span>
                    <div className="select">
                      <select id="topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
                        <option value="order">An order</option>
                        <option value="product">A product or fragrance</option>
                        <option value="gifting">Gifting & weddings</option>
                        <option value="wholesale">Wholesale & hotels</option>
                        <option value="press">Press</option>
                        <option value="other">Something else</option>
                      </select>
                    </div>
                  </label>
                  <Field label="Message" name="message" as="textarea" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} error={errors.message} className="span-2" />
                </div>
                <Button type="submit" variant="gold" size="lg" loading={state === 'loading'} magnetic={false} arrow>Send message</Button>
              </motion.form>
            )}
          </AnimatePresence>

          <motion.div className="contact__details" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.5 }}>
            <div className="contact__block">
              <p className="caps faint">Write</p>
              <a href={`mailto:${contact.email}`} className="contact__big">{contact.email}</a>
            </div>
            <div className="contact__block">
              <p className="caps faint">Call or WhatsApp</p>
              <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="contact__big">{contact.phone}</a>
              <p className="muted">{contact.hours}</p>
            </div>
            <div className="contact__block">
              <p className="caps faint">{address.label || 'The studio'}</p>
              <p className="contact__big">{address.line1}{address.line2 && <><br />{address.line2}</>}<br />{address.city} {address.postalCode}, {address.state}</p>
              <p className="muted">{address.note}</p>
              <a className="link small" href={address.mapUrl || `https://maps.google.com/?q=${mapQuery}`} target="_blank" rel="noreferrer">Open in maps →</a>
            </div>
          </motion.div>
        </div>
      </section>

      {faqItems.length > 0 && (
        <section className="section" data-theme="cream" id="faq">
          <div className="container contact__faq">
            <div>
              <p className="eyebrow">Candle care & FAQ</p>
              <h2 className="display">Burning <em>questions</em></h2>
              <p className="lead">Everything we're asked most often, from first burns to refills.</p>
            </div>
            <Accordion items={faqItems} defaultOpen={0} />
          </div>
        </section>
      )}
    </main>
  );
}
