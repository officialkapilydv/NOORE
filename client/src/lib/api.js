/**
 * API client with graceful degradation.
 * When the Node API is unreachable (e.g. the storefront is opened on its own), read
 * requests fall back to the shared catalog bundled at build time so the site still renders.
 */
import fallbackProducts from '@shared/catalog/products.json';
import fallbackCollections from '@shared/catalog/collections.json';
import fallbackSettings from '@shared/content/settings.json';
import fallbackPages from '@shared/content/pages.json';

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'noore.token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* private mode */ }
};

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

let offline = false;
const offlineListeners = new Set();
export const onOfflineChange = (fn) => { offlineListeners.add(fn); return () => offlineListeners.delete(fn); };
export const isOffline = () => offline;
function setOffline(v) {
  if (offline === v) return;
  offline = v;
  offlineListeners.forEach((fn) => fn(v));
}

const READ_TIMEOUT = 12_000;

export async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  const token = getToken();
  // A hung read would leave a page on its spinner forever; time it out so it falls back instead.
  // Writes are left alone so a slow order is never silently retried.
  if (!signal && method === 'GET' && typeof AbortSignal !== 'undefined' && AbortSignal.timeout) signal = AbortSignal.timeout(READ_TIMEOUT);
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Could not reach the NOORÉ server.', 0, null);
  }
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data);
  setOffline(false);
  return data;
}

/* ─── Fallback helpers (mirror server/services/catalog.js) ─── */
const SORTERS = {
  featured: (a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
  newest: (a, b) => Number(b.badges.includes('New')) - Number(a.badges.includes('New')),
  'name-asc': (a, b) => a.name.localeCompare(b.name),
};
function localQuery({ collection, family, q, sort = 'featured', featured, limit, exclude, minPrice, maxPrice } = {}) {
  let list = fallbackProducts;
  if (collection) list = list.filter((p) => String(collection).split(',').includes(p.collection));
  if (family) list = list.filter((p) => String(family).split(',').includes(p.family));
  if (featured) list = list.filter((p) => p.featured);
  if (minPrice) list = list.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) list = list.filter((p) => p.price <= Number(maxPrice));
  if (exclude) list = list.filter((p) => p.slug !== exclude);
  if (q) {
    const n = q.toLowerCase();
    list = list.filter((p) => [p.name, p.tagline, p.family, ...Object.values(p.notes).flat()].join(' ').toLowerCase().includes(n));
    if (sort !== 'featured' && SORTERS[sort]) list = [...list].sort(SORTERS[sort]);
  } else list = [...list].sort(SORTERS[sort] || SORTERS.featured);
  if (limit) list = list.slice(0, Number(limit));
  return list;
}
const toQuery = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '' && v !== false) sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

async function withFallback(fn, fallback) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError && err.status === 0) {
      setOffline(true);
      return fallback();
    }
    throw err;
  }
}

/* ─── Public API ─── */
export const api = {
  health: () => request('/api/health'),
  meta: () => withFallback(() => request('/api/meta'), () => ({ shipping: { freeOver: 1999, flat: 99, giftWrap: 149 }, families: [] })),

  products: (params) => withFallback(
    () => request(`/api/products${toQuery(params)}`),
    () => ({ items: localQuery(params), total: localQuery(params).length, facets: { families: [...new Set(fallbackProducts.map((p) => p.family))], priceRange: { min: 549, max: 7999 } } }),
  ),
  suggest: (q, signal) => withFallback(
    () => request(`/api/products/suggest?q=${encodeURIComponent(q)}`, { signal }),
    () => ({ items: localQuery({ q, limit: 6 }) }),
  ),
  product: (slug) => withFallback(
    () => request(`/api/products/${slug}`),
    () => {
      const p = fallbackProducts.find((x) => x.slug === slug);
      if (!p) throw new ApiError('We could not find that candle.', 404);
      const col = fallbackCollections.find((c) => c.slug === p.collection);
      return {
        ...p,
        specs: col?.specs || {},
        collectionMeta: col ? { slug: col.slug, name: col.name, title: col.title, tone: col.tone } : null,
        includesProducts: (p.includes || []).map((s) => fallbackProducts.find((x) => x.slug === s)).filter(Boolean),
        reviews: [],
        related: localQuery({ collection: p.collection, exclude: slug, limit: 4 }),
      };
    },
  ),
  collections: () => withFallback(
    () => request('/api/collections'),
    () => ({ items: fallbackCollections.map((c) => ({ ...c, count: fallbackProducts.filter((p) => p.collection === c.slug).length, preview: localQuery({ collection: c.slug, limit: 3 }) })) }),
  ),
  collection: (slug, params) => withFallback(
    () => request(`/api/collections/${slug}${toQuery(params)}`),
    () => {
      const c = fallbackCollections.find((x) => x.slug === slug);
      if (!c) throw new ApiError('That collection does not exist.', 404);
      const products = localQuery({ collection: slug, ...params });
      return { ...c, products, count: products.length };
    },
  ),

  priceCart: (payload) => request('/api/cart/price', { method: 'POST', body: payload }),
  coupons: () => withFallback(() => request('/api/cart/coupons'), () => ({ items: [] })),
  placeOrder: (payload) => request('/api/orders', { method: 'POST', body: payload }),
  order: (orderNumber, email) => request(`/api/orders/${orderNumber}${toQuery({ email })}`),
  myOrders: () => request('/api/orders/mine'),

  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  me: () => request('/api/auth/me'),

  settings: () => withFallback(() => request('/api/settings'), () => fallbackSettings),
  pages: () => withFallback(() => request('/api/pages'), () => ({ items: fallbackPages.map(({ body, ...p }) => p) })),
  page: (slug) => withFallback(
    () => request(`/api/pages/${slug}`),
    () => {
      const p = fallbackPages.find((x) => x.slug === slug);
      if (!p) throw new ApiError('Page not found.', 404);
      return p;
    },
  ),

  subscribe: (email, source) => request('/api/newsletter', { method: 'POST', body: { email, source } }),
  contact: (payload) => request('/api/contact', { method: 'POST', body: payload }),
  giftingEnquiry: (payload) => request('/api/gifting/enquiry', { method: 'POST', body: payload }),
  reviews: (slug) => withFallback(() => request(`/api/reviews/${slug}`), () => ({ items: [] })),
  addReview: (slug, payload) => request(`/api/reviews/${slug}`, { method: 'POST', body: payload }),
};

export { fallbackProducts, fallbackCollections };
