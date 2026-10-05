import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const lineKey = (slug, sizeId) => `${slug}::${sizeId}`;

export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      couponCode: '',
      giftWrap: false,
      lastAdded: null,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      add: (product, size, quantity = 1) => {
        const key = lineKey(product.slug, size.id);
        set((s) => {
          const existing = s.items.find((i) => i.key === key);
          const items = existing
            ? s.items.map((i) => (i.key === key ? { ...i, quantity: Math.min(10, i.quantity + quantity) } : i))
            : [
                ...s.items,
                {
                  key,
                  slug: product.slug,
                  name: product.name,
                  collection: product.collection,
                  image: product.image,
                  vessel: product.vessel,
                  sizeId: size.id,
                  sizeLabel: `${size.label} · ${size.weight}`,
                  unitPrice: size.price,
                  quantity,
                },
              ];
          return { items, lastAdded: { key, at: Date.now() } };
        });
      },
      setQuantity: (key, quantity) =>
        set((s) => ({
          items: quantity <= 0 ? s.items.filter((i) => i.key !== key) : s.items.map((i) => (i.key === key ? { ...i, quantity: Math.min(10, quantity) } : i)),
        })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [], couponCode: '', giftWrap: false }),
      setCoupon: (couponCode) => set({ couponCode }),
      setGiftWrap: (giftWrap) => set({ giftWrap }),

      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
      subtotal: () => get().items.reduce((n, i) => n + i.unitPrice * i.quantity, 0),
      toPayload: () => get().items.map((i) => ({ slug: i.slug, sizeId: i.sizeId, quantity: i.quantity })),
    }),
    {
      name: 'noore.cart',
      partialize: (s) => ({ items: s.items, couponCode: s.couponCode, giftWrap: s.giftWrap }),
    },
  ),
);
