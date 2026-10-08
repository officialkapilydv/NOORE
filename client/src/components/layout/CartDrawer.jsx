import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '@/store/cart';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Primitives';
import { CandleThumb } from '@/components/shop/CandleThumb';
import { useSettings } from '@/store/settings';
import { useDialog } from '@/hooks/useDialog';

export function CartDrawer() {
  const { items, isOpen, close, setQuantity, remove, couponCode, giftWrap, syncLines } = useCart();
  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);
  const navigate = useNavigate();
  const [pricing, setPricing] = useState(null);
  const shippingCfg = useSettings((s) => s.settings.shipping);
  const FREE_OVER = Number(shippingCfg?.freeOver || 1999);
  const dialogRef = useDialog(isOpen, close, { initialFocus: '.drawer__close' });

  // Price exactly what checkout will charge: the saved code and gift wrap included. If the saved
  // code no longer applies, show the bag without it (checkout explains why).
  useEffect(() => {
    if (!isOpen || items.length === 0) { setPricing(null); return; }
    let current = true;
    const body = { items: items.map((i) => ({ slug: i.slug, sizeId: i.sizeId, quantity: i.quantity })), giftWrap };
    const t = setTimeout(() => {
      api.priceCart({ ...body, couponCode: couponCode || null })
        .catch((err) => (couponCode && err.payload?.field === 'coupon' ? api.priceCart(body) : Promise.reject(err)))
        .then((p) => { if (current) { setPricing(p); syncLines(p.lines); } })
        .catch(() => { if (current) setPricing(null); });
    }, 120);
    return () => { current = false; clearTimeout(t); };
  }, [isOpen, items, couponCode, giftWrap, syncLines]);

  // Free shipping is judged after discounts, as the server does.
  const remaining = pricing ? (pricing.shipping === 0 ? 0 : pricing.amountToFreeShipping) : Math.max(0, FREE_OVER - subtotal);
  const progress = Math.min(1, (FREE_OVER - remaining) / FREE_OVER);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="drawer__bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} onClick={close} />
          <motion.aside ref={dialogRef} className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabIndex={-1} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }} data-lenis-prevent>
            <header className="drawer__head">
              <div>
                <p className="eyebrow eyebrow--plain">Your bag</p>
                <h3 id="drawer-title">{items.length === 0 ? 'Nothing yet' : `${items.reduce((n, i) => n + i.quantity, 0)} ${items.reduce((n, i) => n + i.quantity, 0) === 1 ? 'candle' : 'candles'}`}</h3>
              </div>
              <button className="drawer__close" onClick={close} aria-label="Close bag"><span /><span /></button>
            </header>

            {items.length > 0 && (
              <div className="drawer__ship">
                <p className="small">{remaining > 0 ? <>Add <strong>{formatPrice(remaining)}</strong> more for complimentary shipping</> : <>✦ Complimentary shipping unlocked</>}</p>
                <div className="drawer__bar"><motion.span animate={{ scaleX: progress }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} /></div>
              </div>
            )}

            <div className="drawer__body">
              {items.length === 0 ? (
                <motion.div className="drawer__empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <CandleThumb vessel={{ type: 'glass', color: '#d98a3a', wax: '#f4dfb7', lid: 'gold', accent: '#d9b162', glow: '#ffb15c' }} size={120} lit />
                  <p className="lead">Your bag is waiting for its first flame.</p>
                  <Button to="/shop" variant="gold" onClick={close} arrow>Explore the collection</Button>
                </motion.div>
              ) : (
                <ul className="drawer__list">
                  <AnimatePresence initial={false}>
                    {items.map((item, i) => (
                      <motion.li key={item.key} className="drawer__item" layout initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.15 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] } }} exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0, transition: { duration: 0.35 } }}>
                        <Link to={`/products/${item.slug}`} onClick={close} className="drawer__thumb"><CandleThumb vessel={item.vessel} size={72} lit /></Link>
                        <div className="drawer__info">
                          <Link to={`/products/${item.slug}`} onClick={close} className="drawer__name">{item.name}</Link>
                          <span className="faint small">{item.sizeLabel}</span>
                          <div className="drawer__row">
                            <Stepper size="sm" value={item.quantity} onChange={(q) => setQuantity(item.key, q)} label={`Quantity, ${item.name}`} />
                            <span className="drawer__price">{formatPrice(item.unitPrice * item.quantity)}</span>
                          </div>
                        </div>
                        <button className="drawer__remove" onClick={() => remove(item.key)} aria-label={`Remove ${item.name}`}>×</button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="drawer__foot">
                <div className="drawer__totals">
                  <div><span className="muted">Subtotal</span><span>{formatPrice(pricing?.subtotal ?? subtotal)}</span></div>
                  {pricing?.discount > 0 && <div className="gold"><span>{pricing.coupon?.code || 'Discount'}</span><span>− {formatPrice(pricing.discount)}</span></div>}
                  {pricing?.giftWrapFee > 0 && <div><span className="muted">Gift wrap</span><span>{formatPrice(pricing.giftWrapFee)}</span></div>}
                  <div><span className="muted">Shipping</span><span>{pricing ? (pricing.shipping === 0 ? 'Complimentary' : formatPrice(pricing.shipping)) : remaining > 0 ? formatPrice(shippingCfg?.flat || 99) : 'Complimentary'}</span></div>
                  <div className="drawer__grand"><span>Total</span><span>{formatPrice(pricing ? pricing.total : subtotal + (remaining > 0 ? Number(shippingCfg?.flat || 99) : 0))}</span></div>
                </div>
                <Button variant="gold" size="lg" className="drawer__cta" arrow magnetic={false} onClick={() => { close(); navigate('/checkout'); }}>Checkout</Button>
                <p className="faint small center">Gift wrapping & a hand-written note available at checkout.</p>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
