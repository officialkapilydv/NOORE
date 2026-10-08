import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useCart } from '@/store/cart';
import { useUI } from '@/store/ui';
import { useAuth } from '@/store/auth';
import { FlameMark } from '@/components/ui/Logo';
import { useMagnetic } from '@/hooks/useMagnetic';
import { useSettings } from '@/store/settings';
import { SwapText } from '@/components/ui/Primitives';
import { useDialog } from '@/hooks/useDialog';

const NAV = [
  { to: '/shop', label: 'Shop' },
  { to: '/collections', label: 'Collections', mega: true },
  { to: '/gifting', label: 'Gifting' },
  { to: '/story', label: 'Our Story' },
  { to: '/contact', label: 'Contact' },
];

const COLLECTIONS = [
  { slug: 'essentials', name: 'Essentials', note: 'Everyday fragrances', from: '₹549', color: '#efe3d2', accent: '#b78a3c' },
  { slug: 'premium', name: 'Premium', note: 'Elevated fragrances', from: '₹1,699', color: '#d98a3a', accent: '#f3e5bd' },
  { slug: 'luxury', name: 'Luxury', note: 'Extraordinary moments', from: '₹3,499', color: '#17120f', accent: '#d7b56d' },
  { slug: 'gifting', name: 'Gift Sets', note: 'Ribboned & boxed', from: '₹2,499', color: '#5a1418', accent: '#f0d9a0' },
];

