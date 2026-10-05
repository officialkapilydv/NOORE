import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAdminAuth } from './store';
import { Toasts } from '@/components/layout/Overlays';
import { FlameMark } from '@/components/ui/Logo';
import { Btn, Field, Input, useToast } from './ui';
import './admin.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const ProductEditor = lazy(() => import('./pages/ProductEditor'));
const Collections = lazy(() => import('./pages/Collections'));
const Orders = lazy(() => import('./pages/Orders'));
const Coupons = lazy(() => import('./pages/Coupons'));
const Inbox = lazy(() => import('./pages/Inbox'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Customers = lazy(() => import('./pages/Customers'));
const Media = lazy(() => import('./pages/Media'));
const Pages = lazy(() => import('./pages/Pages'));
const Settings = lazy(() => import('./pages/Settings'));

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'M3 12h7V3H3v9zm0 9h7v-7H3v7zm11 0h7V12h-7v9zm0-18v7h7V3h-7z', end: true },
  { group: 'Catalog' },
  { to: '/admin/products', label: 'Products', icon: 'M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3zm0 2.2L5.6 8.4 12 11.6l6.4-3.2L12 5.2zM5 10v5.8l6 3v-5.8L5 10zm8 3v5.8l6-3V10l-6 3z' },
  { to: '/admin/collections', label: 'Collections', icon: 'M4 5h16v4H4V5zm0 5h16v4H4v-4zm0 5h16v4H4v-4z' },
  { to: '/admin/coupons', label: 'Coupons', icon: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7zm6 2v6h2V9H9zm4 0v6h2V9h-2z' },
  { to: '/admin/media', label: 'Media', icon: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2v8l4-4 3 3 3-3 4 4V7H5zm3 1a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z' },
  { group: 'Sales' },
  { to: '/admin/orders', label: 'Orders', icon: 'M6 2h12l1 4H5l1-4zm-1 6h14l-1 14H6L5 8zm4 3v2h6v-2H9z' },
  { to: '/admin/customers', label: 'Customers', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0H5z' },
  { to: '/admin/inbox', label: 'Inbox', icon: 'M3 5h18v14H3V5zm2 2v.5l7 4.5 7-4.5V7H5zm0 2.9V17h14V9.9l-7 4.5-7-4.5z' },
  { to: '/admin/reviews', label: 'Reviews', icon: 'M12 2.5l2.9 6.1 6.7.8-4.9 4.6 1.3 6.6L12 17.3 6 20.6l1.3-6.6L2.4 9.4l6.7-.8z' },
  { group: 'Content' },
  { to: '/admin/pages', label: 'Pages', icon: 'M6 2h8l5 5v15H6V2zm8 1.5V8h4.5L14 3.5zM8 11h8v2H8v-2zm0 4h8v2H8v-2z' },
  { to: '/admin/settings', label: 'Settings', icon: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.9 3-2.1-.4a7 7 0 0 0-.6-1.5l1.2-1.8-1.7-1.7-1.8 1.2a7 7 0 0 0-1.5-.6L14 4h-4l-.4 2.1a7 7 0 0 0-1.5.6L6.3 5.6 4.6 7.3l1.2 1.8a7 7 0 0 0-.6 1.5L3 11v2l2.1.4a7 7 0 0 0 .6 1.5l-1.2 1.8 1.7 1.7 1.8-1.2a7 7 0 0 0 1.5.6L10 20h4l.4-2.1a7 7 0 0 0 1.5-.6l1.8 1.2 1.7-1.7-1.2-1.8a7 7 0 0 0 .6-1.5l2.1-.4v-2z' },
];

function Icon({ d }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d={d} fill="currentColor" /></svg>;
}

function Login() {
  const login = useAdminAuth((s) => s.login);
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form);
      toast('Welcome back to the studio.', { type: 'success' });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="adm-login">
      <form className="adm-login__card" onSubmit={submit}>
        <div className="adm-login__brand"><FlameMark size={30} /><span>NOORÉ</span><em>Studio admin</em></div>
        <h1>Sign in</h1>
        <Field label="Email"><Input type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoFocus /></Field>
        <Field label="Password"><Input type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
        {error && <p className="adm-field__error">{error}</p>}
        <Btn type="submit" loading={busy}>Enter the studio</Btn>
        <p className="adm-login__hint">First run? The API prints the seeded admin email and password in its console (default <code>admin@noore.in</code> / <code>noore-admin-2026</code>). Change it under Settings → Administrators.</p>
        <Link to="/" className="adm-login__back">← Back to the storefront</Link>
      </form>
    </div>
  );
}

function Shell() {
  const { admin, logout } = useAdminAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="adm">
      <aside className={`adm-side ${open ? 'is-open' : ''}`}>
        <Link to="/admin" className="adm-side__brand"><FlameMark size={22} /><span>NOORÉ</span><em>Studio</em></Link>
        <nav className="adm-nav">
          {NAV.map((item, i) => item.group ? <p key={`g${i}`} className="adm-nav__group">{item.group}</p> : (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `adm-nav__link ${isActive ? 'is-active' : ''}`}>
              <Icon d={item.icon} /><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="adm-side__foot">
          <a href="/" target="_blank" rel="noreferrer" className="adm-nav__link"><Icon d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14V3zM5 5h6v2H5v12h12v-6h2v8H3V5h2z" /><span>View storefront</span></a>
          <div className="adm-side__user">
            <span className="adm-avatar">{(admin?.name || 'A').slice(0, 1)}</span>
            <span><strong>{admin?.name}</strong><small>{admin?.email}</small></span>
            <button onClick={logout} title="Sign out" aria-label="Sign out"><Icon d="M10 17l-1.4-1.4 2.6-2.6H3v-2h8.2L8.6 8.4 10 7l5 5-5 5zm4-14h6v18h-6v-2h4V5h-4V3z" /></button>
          </div>
        </div>
      </aside>
      <div className="adm-main">
        <header className="adm-topbar">
          <button className="adm-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu"><span /><span /><span /></button>
          <span className="adm-topbar__crumb">{pathname.replace('/admin', '').split('/').filter(Boolean).map((s) => s.replace(/-/g, ' ')).join(' / ') || 'dashboard'}</span>
          <Link to="/admin/products/new" className="adm-btn adm-btn--primary adm-btn--sm">+ New product</Link>
        </header>
        <main className="adm-content">
          <Suspense fallback={<div className="adm-loading"><span className="adm-spinner adm-spinner--dark" /></div>}>
            <Routes>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/products" element={<Products />} />
              <Route path="/admin/products/new" element={<ProductEditor />} />
              <Route path="/admin/products/:slug" element={<ProductEditor />} />
              <Route path="/admin/collections" element={<Collections />} />
              <Route path="/admin/coupons" element={<Coupons />} />
              <Route path="/admin/media" element={<Media />} />
              <Route path="/admin/orders" element={<Orders />} />
              <Route path="/admin/orders/:id" element={<Orders />} />
              <Route path="/admin/customers" element={<Customers />} />
              <Route path="/admin/inbox" element={<Inbox />} />
              <Route path="/admin/reviews" element={<Reviews />} />
              <Route path="/admin/pages" element={<Pages />} />
              <Route path="/admin/pages/:slug" element={<Pages />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route path="/admin/settings/:tab" element={<Settings />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      {open && <div className="adm-side__scrim" onClick={() => setOpen(false)} />}
    </div>
  );
}

export default function AdminApp() {
  const { status, bootstrap } = useAdminAuth();
  useEffect(() => { bootstrap(); }, [bootstrap]);
  useEffect(() => {
    document.title = 'NOORÉ Studio · Admin';
    document.body.classList.add('is-admin');
    return () => document.body.classList.remove('is-admin');
  }, []);
  if (status === 'loading') return <div className="adm-loading adm-loading--full"><span className="adm-spinner adm-spinner--dark" /></div>;
  return (
    <>
      {status === 'authed' ? <Shell /> : <Login />}
      <Toasts />
    </>
  );
}
