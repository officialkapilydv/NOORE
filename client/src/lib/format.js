const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatPrice = (value) => inr.format(Number(value) || 0);

export const formatDate = (iso, opts = {}) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...opts });

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export const cx = (...parts) => parts.filter(Boolean).join(' ');

export const COLLECTION_LABEL = {
  essentials: 'Essentials',
  premium: 'Premium',
  luxury: 'Luxury',
  gifting: 'Gifting',
};

export const FAMILY_LABEL = {
  floral: 'Floral',
  woody: 'Woody',
  fresh: 'Fresh',
  amber: 'Amber & Oriental',
  citrus: 'Citrus',
  gourmand: 'Gourmand',
  herbal: 'Herbal',
  set: 'Gift set',
};

export const slugify = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Lighten/darken a hex colour by a percentage (-1..1). */
export function shade(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  const to = (c) => Math.round((t - c) * p + c);
  return `#${((1 << 24) + (to(r) << 16) + (to(g) << 8) + to(b)).toString(16).slice(1)}`;
}

export function isDark(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55;
}