function IconButton({ children, label, onClick, className = '', badge, ...rest }) {
  const ref = useMagnetic({ strength: 0.25, radius: 40, scale: 1.08 });
  return (
    <button ref={ref} className={`nav__icon ${className}`} aria-label={label} onClick={onClick} {...rest}>
      {children}
      <AnimatePresence>
        {badge > 0 && (
          <motion.span key={badge} className="nav__badge" initial={{ scale: 0 }} animate={{ scale: [0, 1.35, 1] }} exit={{ scale: 0 }} transition={{ duration: 0.45 }}>
            {badge}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export function Navbar() {
  const { pathname } = useLocation();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mega, setMega] = useState(false);
  const lastY = useRef(0);
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const toggleCart = useCart((s) => s.toggle);
  const cartOpen = useCart((s) => s.isOpen);
  // Individual selectors: reading the whole store re-rendered the header on every toast and flyer.
  const menuOpen = useUI((s) => s.menuOpen);
  const setMenuOpen = useUI((s) => s.setMenuOpen);
  const setSearchOpen = useUI((s) => s.setSearchOpen);
  const setCartIconRect = useUI((s) => s.setCartIconRect);
  const preloaderDone = useUI((s) => s.preloaderDone);
  const user = useAuth((s) => s.user);
  const announcement = useSettings((s) => s.settings.announcement);
  const cartRef = useRef(null);
  const isHome = pathname === '/';
  // The header (and its close button) stays above the menu, so no Tab trap; just Escape, focus and an inert page.
  const menuRef = useDialog(menuOpen, () => setMenuOpen(false), { initialFocus: '.menu__link', trap: false, inert: ['.page'] });

  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 40);
    setHidden(y > lastY.current && y > 320 && !menuOpen);
    lastY.current = y;
  });

  useEffect(() => { setMenuOpen(false); setMega(false); }, [pathname, setMenuOpen]);

  const showAnnouncement = Boolean(announcement?.enabled && announcement?.text);
  useEffect(() => {
    document.documentElement.classList.toggle('has-announcement', showAnnouncement);
  }, [showAnnouncement]);

  useEffect(() => {
    let frame = 0;
    const measure = () => { frame = 0; if (cartRef.current) setCartIconRect(cartRef.current.getBoundingClientRect()); };
    const onResize = () => { if (!frame) frame = requestAnimationFrame(measure); }; // at most once per frame
    measure();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(frame); };
  }, [setCartIconRect, scrolled]);

  return (
    <>
      <motion.header
        className={`nav ${scrolled ? 'is-scrolled' : ''} ${isHome && !scrolled ? 'is-transparent' : ''} ${menuOpen ? 'is-menu' : ''}`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: hidden && !cartOpen ? -110 : 0, opacity: preloaderDone ? 1 : 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: preloaderDone ? 0.1 : 0 }}
        onMouseLeave={() => setMega(false)}
        // Never leave keyboard focus on an off-screen (scrolled-away) header.
        onFocusCapture={() => setHidden(false)}
      >
        {showAnnouncement && (
          <div className="announce">
            {announcement.link ? <Link to={announcement.link}>{announcement.text}</Link> : <span>{announcement.text}</span>}
          </div>
        )}
        <div className="nav__inner container--wide">
          <nav className="nav__links" aria-label="Primary">
            {NAV.slice(0, 3).map((item) => (
              <div key={item.to} className="nav__item" onMouseEnter={() => setMega(Boolean(item.mega))}>
                <NavLink to={item.to} className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}>
                  <SwapText text={item.label} />
                </NavLink>
              </div>
            ))}
          </nav>

          <Link to="/" className="nav__brand" aria-label="NOORÉ home">
            <FlameMark size={20} className="nav__flame" />
            <span className="nav__wordmark">NOORÉ</span>
          </Link>

          <div className="nav__right">
            <nav className="nav__links nav__links--right" aria-label="Secondary">
              {NAV.slice(3).map((item) => (
                <div key={item.to} className="nav__item" onMouseEnter={() => setMega(false)}>
                  <NavLink to={item.to} className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}>
                    <SwapText text={item.label} />
                  </NavLink>
                </div>
              ))}
            </nav>
            <div className="nav__actions">
              <IconButton label="Search" onClick={() => setSearchOpen(true)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.4" /><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
              </IconButton>
              <Link to="/account" className="nav__icon" aria-label={user ? 'Your account' : 'Sign in'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.4" /><path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                {user && <span className="nav__dot" />}
              </Link>
              <span ref={cartRef} className="nav__cart-anchor">
                <IconButton label="Cart" onClick={toggleCart} badge={count} className="nav__cart">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                </IconButton>
              </span>
              <button className={`nav__burger ${menuOpen ? 'is-open' : ''}`} aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
                <span /><span />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mega && (
            <motion.div className="mega" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} onMouseEnter={() => setMega(true)}>
              <div className="container--wide mega__grid">
                {COLLECTIONS.map((c, i) => (
                  <motion.div key={c.slug} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.06, duration: 0.5 }}>
                    <Link to={c.slug === 'gifting' ? '/gifting' : `/collections/${c.slug}`} className="mega__card" style={{ '--c': c.color, '--a': c.accent }}>
                      <span className="mega__swatch"><FlameMark size={16} /></span>
                      <span className="mega__name">{c.name}</span>
                      <span className="mega__note">{c.note}</span>
                      <span className="mega__from">From {c.from}</span>
                    </Link>
                  </motion.div>
                ))}
                <Link to="/shop" className="mega__all">
                  <span>View all 21 fragrances</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div ref={menuRef} className="menu" role="dialog" aria-label="Menu" data-lenis-prevent initial={{ clipPath: 'circle(0% at 100% 0%)' }} animate={{ clipPath: 'circle(150% at 100% 0%)' }} exit={{ clipPath: 'circle(0% at 100% 0%)' }} transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}>
            <div className="menu__inner">
              <ul className="menu__list">
                {[{ to: '/', label: 'Home' }, ...NAV, { to: '/account', label: 'Account' }].map((item, i) => (
                  <li key={item.to} className="split__mask">
                    <motion.div initial={{ y: '110%' }} animate={{ y: 0 }} exit={{ y: '110%' }} transition={{ delay: 0.25 + i * 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
                      <NavLink to={item.to} className="menu__link" onClick={() => setMenuOpen(false)}>{item.label}</NavLink>
                    </motion.div>
                  </li>
                ))}
              </ul>
              <motion.div className="menu__foot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                <p className="caps">Collections</p>
                <div className="menu__cols">
                  {COLLECTIONS.map((c) => <Link key={c.slug} to={c.slug === 'gifting' ? '/gifting' : `/collections/${c.slug}`} onClick={() => setMenuOpen(false)}>{c.name}</Link>)}
                </div>
                <p className="faint">hello@noore.in · +91 98765 43210</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
