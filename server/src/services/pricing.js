import { config } from '../config.js';
import { catalog } from './catalog.js';
import { findCoupon } from './coupons.js';
import { getSettings } from './settings.js';

export class PricingError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
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
  return rawItems.map((raw) => {
    const product = catalog.product(raw.slug);
    if (!product) throw new PricingError(`Unknown product: ${raw.slug}`);
    const defaultSize = product.sizes.find((s) => s.id === 'classic') || product.sizes[0];
    const size = product.sizes.find((s) => s.id === (raw.sizeId || defaultSize.id));
    if (!size) throw new PricingError(`Unknown size "${raw.sizeId}" for ${product.name}`);
    const quantity = Math.max(1, Math.min(10, Number(raw.quantity) || 1));
    if (product.stock < quantity) throw new PricingError(`Only ${product.stock} of ${product.name} left in stock.`);
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
}

export function applyCoupon(code, lines, subtotal) {
  if (!code) return { discount: 0, coupon: null, freeShipping: false };
  const coupon = findCoupon(code);
  if (!coupon || coupon.active === false) throw new PricingError('That code is not valid.');
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) throw new PricingError('That code has expired.');
  if (coupon.maxUses && (coupon.usageCount || 0) >= coupon.maxUses) throw new PricingError('That code has been fully redeemed.');
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    throw new PricingError(`This code needs a subtotal of at least ₹${Number(coupon.minSubtotal).toLocaleString('en-IN')}.`);
  }
  if (coupon.minItems && lines.reduce((n, l) => n + l.quantity, 0) < coupon.minItems) {
    throw new PricingError(`This code needs at least ${coupon.minItems} candles in your bag.`);
  }
  let eligible = subtotal;
  if (coupon.collections?.length) {
    eligible = lines.filter((l) => coupon.collections.includes(l.collection)).reduce((s, l) => s + l.lineTotal, 0);
    if (eligible === 0) throw new PricingError(`This code only applies to ${coupon.collections.join(', ')} candles.`);
  }
  let discount = 0;
  if (coupon.type === 'percent') discount = Math.round((eligible * Number(coupon.value)) / 100);
  if (coupon.type === 'flat') discount = Math.min(Number(coupon.value), subtotal);
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
