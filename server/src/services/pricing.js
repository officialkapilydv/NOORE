import { config } from '../config.js';
import { catalog } from './catalog.js';
import { findCoupon } from './coupons.js';
import { getSettings } from './settings.js';

export class PricingError extends Error {
  /** `field: 'coupon'` or `slug` tell the client which part of the bag the problem is about. */
  constructor(message, status = 400, { field, slug } = {}) {
    super(message);
    this.status = status;
    this.field = field;
    this.slug = slug;
  }

  toJSON() {
    return { error: this.message, field: this.field, slug: this.slug };
  }
}

/** Date-only expiries ("2026-10-31") last until the end of that day in India, not UTC midnight. */
export function couponExpiry(value) {
  if (!value) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999+05:30` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const shippingConfig = () => ({
  freeOver: Number(getSettings()?.shipping?.freeOver ?? config.freeShippingThreshold),
  flat: Number(getSettings()?.shipping?.flat ?? config.shippingFlat),
  giftWrap: Number(getSettings()?.shipping?.giftWrap ?? config.giftWrapFee),
});

/**
 * Normalises raw cart lines from the client into trusted, server-priced lines.
 * The client only sends identifiers and quantities — never prices.
 */
export function resolveLines(rawItems = []) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) throw new PricingError('Your cart is empty.');
  if (rawItems.length > 30) throw new PricingError('Your bag has too many lines — please split it into two orders.');
  const lines = rawItems.map((raw) => {
    const product = catalog.product(raw.slug);
    if (!product) throw new PricingError('One of the candles in your bag is no longer available.', 400, { slug: raw.slug });
    const defaultSize = product.sizes.find((s) => s.id === 'classic') || product.sizes[0];
    const size = product.sizes.find((s) => s.id === (raw.sizeId || defaultSize.id));
    if (!size) throw new PricingError(`Unknown size "${raw.sizeId}" for ${product.name}`, 400, { slug: product.slug });
    const quantity = Math.max(1, Math.min(10, Number(raw.quantity) || 1));
    return {
      slug: product.slug,
      name: product.name,
      collection: product.collection,
      image: product.image,
      vessel: product.vessel,
      sizeId: size.id,
      sizeLabel: `${size.label} · ${size.weight}`,
      unitPrice: Number(size.price),
      quantity,
      lineTotal: Number(size.price) * quantity,
    };
  });
  // Stock is per candle, not per size: two sizes of the same candle draw on the same pour.
  const wanted = new Map();
  for (const l of lines) wanted.set(l.slug, (wanted.get(l.slug) || 0) + l.quantity);
  for (const [slug, quantity] of wanted) {
    const product = catalog.product(slug);
    if (product.stock < quantity) {
      throw new PricingError(product.stock <= 0 ? `${product.name} is sold out.` : `Only ${product.stock} of ${product.name} left in stock.`, 400, { slug });
    }
  }
  return lines;
}

export function applyCoupon(code, lines, subtotal) {
  if (!code) return { discount: 0, coupon: null, freeShipping: false };
  const coupon = findCoupon(code);
  const fail = (message) => new PricingError(message, 400, { field: 'coupon' });
  if (!coupon || coupon.active === false) throw fail('That code is not valid.');
  const expiry = couponExpiry(coupon.expiresAt);
  if (expiry && expiry < new Date()) throw fail('That code has expired.');
  if (coupon.maxUses && (coupon.usageCount || 0) >= coupon.maxUses) throw fail('That code has been fully redeemed.');
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    throw fail(`This code needs a subtotal of at least ₹${Number(coupon.minSubtotal).toLocaleString('en-IN')}.`);
  }
  if (coupon.minItems && lines.reduce((n, l) => n + l.quantity, 0) < coupon.minItems) {
    throw fail(`This code needs at least ${coupon.minItems} candles in your bag.`);
  }
  let eligible = subtotal;
  if (coupon.collections?.length) {
    eligible = lines.filter((l) => coupon.collections.includes(l.collection)).reduce((s, l) => s + l.lineTotal, 0);
    if (eligible === 0) throw fail(`This code only applies to ${coupon.collections.join(', ')} candles.`);
  }
  let discount = 0;
  if (coupon.type === 'percent') discount = Math.min(eligible, Math.round((eligible * Number(coupon.value)) / 100));
  if (coupon.type === 'flat') discount = Math.min(Number(coupon.value), eligible);
  return { discount, coupon: { code: coupon.code, label: coupon.label }, freeShipping: coupon.type === 'shipping' };
}

export function priceCart({ items, couponCode, giftWrap = false }) {
  const ship = shippingConfig();
  const lines = resolveLines(items);
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const { discount, coupon, freeShipping } = applyCoupon(couponCode, lines, subtotal);
  const afterDiscount = subtotal - discount;
  const shipping = freeShipping || afterDiscount >= ship.freeOver ? 0 : ship.flat;
  const giftWrapFee = giftWrap ? ship.giftWrap : 0;
  const total = afterDiscount + shipping + giftWrapFee;
  return {
    lines,
    currency: config.currency,
    subtotal,
    discount,
    coupon,
    shipping,
    giftWrap: Boolean(giftWrap),
    giftWrapFee,
    total,
    freeShippingThreshold: ship.freeOver,
    amountToFreeShipping: Math.max(0, ship.freeOver - afterDiscount),
  };
}
