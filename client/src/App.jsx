import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { SmoothScroll } from '@/components/layout/SmoothScroll';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Preloader } from '@/components/layout/Preloader';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { FlyToCart, OfflineBanner, PageTransition, ScrollProgress, SearchOverlay, Toasts } from '@/components/layout/Overlays';
import { useAuth } from '@/store/auth';
import { useSettings } from '@/store/settings';
import { useUI } from '@/store/ui';
import Home from '@/pages/Home';

const load = {
  shop: () => import('@/pages/Shop'),
  collections: () => import('@/pages/Collections'),
  product: () => import('@/pages/Product'),
  gifting: () => import('@/pages/Gifting'),
  story: () => import('@/pages/Story'),
  contact: () => import('@/pages/Contact'),
  checkout: () => import('@/pages/Checkout'),
  orderSuccess: () => import('@/pages/OrderSuccess'),
  account: () => import('@/pages/Account'),
  page: () => import('@/pages/Page'),
  notFound: () => import('@/pages/NotFound'),
};

const Shop = lazy(load.shop);
const Collection = lazy(load.collections);
const CollectionsIndex = lazy(() => load.collections().then((m) => ({ default: m.CollectionsIndex })));
const Product = lazy(load.product);
const Gifting = lazy(load.gifting);
const Story = lazy(load.story);
const Contact = lazy(load.contact);
const Checkout = lazy(load.checkout);
const OrderSuccess = lazy(load.orderSuccess);
const Account = lazy(load.account);
const Page = lazy(load.page);
const NotFound = lazy(load.notFound);
const AdminApp = lazy(() => import('@/admin/AdminApp'));

export default function App() {
  const location = useLocation();
  const { pathname } = location;
  const bootstrap = useAuth((s) => s.bootstrap);
  const loadSettings = useSettings((s) => s.load);
  const preloaderDone = useUI((s) => s.preloaderDone);

  useEffect(() => { bootstrap(); loadSettings(); }, [bootstrap, loadSettings]);

  // Once the intro is over, fetch every storefront page in the background so links open instantly.
  useEffect(() => {
    if (!preloaderDone || pathname.startsWith('/admin')) return;
    const warm = () => Object.values(load).forEach((fn) => fn().catch(() => {}));
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(warm, { timeout: 3000 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(warm, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloaderDone]);

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
      <ScrollProgress />
      <Navbar />
      <PageTransition>
        <Suspense fallback={<div className="page-loading" />}>
          {/* Pinned location: the page fading out keeps rendering its own route instead of mounting the next one. */}
          <Routes location={location}>
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
