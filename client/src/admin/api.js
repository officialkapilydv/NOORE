/** Admin API client — separate token from the storefront customer session. */
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const KEY = 'noore.admin.token';

export const adminToken = {
  get: () => { try { return localStorage.getItem(KEY); } catch { return null; } },
  set: (t) => { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch { /* ignore */ } },
};

export class AdminApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

const unauthorizedListeners = new Set();
export const onUnauthorized = (fn) => { unauthorizedListeners.add(fn); return () => unauthorizedListeners.delete(fn); };

export async function adminRequest(path, { method = 'GET', body, formData } = {}) {
  const token = adminToken.get();
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData || (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new AdminApiError('Cannot reach the NOORÉ API. Is the server running on port 4000?', 0);
  }
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (res.status === 401 && !path.includes('/auth/login')) unauthorizedListeners.forEach((fn) => fn());
  if (!res.ok) throw new AdminApiError(data?.error || `Request failed (${res.status})`, res.status, data);
  return data;
}

const q = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const adminApi = {
  login: (payload) => adminRequest('/api/admin/auth/login', { method: 'POST', body: payload }),
  me: () => adminRequest('/api/admin/auth/me'),
  overview: () => adminRequest('/api/admin/overview'),

  admins: {
    list: () => adminRequest('/api/admin/admins'),
    create: (payload) => adminRequest('/api/admin/admins', { method: 'POST', body: payload }),
    password: (id, password) => adminRequest(`/api/admin/admins/${id}/password`, { method: 'PATCH', body: { password } }),
    remove: (id) => adminRequest(`/api/admin/admins/${id}`, { method: 'DELETE' }),
  },
  products: {
    list: (params) => adminRequest(`/api/admin/products${q(params)}`),
    get: (slug) => adminRequest(`/api/admin/products/${slug}`),
    create: (payload) => adminRequest('/api/admin/products', { method: 'POST', body: payload }),
    update: (slug, payload) => adminRequest(`/api/admin/products/${slug}`, { method: 'PUT', body: payload }),
    patch: (slug, payload) => adminRequest(`/api/admin/products/${slug}`, { method: 'PATCH', body: payload }),
    duplicate: (slug) => adminRequest(`/api/admin/products/${slug}/duplicate`, { method: 'POST' }),
    reorder: (slugs) => adminRequest('/api/admin/products/reorder', { method: 'POST', body: { slugs } }),
    remove: (slug) => adminRequest(`/api/admin/products/${slug}`, { method: 'DELETE' }),
  },
  collections: {
    list: () => adminRequest('/api/admin/collections'),
    update: (slug, payload) => adminRequest(`/api/admin/collections/${slug}`, { method: 'PUT', body: payload }),
  },
  coupons: {
    list: () => adminRequest('/api/admin/coupons'),
    create: (payload) => adminRequest('/api/admin/coupons', { method: 'POST', body: payload }),
    update: (code, payload) => adminRequest(`/api/admin/coupons/${code}`, { method: 'PUT', body: payload }),
    remove: (code) => adminRequest(`/api/admin/coupons/${code}`, { method: 'DELETE' }),
  },
  orders: {
    list: (params) => adminRequest(`/api/admin/orders${q(params)}`),
    get: (id) => adminRequest(`/api/admin/orders/${id}`),
    update: (id, payload) => adminRequest(`/api/admin/orders/${id}`, { method: 'PATCH', body: payload }),
  },
  customers: { list: (params) => adminRequest(`/api/admin/customers${q(params)}`) },
  subscribers: {
    list: (params) => adminRequest(`/api/admin/subscribers${q(params)}`),
    remove: (id) => adminRequest(`/api/admin/subscribers/${id}`, { method: 'DELETE' }),
  },
  enquiries: {
    list: (params) => adminRequest(`/api/admin/enquiries${q(params)}`),
    update: (id, payload) => adminRequest(`/api/admin/enquiries/${id}`, { method: 'PATCH', body: payload }),
    remove: (id) => adminRequest(`/api/admin/enquiries/${id}`, { method: 'DELETE' }),
  },
  contacts: {
    list: (params) => adminRequest(`/api/admin/contacts${q(params)}`),
    update: (id, payload) => adminRequest(`/api/admin/contacts/${id}`, { method: 'PATCH', body: payload }),
    remove: (id) => adminRequest(`/api/admin/contacts/${id}`, { method: 'DELETE' }),
  },
  reviews: {
    list: (params) => adminRequest(`/api/admin/reviews${q(params)}`),
    update: (id, payload) => adminRequest(`/api/admin/reviews/${id}`, { method: 'PATCH', body: payload }),
    remove: (id) => adminRequest(`/api/admin/reviews/${id}`, { method: 'DELETE' }),
  },
  media: {
    list: () => adminRequest('/api/admin/media'),
    upload: (files) => {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('files', f));
      return adminRequest('/api/admin/media', { method: 'POST', formData: fd });
    },
    remove: (name) => adminRequest(`/api/admin/media/${encodeURIComponent(name)}`, { method: 'DELETE' }),
  },
  pages: {
    list: () => adminRequest('/api/admin/pages'),
    get: (slug) => adminRequest(`/api/admin/pages/${slug}`),
    create: (payload) => adminRequest('/api/admin/pages', { method: 'POST', body: payload }),
    update: (slug, payload) => adminRequest(`/api/admin/pages/${slug}`, { method: 'PUT', body: payload }),
    remove: (slug) => adminRequest(`/api/admin/pages/${slug}`, { method: 'DELETE' }),
  },
  settings: {
    get: () => adminRequest('/api/admin/settings'),
    update: (payload) => adminRequest('/api/admin/settings', { method: 'PUT', body: payload }),
    reset: () => adminRequest('/api/admin/settings/reset', { method: 'POST' }),
  },
};

/** Map zod issues ({path, message}) into a flat {path: message} object. */
export const issuesToErrors = (err) => Object.fromEntries((err?.payload?.issues || []).map((i) => [i.path, i.message]));
