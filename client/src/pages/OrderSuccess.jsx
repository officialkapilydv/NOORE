import { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatDate, formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { CandleThumb } from '@/components/shop/CandleThumb';
import { FlameMark } from '@/components/ui/Logo';

const CONFETTI = Array.from({ length: 60 }).map((_, i) => ({ id: i, x: (Math.random() - 0.5) * 900, y: -200 - Math.random() * 500, r: Math.random() * 720, d: 1.6 + Math.random() * 1.6, delay: Math.random() * 0.6, size: 5 + Math.random() * 7, gold: Math.random() > 0.3 }));

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const [params] = useSearchParams();
  const { state } = useLocation();
  const [order, setOrder] = useState(state?.order || null);
  const [error, setError] = useState('');
  usePageTitle(`Order ${orderNumber}`);

  useEffect(() => {
    if (order) return;
    api.order(orderNumber, params.get('email') || undefined).then(setOrder).catch((e) => setError(e.message));
  }, [orderNumber, params, order]);

  if (error) return <main className="page-hero container" data-theme="dark"><h1 className="display">We couldn't find <em>that order.</em></h1><p className="lead">{error}</p><Button to="/account" variant="ghost">Go to your account</Button></main>;
  if (!order) return <div className="page-loading" />;

  return (
    <main className="success" data-theme="dark">
      <div className="success__confetti" aria-hidden="true">
        {CONFETTI.map((c) => (
          <motion.span key={c.id} style={{ width: c.size, height: c.size * 0.6, background: c.gold ? '#d7b56d' : '#f6efe4' }} initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }} animate={{ x: c.x, y: [c.y, 700], rotate: c.r, opacity: [0, 1, 1, 0] }} transition={{ duration: c.d, delay: 0.4 + c.delay, ease: 'easeOut' }} />
        ))}
      </div>
      <div className="container success__inner">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="success__mark"><FlameMark size={52} animate className="gold" /></motion.div>
        <p className="eyebrow eyebrow--plain">Order {order.payment?.status === 'paid' ? 'confirmed' : 'placed'}</p>
        <h1 className="display">Thank you. The light is <em>on its way.</em></h1>
        <p className="lead">Order <strong className="gold">{order.orderNumber}</strong> · estimated delivery {formatDate(order.estimatedDelivery, { weekday: 'long' })}.{order.email && <> A confirmation has been sent to {order.email}.</>}</p>

        <div className="success__grid">
          <div className="success__card">
            <p className="caps faint">Your candles</p>
            <ul>
              {order.lines.map((l) => (
                <li key={`${l.slug}-${l.sizeId}`}><CandleThumb vessel={l.vessel} size={48} lit /><span>{l.name}<span className="faint small"> · {l.sizeLabel} × {l.quantity}</span></span><span>{formatPrice(l.lineTotal)}</span></li>
              ))}
            </ul>
            <div className="success__totals">
              {order.discount > 0 && <div><span className="muted">Discount</span><span>− {formatPrice(order.discount)}</span></div>}
              <div><span className="muted">Shipping</span><span>{order.shipping === 0 ? 'Complimentary' : formatPrice(order.shipping)}</span></div>
              {order.giftWrap && <div><span className="muted">Gift wrap</span><span>{formatPrice(order.giftWrapFee)}</span></div>}
              <div className="success__grand"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </div>
          <div className="success__card">
            <p className="caps faint">Delivering to</p>
            {order.address?.fullName ? (
              <p><strong>{order.address.fullName}</strong><br />{order.address.line1}{order.address.line2 && <>, {order.address.line2}</>}<br />{order.address.city}, {order.address.state} {order.address.postalCode}</p>
            ) : <p>{order.address?.city}, {order.address?.state}</p>}
            <p className="caps faint" style={{ marginTop: 24 }}>Payment</p>
            <p><strong>{order.payment?.method?.toUpperCase()}</strong> · {order.payment?.status}</p>
            <p className="caps faint" style={{ marginTop: 24 }}>Timeline</p>
            <ol className="success__timeline">
              {order.timeline?.map((t) => <li key={t.status}><span className="success__dot" />{t.label} <span className="faint small">· {formatDate(t.at)}</span></li>)}
            </ol>
          </div>
        </div>
        <div className="success__actions">
          <Button to="/shop" variant="gold" arrow>Continue shopping</Button>
          <Button to="/account" variant="ghost">Track orders</Button>
        </div>
        <p className="faint small">Keep your order number handy — orders placed while signed in also appear in <Link to="/account" className="gold">your account</Link>.</p>
      </div>
    </main>
  );
}
