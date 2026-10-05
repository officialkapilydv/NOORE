import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLenis } from 'lenis/react';
import { useProducts } from '@/hooks/useCatalog';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api, fallbackProducts } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/store/cart';
import { useUI } from '@/store/ui';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { CandleThumb } from '@/components/shop/CandleThumb';
import { Button } from '@/components/ui/Button';
import { SplitText } from '@/components/ui/Reveal';
import { Field, SectionHeading } from '@/components/ui/Primitives';
import { useSettings } from '@/store/settings';

const CandleRow = lazy(() => import('@/components/three/CandleRow').then((m) => ({ default: m.CandleRow })));

const BOX_PICKS = fallbackProducts.filter((p) => ['essentials', 'premium'].includes(p.collection));

export default function Gifting() {
  usePageTitle('Gifting', 'Curated gift sets and corporate gifting from NOORÉ.');
  const { data } = useProducts({ collection: 'gifting' });
  const sets = data?.items || [];
  const luxuryTrio = fallbackProducts.filter((p) => ['royal-oud', 'gulab-and-oud', 'orchid-noir'].includes(p.slug));
  const { hash } = useLocation();
  const lenis = useLenis();

  useEffect(() => {
    if (hash && lenis) setTimeout(() => lenis.scrollTo(hash, { offset: -80, duration: 1.4 }), 700);
  }, [hash, lenis]);

  return (
    <main className="gifting" data-theme="dark">
      <section className="collection__hero" style={{ background: '#160e0a' }}>
        <div className="collection__scene">
          <Suspense fallback={<div className="scene__fallback"><CandleThumb vessel={luxuryTrio[0].vessel} size={200} lit /></div>}>
            <CandleRow products={luxuryTrio} background="#160e0a" spread={2.1} />
          </Suspense>
        </div>
        <div className="collection__copy container--wide">
          <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>Gifting studio</motion.p>
          <h1 className="display"><SplitText text="Thoughtful gifts for" inView={false} delay={0.5} /> <em><SplitText text="every occasion." inView={false} delay={0.9} /></em></h1>
          <motion.p className="lead" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>Ribboned linen boxes, hand-written notes and candles people keep. Choose a curated set, build your own, or let our studio handle gifting for your whole team.</motion.p>
        </div>
      </section>

      <section className="section" data-theme="dark">
        <div className="container">
          <SectionHeading eyebrow="Curated sets" title={<>Boxed & <em>ready</em></>} lead="Each set arrives in our rigid linen-textured box with a satin ribbon, a gold-foiled card and, if you like, a few words in our calligrapher's hand." />
          <ProductGrid products={sets} columns={3} />
        </div>
      </section>

      <BoxBuilder />
      <Corporate />
    </main>
  );
}

