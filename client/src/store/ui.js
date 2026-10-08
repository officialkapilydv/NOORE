import { create } from 'zustand';

let toastId = 0;

export const useUI = create((set, get) => ({
  preloaderDone:
    (typeof location !== 'undefined' && /[?&]nointro/.test(location.search)) ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('noore.preloaded') === '1'),
  finishPreloader: () => {
    try { sessionStorage.setItem('noore.preloaded', '1'); } catch { /* ignore */ }
    set({ preloaderDone: true });
  },

  // False while a page-transition curtain is moving; heavy work (WebGL) waits for it.
  pageSettled: true,
  setPageSettled: (pageSettled) => set({ pageSettled }),

  menuOpen: false,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),

  cursor: { variant: 'default', label: '' },
  setCursor: (variant = 'default', label = '') => set({ cursor: { variant, label } }),

  toasts: [],
  toast: (message, { type = 'info', duration = 3200 } = {}) => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().dismissToast(id), duration);
    return id;
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  flyers: [],
  fly: (flyer) => {
    const id = ++toastId;
    set((s) => ({ flyers: [...s.flyers, { id, ...flyer }] }));
    setTimeout(() => set((s) => ({ flyers: s.flyers.filter((f) => f.id !== id) })), 1100);
  },

  cartIconRect: null,
  setCartIconRect: (cartIconRect) => set({ cartIconRect }),
}));
