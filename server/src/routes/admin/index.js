import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { collection } from '../../db/store.js';
import { config } from '../../config.js';
import { catalog } from '../../services/catalog.js';
import { requireAdmin, signToken } from '../../middleware/auth.js';
import { HttpError, validate } from '../../middleware/errors.js';
import { rateLimit } from '../../middleware/rateLimit.js';
import { uid } from '../../utils/ids.js';
import catalogRouter from './catalog.js';
import operationsRouter from './operations.js';
import contentRouter from './content.js';

const router = Router();
const admins = collection('admins');

/** Create the first administrator from env (or sensible dev defaults) on boot. */
export async function seedAdmin() {
  if ((await admins.count()) > 0) return null;
  const email = (process.env.ADMIN_EMAIL || 'admin@noore.in').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'noore-admin-2026';
  await admins.insert({ id: uid('adm_'), name: process.env.ADMIN_NAME || 'Studio admin', email, passwordHash: await bcrypt.hash(password, 10), role: 'admin' });
  return { email, password };
}

const publicAdmin = (a) => ({ id: a.id, name: a.name, email: a.email, role: a.role, createdAt: a.createdAt });

/* ─── Auth ─── */
router.post('/auth/login', rateLimit({ max: 10 }), validate(z.object({
  email: z.string().trim().email('Please enter a valid email.'),
  password: z.string().min(1, 'Please enter your password.'),
})), async (req, res) => {
  const admin = await admins.find((a) => a.email === req.body.email.toLowerCase());
  if (!admin || !(await bcrypt.compare(req.body.password, admin.passwordHash))) throw new HttpError(401, 'Email or password is incorrect.');
  res.json({ token: signToken(admin, 'admin'), admin: publicAdmin(admin) });
});

router.use(requireAdmin);

router.get('/auth/me', async (req, res) => {
  const admin = req.admin.sub ? await admins.find((a) => a.id === req.admin.sub) : null;
  res.json({ admin: admin ? publicAdmin(admin) : { name: req.admin.name, role: 'admin' } });
});

router.get('/admins', async (req, res) => res.json({ items: (await admins.all()).map(publicAdmin) }));

router.post('/admins', validate(z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8, 'Use at least 8 characters.').max(128),
})), async (req, res) => {
  const email = req.body.email.toLowerCase();
  if (await admins.find((a) => a.email === email)) throw new HttpError(409, 'An admin with this email already exists.');
  const created = await admins.insert({ id: uid('adm_'), name: req.body.name, email, passwordHash: await bcrypt.hash(req.body.password, 10), role: 'admin' });
  res.status(201).json(publicAdmin(created));
});

router.patch('/admins/:id/password', validate(z.object({ password: z.string().min(8).max(128) })), async (req, res) => {
  const updated = await admins.update((a) => a.id === req.params.id, { passwordHash: await bcrypt.hash(req.body.password, 10) });
  if (!updated) throw new HttpError(404, 'Admin not found.');
  res.json({ ok: true });
});

router.delete('/admins/:id', async (req, res) => {
  if ((await admins.count()) <= 1) throw new HttpError(400, 'You cannot delete the last administrator.');
  if (req.admin.sub === req.params.id) throw new HttpError(400, 'You cannot delete your own account while signed in.');
  await admins.remove((a) => a.id === req.params.id);
  res.json({ ok: true });
});

/* ─── Dashboard ─── */
router.get('/overview', async (req, res) => {
  const orders = await collection('orders').all();
  // Cancelled and refunded orders count as orders, but not as money in.
  const live = orders.filter((o) => !['cancelled', 'refunded'].includes(o.status));
  const paid = live.filter((o) => o.payment?.status === 'paid' || o.status === 'delivered');
  const since = (days) => new Date(Date.now() - days * 86_400_000).toISOString();
  const last30 = orders.filter((o) => o.createdAt >= since(30));
  const liveLast30 = live.filter((o) => o.createdAt >= since(30));
  const products = catalog.products({ includeUnpublished: true });
  const byDay = {};
  for (const o of last30) {
    const day = o.createdAt.slice(0, 10);
    byDay[day] = byDay[day] || { day, orders: 0, revenue: 0 };
    byDay[day].orders += 1;
    if (!['cancelled', 'refunded'].includes(o.status)) byDay[day].revenue += o.total;
  }
  const bestsellers = {};
  for (const o of orders) for (const l of o.lines) {
    bestsellers[l.slug] = bestsellers[l.slug] || { slug: l.slug, name: l.name, units: 0, revenue: 0 };
    bestsellers[l.slug].units += l.quantity;
    bestsellers[l.slug].revenue += l.lineTotal;
  }
  res.json({
    stats: {
      orders: orders.length,
      ordersLast30: last30.length,
      revenue: paid.reduce((s, o) => s + o.total, 0),
      revenueLast30: liveLast30.reduce((s, o) => s + o.total, 0),
      averageOrder: live.length ? Math.round(live.reduce((s, o) => s + o.total, 0) / live.length) : 0,
      pendingOrders: orders.filter((o) => ['placed', 'confirmed', 'packed'].includes(o.status)).length,
      subscribers: await collection('newsletter').count(),
      enquiries: await collection('enquiries').count((e) => e.status === 'new'),
      contacts: await collection('contacts').count((c) => c.status === 'open'),
      reviews: await collection('reviews').count(),
      products: products.length,
      unpublished: products.filter((p) => p.published === false).length,
      customers: await collection('users').count(),
    },
    recentOrders: orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    lowStock: products.filter((p) => p.stock <= 10).sort((a, b) => a.stock - b.stock).slice(0, 8).map((p) => ({ slug: p.slug, name: p.name, stock: p.stock, collection: p.collection, vessel: p.vessel })),
    salesByDay: Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day)),
    bestsellers: Object.values(bestsellers).sort((a, b) => b.units - a.units).slice(0, 6),
    env: { adminKeyConfigured: Boolean(config.adminKey) && config.adminKey !== 'noore-admin' },
  });
});

router.use(catalogRouter);
router.use(operationsRouter);
router.use(contentRouter);

export default router;
