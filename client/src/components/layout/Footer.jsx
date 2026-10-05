import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLenis } from 'lenis/react';
import { api } from '@/lib/api';
import { useUI } from '@/store/ui';
import { useSettings } from '@/store/settings';
import { FlameMark } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { SwapText } from '@/components/ui/Primitives';

const SOCIAL_LABELS = { instagram: 'Instagram', facebook: 'Facebook', pinterest: 'Pinterest', youtube: 'YouTube', x: 'X', whatsapp: 'WhatsApp' };

export function Footer() {
  const lenis = useLenis();
  const toast = useUI((s) => s.toast);
  const { settings, pages } = useSettings();
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const { brand, contact, social, legal, address } = settings;
  const policyLinks = pages.filter((p) => p.showInFooter);
  const tagWords = (brand.tagline || '').trim().split(' ');
  const tagLast = tagWords.pop();
  const socials = Object.entries(social || {}).filter(([, url]) => url);

  const subscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setState('loading');
    try {
      const res = await api.subscribe(email, 'footer');
      setState('done');
      toast(res.message, { type: 'success', duration: 4500 });
      setEmail('');
    } catch (err) {
      setState('idle');
      toast(err.message, { type: 'error' });
    }
  };

  const cols = [
    { title: 'Shop', links: [['All candles', '/shop'], ['Essentials', '/collections/essentials'], ['Premium', '/collections/premium'], ['Luxury', '/collections/luxury'], ['Gift sets', '/gifting']] },
    { title: 'House', links: [['Our story', '/story'], ['Corporate gifting', '/gifting#corporate'], ['Candle care', '/pages/candle-care'], ['Contact', '/contact'], ['FAQ', '/contact#faq']] },
    { title: 'Help', links: [['Track an order', '/account'], ...policyLinks.map((p) => [p.title, `/pages/${p.slug}`])] },
  ];

  return (
    <footer className="footer" data-theme="dark">
      <div className="footer__glow" aria-hidden="true" />
      <div className="container footer__top">
        <div className="footer__brand">
          <FlameMark size={34} className="gold" />
          <h3 className="footer__tag display">{tagWords.join(' ')} <em>{tagLast}</em></h3>
          <p className="muted">{brand.description}</p>
          <form className="footer__form" onSubmit={subscribe}>
            <label className="sr-only" htmlFor="footer-email">Email</label>
            <input id="footer-email" type="email" placeholder="Your email for 10% off" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" variant="gold" size="sm" loading={state === 'loading'} magnetic={false}>{state === 'done' ? 'Welcome ✦' : 'Join'}</Button>
          </form>
          <div className="footer__contact">
            <a href={`mailto:${contact.email}`} className="footer__link"><SwapText text={contact.email} /></a>
            <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="footer__link"><SwapText text={contact.phone} /></a>
            <p className="faint small">{address.line1}{address.line2 && `, ${address.line2}`}, {address.city} {address.postalCode} · {contact.hours}</p>
          </div>
        </div>
        <div className="footer__cols">
          {cols.map((col) => (
            <div key={col.title} className="footer__col">
              <p className="caps footer__col-title">{col.title}</p>
              <ul>
                {col.links.map(([label, to]) => (
                  <li key={label}><Link to={to} className="footer__link"><SwapText text={label} /></Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="footer__word" aria-hidden="true">
        <motion.span initial={{ y: '30%', opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>{brand.name}</motion.span>
      </div>

      <div className="container footer__bottom">
        <p className="faint">© {new Date().getFullYear()} {legal.company}{legal.footerNote ? ` · ${legal.footerNote}` : ''}{legal.gstin ? ` · GSTIN ${legal.gstin}` : ''}</p>
        <div className="footer__social">
          {socials.map(([key, url]) => <a key={key} href={url} target="_blank" rel="noreferrer" className="footer__link"><SwapText text={SOCIAL_LABELS[key] || key} /></a>)}
        </div>
        <button className="footer__top-btn" onClick={() => lenis?.scrollTo(0, { duration: 1.6 })} aria-label="Back to top">
          <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="20" fill="none" stroke="currentColor" strokeOpacity="0.25" /><motion.circle cx="22" cy="22" r="20" fill="none" stroke="currentColor" strokeDasharray="126" initial={{ strokeDashoffset: 126 }} whileInView={{ strokeDashoffset: 0 }} viewport={{ once: false }} transition={{ duration: 1.6 }} style={{ rotate: -90, transformOrigin: 'center' }} /><path d="M22 28V16m0 0l-5 5m5-5l5 5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </footer>
  );
}
