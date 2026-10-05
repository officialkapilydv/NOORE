import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useCart } from '@/store/cart';
import { useAuth } from '@/store/auth';
import { useUI } from '@/store/ui';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Field, Stepper } from '@/components/ui/Primitives';
import { CandleThumb } from '@/components/shop/CandleThumb';
import { useSettings } from '@/store/settings';

const STEPS = ['Delivery', 'Payment', 'Review'];
const STATES = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];

export default function Checkout() {
  usePageTitle('Checkout');
  const navigate = useNavigate();
  const toast = useUI((s) => s.toast);
  const { items, couponCode, giftWrap, setCoupon, setGiftWrap, setQuantity, remove, clear } = useCart();
  const user = useAuth((s) => s.user);
  const shippingCfg = useSettings((s) => s.settings.shipping);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ email: user?.email || '', fullName: user?.name || '', phone: '', line1: '', line2: '', city: '', state: 'Rajasthan', postalCode: '', giftMessage: '', notes: '' });
  const [payment, setPayment] = useState({ method: 'card', number: '', expiry: '', cvc: '', upi: '' });
  const [errors, setErrors] = useState({});
  const [pricing, setPricing] = useState(null);
  const [couponInput, setCouponInput] = useState(couponCode || '');
  const [couponError, setCouponError] = useState('');
  const [placing, setPlacing] = useState(false);

  const payload = useMemo(() => items.map((i) => ({ slug: i.slug, sizeId: i.sizeId, quantity: i.quantity })), [items]);

  useEffect(() => {
    if (!items.length) { setPricing(null); return; }
    const t = setTimeout(() => {
      api.priceCart({ items: payload, couponCode: couponCode || null, giftWrap })
        .then((p) => { setPricing(p); setCouponError(''); })
        .catch((err) => {
          if (couponCode) { setCouponError(err.message); setCoupon(''); } else toast(err.message, { type: 'error' });
        });
    }, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, couponCode, giftWrap]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validateDelivery = () => {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Please enter a valid email.';
    if (form.fullName.trim().length < 2) e.fullName = 'Please enter the recipient name.';
    if (!/^[0-9+\-\s()]{8,16}$/.test(form.phone)) e.phone = 'Please enter a valid phone number.';
    if (form.line1.trim().length < 4) e.line1 = 'Please enter a street address.';
    if (form.city.trim().length < 2) e.city = 'Please enter a city.';
    if (!/^[0-9]{6}$/.test(form.postalCode)) e.postalCode = 'Enter a 6-digit PIN code.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const validatePayment = () => {
    const e = {};
    if (payment.method === 'card') {
      if (!/^\d{16}$/.test(payment.number.replace(/\s/g, ''))) e.number = 'Enter a 16-digit card number.';
      if (!/^\d{2}\/\d{2}$/.test(payment.expiry)) e.expiry = 'MM/YY';
      if (!/^\d{3,4}$/.test(payment.cvc)) e.cvc = '3–4 digits';
    }
    if (payment.method === 'upi' && !/^[\w.-]+@[\w]+$/.test(payment.upi)) e.upi = 'Enter a valid UPI ID, e.g. name@bank';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 0 && !validateDelivery()) return;
    if (step === 1 && !validatePayment()) return;
    setStep((s) => Math.min(2, s + 1));
  };

  const applyCoupon = () => {
    setCouponError('');
    setCoupon(couponInput.trim().toUpperCase());
  };

  const place = async () => {
    setPlacing(true);
    try {
      const order = await api.placeOrder({
        email: form.email,
        items: payload,
        shipping: { fullName: form.fullName, phone: form.phone, line1: form.line1, line2: form.line2, city: form.city, state: form.state, postalCode: form.postalCode, country: 'India' },
        couponCode: couponCode || null,
        giftWrap,
        giftMessage: form.giftMessage,
        notes: form.notes,
        paymentMethod: payment.method,
        card: payment.method === 'card' ? { last4: payment.number.replace(/\s/g, '').slice(-4), brand: 'card' } : undefined,
      });
      navigate(`/order/${order.orderNumber}?email=${encodeURIComponent(order.email)}`, { state: { order } });
      // empty the bag once the page transition has carried the checkout off-screen
      setTimeout(clear, 900);
    } catch (err) {
      if (err.payload?.issues) {
        setErrors(Object.fromEntries(err.payload.issues.map((i) => [i.path.replace('shipping.', ''), i.message])));
        setStep(0);
      }
      toast(err.message, { type: 'error', duration: 5000 });
    } finally {
      setPlacing(false);
    }
  };

  if (!items.length) {
    return (
      <main className="page-hero container checkout__empty" data-theme="dark">
        <CandleThumb vessel={{ type: 'glass', color: '#d98a3a', wax: '#f4dfb7', lid: 'gold', labelBg: '#f6ead3', labelText: '#4a2a10', accent: '#d9b162', glow: '#ffb15c' }} size={160} lit />
        <h1 className="display">Your bag is <em>empty.</em></h1>
        <p className="lead">Nothing to check out yet — the collection is waiting.</p>
        <Button to="/shop" variant="gold" arrow>Explore candles</Button>
      </main>
    );
  }

  return (
    <main className="checkout" data-theme="dark">
      <div className="container checkout__layout">
        <div className="checkout__main">
          <header className="checkout__head">
            <p className="eyebrow">Checkout</p>
            <ol className="steps">
              {STEPS.map((s, i) => (
                <li key={s} className={`${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`} onClick={() => i < step && setStep(i)}>
                  <span className="steps__n">{i < step ? '✓' : i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </header>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.section key="delivery" className="checkout__panel" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                <h2 className="display">Where should the <em>light</em> go?</h2>
                {!user && <p className="muted small">Have an account? <Link to="/account" className="gold">Sign in</Link> for faster checkout.</p>}
                <div className="form-grid">
                  <Field label="Email" name="email" type="email" value={form.email} onChange={set('email')} error={errors.email} className="span-2" />
                  <Field label="Full name" name="fullName" value={form.fullName} onChange={set('fullName')} error={errors.fullName} />
                  <Field label="Phone" name="phone" value={form.phone} onChange={set('phone')} error={errors.phone} />
                  <Field label="Address" name="line1" value={form.line1} onChange={set('line1')} error={errors.line1} className="span-2" />
                  <Field label="Apartment, landmark (optional)" name="line2" value={form.line2} onChange={set('line2')} className="span-2" />
                  <Field label="City" name="city" value={form.city} onChange={set('city')} error={errors.city} />
                  <Field label="PIN code" name="postalCode" value={form.postalCode} onChange={set('postalCode')} error={errors.postalCode} inputMode="numeric" />
                  <label className="field span-2" htmlFor="state">
                    <span className="field__label">State</span>
                    <div className="select"><select id="state" value={form.state} onChange={set('state')}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
                  </label>
                </div>
                <div className="checkout__gift">
                  <label className="check"><input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} /><span>Gift wrap in our ribboned linen box <span className="faint">(+{formatPrice(shippingCfg?.giftWrap ?? 149)})</span></span></label>
                  <AnimatePresence>
                    {giftWrap && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <Field label="Gift message (hand-written on our card)" name="giftMessage" as="textarea" rows={2} maxLength={240} value={form.giftMessage} onChange={set('giftMessage')} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Button variant="gold" size="lg" onClick={next} magnetic={false} arrow>Continue to payment</Button>
              </motion.section>
            )}

            {step === 1 && (
              <motion.section key="payment" className="checkout__panel" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                <h2 className="display">How would you like to <em>pay?</em></h2>
                <div className="pay-methods">
                  {[['card', 'Card', 'Visa, Mastercard, RuPay, Amex'], ['upi', 'UPI', 'GPay, PhonePe, Paytm'], ['cod', 'Cash on delivery', 'Pay when it arrives']].map(([id, label, note]) => (
                    <button key={id} type="button" className={`pay ${payment.method === id ? 'is-active' : ''}`} onClick={() => setPayment({ ...payment, method: id })}>
                      {payment.method === id && <motion.span layoutId="pay-bg" className="pay__bg" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                      <span className="pay__label">{label}</span>
                      <span className="pay__note small">{note}</span>
                    </button>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  {payment.method === 'card' && (
                    <motion.div key="card" className="form-grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <Field label="Card number" name="number" inputMode="numeric" placeholder="4242 4242 4242 4242" value={payment.number} onChange={(e) => setPayment({ ...payment, number: e.target.value.replace(/[^\d]/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ') })} error={errors.number} className="span-2" hint="Demo gateway — any number works; ending 0000 is declined." />
                      <Field label="Expiry" name="expiry" placeholder="MM/YY" value={payment.expiry} onChange={(e) => setPayment({ ...payment, expiry: e.target.value.replace(/[^\d]/g, '').slice(0, 4).replace(/(\d{2})(?=\d)/, '$1/') })} error={errors.expiry} />
                      <Field label="CVC" name="cvc" inputMode="numeric" value={payment.cvc} onChange={(e) => setPayment({ ...payment, cvc: e.target.value.replace(/[^\d]/g, '').slice(0, 4) })} error={errors.cvc} />
                    </motion.div>
                  )}
                  {payment.method === 'upi' && (
                    <motion.div key="upi" className="form-grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <Field label="UPI ID" name="upi" placeholder="name@bank" value={payment.upi} onChange={(e) => setPayment({ ...payment, upi: e.target.value })} error={errors.upi} className="span-2" />
                    </motion.div>
                  )}
                  {payment.method === 'cod' && <motion.p key="cod" className="muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Pay in cash or by UPI when your order arrives. Available across India.</motion.p>}
                </AnimatePresence>
                <div className="checkout__actions">
                  <Button variant="ghost" onClick={() => setStep(0)} magnetic={false}>Back</Button>
                  <Button variant="gold" size="lg" onClick={next} magnetic={false} arrow>Review order</Button>
                </div>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section key="review" className="checkout__panel" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                <h2 className="display">One last <em>look</em></h2>
                <div className="review-grid">
                  <div className="review-block">
                    <p className="caps faint">Deliver to</p>
                    <p><strong>{form.fullName}</strong><br />{form.line1}{form.line2 && <>, {form.line2}</>}<br />{form.city}, {form.state} {form.postalCode}<br />{form.phone} · {form.email}</p>
                    <button className="link" onClick={() => setStep(0)}>Edit</button>
                  </div>
                  <div className="review-block">
                    <p className="caps faint">Payment</p>
                    <p><strong>{payment.method === 'card' ? `Card ending ${payment.number.replace(/\s/g, '').slice(-4)}` : payment.method === 'upi' ? `UPI · ${payment.upi}` : 'Cash on delivery'}</strong></p>
                    <button className="link" onClick={() => setStep(1)}>Edit</button>
                  </div>
                  {giftWrap && (
                    <div className="review-block span-2">
                      <p className="caps faint">Gift wrap</p>
                      <p><strong>Ribboned linen box</strong>{form.giftMessage && <><br /><em>“{form.giftMessage}”</em></>}</p>
                    </div>
                  )}
                </div>
                <Field label="Delivery notes (optional)" name="notes" as="textarea" rows={2} value={form.notes} onChange={set('notes')} />
                <div className="checkout__actions">
                  <Button variant="ghost" onClick={() => setStep(1)} magnetic={false}>Back</Button>
                  <Button variant="gold" size="lg" onClick={place} loading={placing} magnetic={false} arrow>Place order · {formatPrice(pricing?.total ?? 0)}</Button>
                </div>
                <p className="faint small">By placing this order you agree to our terms. Demo store — no real payment is taken.</p>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        <aside className="summary" data-lenis-prevent>
          <p className="caps faint">Order summary</p>
          <ul className="summary__list">
            {items.map((i) => (
              <li key={i.key} className="summary__item">
                <CandleThumb vessel={i.vessel} size={54} lit />
                <div className="summary__info">
                  <span>{i.name}</span>
                  <span className="faint small">{i.sizeLabel}</span>
                  <div className="summary__row"><Stepper size="sm" value={i.quantity} onChange={(q) => setQuantity(i.key, q)} /><button className="link small" onClick={() => remove(i.key)}>Remove</button></div>
                </div>
                <span className="summary__price">{formatPrice(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="coupon">
            <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Gift code" aria-label="Coupon code" onKeyDown={(e) => e.key === 'Enter' && applyCoupon()} />
            <button type="button" onClick={applyCoupon}>Apply</button>
          </div>
          <AnimatePresence>
            {couponError && <motion.p className="field__error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{couponError}</motion.p>}
            {pricing?.coupon && <motion.p className="coupon__ok small" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>✦ {pricing.coupon.label} <button className="link" onClick={() => { setCoupon(''); setCouponInput(''); }}>remove</button></motion.p>}
          </AnimatePresence>
          <div className="summary__totals">
            <div><span className="muted">Subtotal</span><span>{formatPrice(pricing?.subtotal ?? items.reduce((n, i) => n + i.unitPrice * i.quantity, 0))}</span></div>
            {pricing?.discount > 0 && <div className="gold"><span>Discount</span><span>− {formatPrice(pricing.discount)}</span></div>}
            <div><span className="muted">Shipping</span><span>{pricing ? (pricing.shipping === 0 ? 'Complimentary' : formatPrice(pricing.shipping)) : '—'}</span></div>
            {giftWrap && <div><span className="muted">Gift wrap</span><span>{formatPrice(pricing?.giftWrapFee ?? shippingCfg?.giftWrap ?? 149)}</span></div>}
            <div className="summary__grand"><span>Total</span><span>{formatPrice(pricing?.total ?? 0)}</span></div>
          </div>
          <p className="faint small">Try <code>WELCOME10</code>, <code>NOORE15</code> (Luxury), <code>FREESHIP</code> or <code>GIFT500</code>.</p>
        </aside>
      </div>
    </main>
  );
}
