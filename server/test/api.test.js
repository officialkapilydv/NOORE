/**
 * API tests — run with `npm test` (node:test, no extra dependencies).
 * Uses an isolated DATA_DIR so the real store is never touched.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = await fs.mkdtemp(path.join(os.tmpdir(), 'noore-test-'));
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const { loadSettings } = await import('../src/services/settings.js');
const { loadCoupons } = await import('../src/services/coupons.js');
const { loadCatalog, queryProducts, relatedProducts } = await import('../src/services/catalog.js');
const { priceCart, PricingError } = await import('../src/services/pricing.js');
const { createApp } = await import('../src/app.js');
const { seedAdmin } = await import('../src/routes/admin/index.js');

let server;
let base;
let adminToken;
const json = (res) => res.json();
const post = (p, body, headers = {}) => fetch(`${base}${p}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

before(async () => {
  await loadSettings();
  await loadCoupons();
  await loadCatalog();
  const creds = await seedAdmin();
  const app = createApp();
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
  const login = await post('/api/admin/auth/login', { email: creds.email, password: creds.password }).then(json);
  adminToken = login.token;
});

after(async () => {
  server?.close();
  await fs.rm(process.env.DATA_DIR, { recursive: true, force: true });
});

test('catalog seeds 21 products and searches by note', () => {
  assert.equal(queryProducts({}).length, 21);
  const rose = queryProducts({ q: 'rose' }).map((p) => p.slug);
  assert.ok(rose.includes('rose-petal') && rose.includes('velvet-rose'));
  assert.equal(queryProducts({ collection: 'luxury', sort: 'price-asc' })[0].slug, 'tea-and-bergamot');
  assert.equal(relatedProducts('royal-oud', 3).length, 3);
});

test('pricing: shipping threshold, gift wrap and coupon rules', () => {
  const small = priceCart({ items: [{ slug: 'vanilla-bliss', sizeId: 'petite', quantity: 1 }] });
  assert.equal(small.subtotal, 549);
  assert.equal(small.shipping, 99);
  const big = priceCart({ items: [{ slug: 'royal-oud', sizeId: 'classic', quantity: 1 }], giftWrap: true });
  assert.equal(big.shipping, 0);
  assert.equal(big.giftWrapFee, 149);
  assert.equal(big.total, 3999 + 149);
  const lux = priceCart({ items: [{ slug: 'royal-oud', quantity: 1 }, { slug: 'vanilla-bliss', quantity: 1 }], couponCode: 'noore15' });
  assert.equal(lux.discount, Math.round(3999 * 0.15), 'NOORE15 only discounts luxury lines');
  assert.throws(() => priceCart({ items: [{ slug: 'vanilla-bliss' }], couponCode: 'NOPE' }), PricingError);
  assert.throws(() => priceCart({ items: [{ slug: 'vanilla-bliss' }], couponCode: 'BOX10' }), /at least 3 candles/);
  assert.throws(() => priceCart({ items: [{ slug: 'orchid-noir', quantity: 9 }] }), /left in stock/);
});

test('POST /api/orders validates, prices server-side and declines bad cards', async () => {
  const bad = await post('/api/orders', { email: 'nope', items: [] });
  assert.equal(bad.status, 422);
  const order = {
    email: 'test@example.com',
    items: [{ slug: 'amber-and-saffron', sizeId: 'classic', quantity: 2 }],
    shipping: { fullName: 'Test Person', phone: '9876543210', line1: '12 Park Street', city: 'Kolkata', state: 'West Bengal', postalCode: '700016' },
    paymentMethod: 'card',
    card: { last4: '4242' },
  };
  const ok = await post('/api/orders', order);
  assert.equal(ok.status, 201);
  const placed = await ok.json();
  assert.match(placed.orderNumber, /^NR-\d{4}-[A-Z0-9]{6}$/);
  assert.equal(placed.total, 1799 * 2);
  assert.equal(placed.payment.status, 'paid');
  assert.equal(placed.address.fullName, 'Test Person', 'shipping address is stored separately from the shipping fee');
  assert.equal(placed.shipping, 0);
  const declined = await post('/api/orders', { ...order, card: { last4: '0000' } });
  assert.equal(declined.status, 402);
  // stock was decremented and persisted
  const product = await fetch(`${base}/api/products/amber-and-saffron`).then(json);
  assert.equal(product.stock, 25 - 2);
});

test('admin routes require auth and can edit products, settings, pages and coupons', async () => {
  assert.equal((await fetch(`${base}/api/admin/overview`)).status, 401);
  const auth = { Authorization: `Bearer ${adminToken}` };

  const patched = await fetch(`${base}/api/admin/products/royal-oud`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify({ published: false }) }).then(json);
  assert.equal(patched.published, false);
  assert.equal((await fetch(`${base}/api/products/royal-oud`)).status, 404, 'unpublished products are hidden from the storefront');
  assert.equal((await fetch(`${base}/api/admin/products/royal-oud`, { headers: auth })).status, 200);

  const settings = await fetch(`${base}/api/admin/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify({ shipping: { freeOver: 5000 }, contact: { phone: '+91 11111 11111' } }) }).then(json);
  assert.equal(settings.shipping.freeOver, 5000);
  assert.equal(settings.brand.name, 'NOORÉ', 'partial updates keep the rest');
  const pub = await fetch(`${base}/api/settings`).then(json);
  assert.equal(pub.contact.phone, '+91 11111 11111');
  const priced = await post('/api/cart/price', { items: [{ slug: 'gulab-and-oud', quantity: 1 }] }).then(json);
  assert.equal(priced.shipping, 99, 'raised free-shipping threshold applies to pricing immediately');

  const page = await post('/api/admin/pages', { slug: 'wholesale', title: 'Wholesale', body: '# Wholesale\n\nHello', published: false, showInFooter: false }, auth);
  assert.equal(page.status, 201);
  assert.equal((await fetch(`${base}/api/pages/wholesale`)).status, 404, 'unpublished pages are hidden');
  const dup = await post('/api/admin/pages', { slug: 'wholesale', title: 'Dup', body: 'x' }, auth);
  assert.equal(dup.status, 409);

  const coupon = await post('/api/admin/coupons', { code: 'test50', label: 'Half off', type: 'percent', value: 50 }, auth);
  assert.equal(coupon.status, 201);
  const withCoupon = await post('/api/cart/price', { items: [{ slug: 'lemongrass', quantity: 1 }], couponCode: 'TEST50' }).then(json);
  assert.equal(withCoupon.discount, Math.round(899 * 0.5));

  const invalid = await post('/api/admin/products', { name: 'X' }, auth);
  assert.equal(invalid.status, 422);
  const created = await post('/api/admin/products', {
    name: 'Test Candle', collection: 'essentials', family: 'floral', price: 500,
    sizes: [{ id: 'classic', label: 'Classic', weight: '200 g', burnTime: '40 h', price: 500 }],
    vessel: { type: 'glass', color: '#d98a3a', wax: '#f4dfb7', lid: 'none', labelBg: '#f6ead3', labelText: '#4a2a10', accent: '#d9b162', glow: '#ffb15c' },
  }, auth);
  assert.equal(created.status, 201);
  const body = await created.json();
  assert.equal(body.slug, 'test-candle');
  assert.equal((await fetch(`${base}/api/products/test-candle`)).status, 200);
});
