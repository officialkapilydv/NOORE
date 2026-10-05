import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { useUI } from '@/store/ui';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatDate, formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Primitives';
import { CandleThumb } from '@/components/shop/CandleThumb';

export default function Account() {
  usePageTitle('Account');
  const { user, status, login, register, logout } = useAuth();
  const toast = useUI((s) => s.toast);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    if (status === 'authed') api.myOrders().then((r) => setOrders(r.items)).catch(() => setOrders([]));
  }, [status]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      if (mode === 'login') await login({ email: form.email, password: form.password });
      else await register(form);
      toast(mode === 'login' ? 'Welcome back.' : 'Welcome to NOORÉ.', { type: 'success' });
    } catch (err) {
      if (err.payload?.issues) setErrors(Object.fromEntries(err.payload.issues.map((i) => [i.path, i.message])));
      else setErrors({ form: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (status === 'authed' && user) {
    return (
      <main className="account" data-theme="dark">
        <div className="container account__layout">
          <aside className="account__side">
            <p className="eyebrow">Your account</p>
            <h1 className="display">Hello, <em>{user.name.split(' ')[0]}</em></h1>
            <p className="muted">{user.email}</p>
            <p className="faint small">Member since {formatDate(user.createdAt)}</p>
            <Button variant="ghost" size="sm" onClick={logout} magnetic={false}>Sign out</Button>
          </aside>
          <section className="account__orders">
            <p className="caps faint">Orders</p>
            {orders === null && <div className="page-loading page-loading--inline" />}
            {orders?.length === 0 && (
              <div className="account__empty">
                <p className="lead">No orders yet — your first flame awaits.</p>
                <Button to="/shop" variant="gold" arrow>Start with a candle</Button>
              </div>
            )}
            <ul className="orders">
              {orders?.map((o, i) => (
                <motion.li key={o.id} className="order" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <div className="order__head">
                    <div><strong>{o.orderNumber}</strong><span className="faint small"> · {formatDate(o.createdAt)}</span></div>
                    <span className={`pill pill--${o.status}`}>{o.status}</span>
                  </div>
                  <div className="order__lines">
                    {o.lines.map((l) => <span key={`${l.slug}-${l.sizeId}`} className="order__line" title={l.name}><CandleThumb vessel={l.vessel} size={36} lit={false} /></span>)}
                    <span className="order__names muted small">{o.lines.map((l) => `${l.name} × ${l.quantity}`).join(', ')}</span>
                  </div>
                  <div className="order__foot">
                    <span>{formatPrice(o.total)}</span>
                    <Link to={`/order/${o.orderNumber}?email=${encodeURIComponent(o.email)}`} className="link">View details →</Link>
                  </div>
                </motion.li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="account" data-theme="dark">
      <div className="container account__auth">
        <div className="account__intro">
          <p className="eyebrow">Account</p>
          <h1 className="display">Your candles, <em>remembered.</em></h1>
          <p className="lead">Track orders, re-order favourites in a tap and be first to hear about limited pours.</p>
          <CandleThumb vessel={{ type: 'marble', color: '#f1ece4', veins: '#c9a24a', wax: '#f5ead7', lid: 'gold', labelBg: '#fbf8f2', labelText: '#2d2016', accent: '#c9a24a', glow: '#ffc784' }} size={170} lit />
        </div>
        <motion.form className="form-card" onSubmit={submit} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3 }}>
          <div className="tabs">
            {['login', 'register'].map((m) => (
              <button key={m} type="button" className={mode === m ? 'is-active' : ''} onClick={() => { setMode(m); setErrors({}); }}>
                {mode === m && <motion.span layoutId="tab-bg" className="tabs__bg" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                <span>{m === 'login' ? 'Sign in' : 'Create account'}</span>
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={mode} className="form-grid" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}>
              {mode === 'register' && <Field label="Name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} className="span-2" />}
              <Field label="Email" name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} className="span-2" />
              <Field label="Password" name="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} className="span-2" hint={mode === 'register' ? 'At least 8 characters' : undefined} />
            </motion.div>
          </AnimatePresence>
          {errors.form && <p className="field__error">{errors.form}</p>}
          <Button type="submit" variant="gold" size="lg" loading={busy} magnetic={false} arrow>{mode === 'login' ? 'Sign in' : 'Create account'}</Button>
          <p className="faint small">Demo store: accounts are stored locally on the API server.</p>
        </motion.form>
      </div>
    </main>
  );
}
