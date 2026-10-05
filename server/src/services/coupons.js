import { collection } from '../db/store.js';

const DEFAULTS = [
  { code: 'WELCOME10', type: 'percent', value: 10, label: '10% off your first order', active: true },
  { code: 'NOORE15', type: 'percent', value: 15, label: '15% off Luxury candles', collections: ['luxury'], minSubtotal: 3000, active: true },
  { code: 'FREESHIP', type: 'shipping', value: 0, label: 'Free shipping', active: true },
  { code: 'GIFT500', type: 'flat', value: 500, label: '₹500 off orders over ₹5,000', minSubtotal: 5000, active: true },
  { code: 'BOX10', type: 'percent', value: 10, label: '10% off your build-your-own box', minItems: 3, active: true },
];

const repo = collection('coupons');
let coupons = [];

export async function loadCoupons() {
  coupons = await repo.all();
  if (coupons.length === 0) {
    for (const c of DEFAULTS) await repo.insert({ ...c, usageCount: 0 });
    coupons = await repo.all();
  }
  return coupons;
}

export const allCoupons = () => coupons;
export const findCoupon = (code) => coupons.find((c) => c.code === String(code || '').toUpperCase().trim()) || null;

export async function upsertCoupon(doc) {
  const code = doc.code.toUpperCase().trim();
  const existing = coupons.find((c) => c.code === code);
  const saved = existing
    ? await repo.update((c) => c.code === code, { ...doc, code })
    : await repo.insert({ usageCount: 0, active: true, ...doc, code });
  coupons = await repo.all();
  return saved;
}

export async function deleteCoupon(code) {
  const removed = await repo.remove((c) => c.code === code.toUpperCase());
  coupons = await repo.all();
  return removed;
}

export async function recordCouponUse(code) {
  if (!code) return;
  await repo.update((c) => c.code === code, { usageCount: (findCoupon(code)?.usageCount || 0) + 1 });
  coupons = await repo.all();
}
