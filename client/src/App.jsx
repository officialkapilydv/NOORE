import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { SmoothScroll } from '@/components/layout/SmoothScroll';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CustomCursor } from '@/components/layout/CustomCursor';
import { Preloader } from '@/components/layout/Preloader';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { FlyToCart, OfflineBanner, PageTransition, ScrollProgress, SearchOverlay, Toasts } from '@/components/layout/Overlays';
import { useAuth } from '@/store/auth';
import { useSettings } from '@/store/settings';
import Home from '@/pages/Home';

const Shop = lazy(() => import('@/pages/Shop'));
const Collection = lazy(() => import('@/pages/Collections'));
const CollectionsIndex = lazy(() => import('@/pages/Collections').then((m) => ({ default: m.CollectionsIndex })));
const Product = lazy(() => import('@/pages/Product'));
const Gifting = lazy(() => import('@/pages/Gifting'));
const Story = lazy(() => import('@/pages/Story'));
const Contact = lazy(() => import('@/pages/Contact'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const OrderSuccess = lazy(() => import('@/pages/OrderSuccess'));
const Account = lazy(() => import('@/pages/Account'));
const Page = lazy(() => import('@/pages/Page'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const AdminApp = lazy(() => import('@/admin/AdminApp'));

export default function App() {
  const { pathname } = useLocation();
  const bootstrap = useAuth((s) => s.bootstrap);
  const loadSettings = useSettings((s) => s.load);

  useEffect(() => { bootstrap(); loadSettings(); }, [bootstrap, loadSettings]);

  if (pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={<div className="page-loading" />}>
        <AdminApp />
      </Suspense>
    );
  }

  return (
    <SmoothScroll>
      <Preloader />
      <CustomCursor />
      <ScrollProgress />
      <Navbar />
      <PageTransition>
        <Suspense fallback={<div className="page-loading" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/collections" element={<CollectionsIndex />} />
            <Route path="/collections/:slug" element={<Collection />} />
            <Route path="/products/:slug" element={<Product />} />
            <Route path="/gifting" element={<Gifting />} />
            <Route path="/story" element={<Story />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:orderNumber" element={<OrderSuccess />} />
            <Route path="/account" element={<Account />} />
            <Route path="/pages/:slug" element={<Page />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Footer />
      </PageTransition>
      <CartDrawer />
      <SearchOverlay />
      <FlyToCart />
      <Toasts />
      <OfflineBanner />
      <div className="grain" aria-hidden="true" />
    </SmoothScroll>
  );
}