function BoxBuilder() {
  const [picked, setPicked] = useState([]);
  const add = useCart((s) => s.add);
  const setCoupon = useCart((s) => s.setCoupon);
  const setGiftWrap = useCart((s) => s.setGiftWrap);
  const open = useCart((s) => s.open);
  const toast = useUI((s) => s.toast);
  const total = picked.reduce((n, p) => n + p.price, 0);
  const wrapFee = Number(useSettings((s) => s.settings.shipping?.giftWrap) ?? 149);
  const toggle = (p) => setPicked((list) => (list.find((x) => x.slug === p.slug) ? list.filter((x) => x.slug !== p.slug) : list.length < 3 ? [...list, p] : list));

  const addBox = () => {
    picked.forEach((p) => add(p, p.sizes.find((s) => s.id === 'classic') || p.sizes[0], 1));
    setCoupon('BOX10');
    setGiftWrap(true);
    toast('Your box is in the bag — BOX10 applied, gift wrap added.', { type: 'success', duration: 4500 });
    setTimeout(open, 600);
  };

  return (
    <section className="section builder" data-theme="cream" id="build">
      <div className="container">
        <SectionHeading eyebrow="Build your own box" title={<>Three candles, <em>your way</em></>} lead="Pick any three from Essentials and Premium. We box them together, add gift wrap and take 10% off the trio." />
        <div className="builder__layout">
          <div className="builder__picks">
            {BOX_PICKS.map((p, i) => {
              const on = picked.some((x) => x.slug === p.slug);
              return (
                <motion.button key={p.slug} className={`pick ${on ? 'is-on' : ''}`} onClick={() => toggle(p)} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 6) * 0.05, duration: 0.6 }} whileTap={{ scale: 0.97 }} aria-pressed={on}>
                  <CandleThumb vessel={p.vessel} size={64} lit={on} />
                  <span className="pick__name">{p.name}</span>
                  <span className="pick__price small faint">{formatPrice(p.price)}</span>
                  <AnimatePresence>{on && <motion.span className="pick__check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>✓</motion.span>}</AnimatePresence>
                </motion.button>
              );
            })}
          </div>
          <aside className="builder__box">
            <p className="caps faint">Your box</p>
            <div className="builder__slots">
              {[0, 1, 2].map((i) => (
                <motion.div key={i} className={`slot ${picked[i] ? 'is-filled' : ''}`} layout>
                  {picked[i] ? <CandleThumb vessel={picked[i].vessel} size={72} lit /> : <span className="slot__n">{i + 1}</span>}
                </motion.div>
              ))}
            </div>
            <div className="builder__totals">
              <div><span className="muted">Candles</span><span>{formatPrice(total)}</span></div>
              <div><span className="muted">Box discount (10%)</span><span>− {formatPrice(Math.round(total * 0.1))}</span></div>
              <div><span className="muted">Gift wrap</span><span>{formatPrice(wrapFee)}</span></div>
              <div className="builder__grand"><span>Total</span><span>{formatPrice(picked.length === 3 ? total - Math.round(total * 0.1) + wrapFee : 0)}</span></div>
            </div>
            <Button variant="dark" size="lg" disabled={picked.length < 3} onClick={addBox} magnetic={false} arrow>{picked.length < 3 ? `Pick ${3 - picked.length} more` : 'Add box to bag'}</Button>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Corporate() {
  const toast = useUI((s) => s.toast);
  const [form, setForm] = useState({ company: '', name: '', email: '', phone: '', quantity: 50, budgetPerGift: 1500, occasion: 'Diwali', deliveryBy: '', branding: true, message: '' });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setState('loading');
    setErrors({});
    try {
      const res = await api.giftingEnquiry({ ...form, quantity: Number(form.quantity), budgetPerGift: Number(form.budgetPerGift) || undefined });
      setState('done');
      toast(res.message, { type: 'success', duration: 5000 });
    } catch (err) {
      setState('idle');
      if (err.payload?.issues) setErrors(Object.fromEntries(err.payload.issues.map((i) => [i.path, i.message])));
      else toast(err.message, { type: 'error' });
    }
  };

  const PERKS = [['Custom labels', 'Your logo or a message printed on every label.'], ['Engraved lids', 'Brass lids engraved with initials or a date.'], ['Volume pricing', 'From 10 pieces; tiered discounts at 50, 100 and 500.'], ['Nationwide delivery', 'Individually addressed, delivered across India.']];

  return (
    <section className="section corporate" data-theme="amber" id="corporate">
      <div className="container grid-2">
        <div>
          <p className="eyebrow">Corporate gifting</p>
          <h2 className="display">Customised gifts for your <em>team & clients</em></h2>
          <p className="lead">From a dozen boxes for the board to a thousand for the whole company. Tell us the occasion and the budget; we send a proposal with samples within 48 hours.</p>
          <ul className="perks">
            {PERKS.map(([t, d], i) => (
              <motion.li key={t} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.7 }}>
                <span className="perks__n">0{i + 1}</span>
                <div><strong>{t}</strong><p className="muted">{d}</p></div>
              </motion.li>
            ))}
          </ul>
        </div>
        <AnimatePresence mode="wait">
          {state === 'done' ? (
            <motion.div key="done" className="form-card form-card--done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
              <CandleThumb vessel={fallbackProducts[12].vessel} size={120} lit />
              <h3 className="display">Thank you, {form.name.split(' ')[0]}.</h3>
              <p className="muted">Our gifting studio will be in touch at {form.email} within 48 hours with a proposal and sample options.</p>
            </motion.div>
          ) : (
            <motion.form key="form" className="form-card" onSubmit={submit} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }}>
              <div className="form-grid">
                <Field label="Company" name="company" value={form.company} onChange={set('company')} error={errors.company} />
                <Field label="Your name" name="name" value={form.name} onChange={set('name')} error={errors.name} />
                <Field label="Work email" name="email" type="email" value={form.email} onChange={set('email')} error={errors.email} />
                <Field label="Phone" name="phone" value={form.phone} onChange={set('phone')} error={errors.phone} />
                <Field label="Quantity" name="quantity" type="number" min={10} value={form.quantity} onChange={set('quantity')} error={errors.quantity} hint="Minimum 10 pieces" />
                <Field label="Budget per gift (₹)" name="budgetPerGift" type="number" min={500} step={100} value={form.budgetPerGift} onChange={set('budgetPerGift')} error={errors.budgetPerGift} />
                <Field label="Occasion" name="occasion" value={form.occasion} onChange={set('occasion')} />
                <Field label="Needed by" name="deliveryBy" type="date" value={form.deliveryBy} onChange={set('deliveryBy')} />
                <Field label="Anything else?" name="message" as="textarea" rows={3} value={form.message} onChange={set('message')} className="span-2" />
                <label className="check span-2"><input type="checkbox" checked={form.branding} onChange={set('branding')} /><span>I'd like custom branding (labels, lids or box)</span></label>
              </div>
              <Button type="submit" variant="gold" size="lg" loading={state === 'loading'} magnetic={false} arrow>Request a proposal</Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
