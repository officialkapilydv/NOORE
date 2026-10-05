/** Admin · orders, customers, subscribers, enquiries, contact messages, reviews. */
import { Router } from 'express';
import { z } from 'zod';
import { collection } from '../../db/store.js';
import { HttpError, validate } from '../../middleware/errors.js';

const router = Router();
const ORDER_STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'];

const paginate = (items, req) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(100, Math.max(5, Number(req.query.perPage) || 25));
  return { items: items.slice((page - 1) * perPage, page * perPage), total: items.length, page, perPage, pages: Math.ceil(items.length / perPage) };
};
const newestFirst = (a, b) => String(b.createdAt).localeCompare(String(a.createdAt));

/* ─── Orders ─── */
router.get('/orders', async (req, res) => {
  let orders = (await collection('orders').all()).sort(newestFirst);
  if (req.query.status) orders = orders.filter((o) => o.status === req.query.status);
  if (req.query.q) {
    const q = String(req.query.q).toLowerCase();
    orders = orders.filter((o) => [o.orderNumber, o.email, o.address?.fullName, o.address?.city, o.address?.phone].join(' ').toLowerCase().includes(q));
  }
  res.json({ ...paginate(orders, req), statuses: ORDER_STATUSES });
});

router.get('/orders/:id', async (req, res) => {
  const order = await collection('orders').find((o) => o.id === req.params.id || o.orderNumber === req.params.id.toUpperCase());
  if (!order) throw new HttpError(404, 'Order not found.');
  res.json(order);
});

router.patch('/orders/:id', validate(z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  trackingNumber: z.string().trim().max(60).optional(),
  trackingUrl: z.string().trim().max(300).optional(),
  internalNote: z.string().trim().max(1000).optional(),
})), async (req, res) => {
  const orders = collection('orders');
  const order = await orders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id.toUpperCase());
  if (!order) throw new HttpError(404, 'Order not found.');
  const patch = { ...req.body };
  if (req.body.status && req.body.status !== order.status) {
    patch.timeline = [...(order.timeline || []), { status: req.body.status, at: new Date().toISOString(), label: `Order ${req.body.status}`, by: req.admin?.name || 'admin' }];
    if (req.body.status === 'delivered' && order.payment?.method === 'cod') patch.payment = { ...order.payment, status: 'paid' };
    if (['cancelled', 'refunded'].includes(req.body.status)) patch.payment = { ...order.payment, status: req.body.status === 'refunded' ? 'refunded' : order.payment.status };
  }
  res.json(await orders.update((o) => o.id === order.id, patch));
});

/* ─── Customers & subscribers ─── */
router.get('/customers', async (req, res) => {
  const users = await collection('users').all();
  const orders = await collection('orders').all();
  const items = users.map((u) => {
    const mine = orders.filter((o) => o.userId === u.id || o.email === u.email);
    return { id: u.id, name: u.name, email: u.email, createdAt: u.createdAt, orders: mine.length, spent: mine.reduce((s, o) => s + o.total, 0), lastOrderAt: mine.sort(newestFirst)[0]?.createdAt || null };
  }).sort(newestFirst);
  res.json(paginate(items, req));
});

router.get('/subscribers', async (req, res) => {
  const items = (await collection('newsletter').all()).sort(newestFirst);
  if (req.query.format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="noore-subscribers.csv"');
    return res.send(['email,source,createdAt', ...items.map((s) => `${s.email},${s.source || ''},${s.createdAt}`)].join('\n'));
  }
  res.json(paginate(items, req));
});
router.delete('/subscribers/:id', async (req, res) => {
  if (!(await collection('newsletter').remove((s) => s.id === req.params.id))) throw new HttpError(404, 'Subscriber not found.');
  res.json({ ok: true });
});

/* ─── Enquiries (corporate gifting) & contact messages ─── */
for (const [name, statuses] of [['enquiries', ['new', 'in-progress', 'proposal-sent', 'won', 'lost']], ['contacts', ['open', 'replied', 'closed']]]) {
  router.get(`/${name}`, async (req, res) => {
    let items = (await collection(name).all()).sort(newestFirst);
    if (req.query.status) items = items.filter((i) => i.status === req.query.status);
    res.json({ ...paginate(items, req), statuses });
  });
  router.patch(`/${name}/:id`, validate(z.object({ status: z.enum(statuses).optional(), internalNote: z.string().trim().max(1000).optional() })), async (req, res) => {
    const updated = await collection(name).update((i) => i.id === req.params.id, req.body);
    if (!updated) throw new HttpError(404, 'Not found.');
    res.json(updated);
  });
  router.delete(`/${name}/:id`, async (req, res) => {
    if (!(await collection(name).remove((i) => i.id === req.params.id))) throw new HttpError(404, 'Not found.');
    res.json({ ok: true });
  });
}

/* ─── Reviews ─── */
router.get('/reviews', async (req, res) => {
  let items = (await collection('reviews').all()).sort(newestFirst);
  if (req.query.slug) items = items.filter((r) => r.productSlug === req.query.slug);
  res.json(paginate(items, req));
});
router.patch('/reviews/:id', validate(z.object({ approved: z.boolean().optional(), verified: z.boolean().optional(), reply: z.string().trim().max(1000).optional() })), async (req, res) => {
  const updated = await collection('reviews').update((r) => r.id === req.params.id, req.body);
  if (!updated) throw new HttpError(404, 'Review not found.');
  res.json(updated);
});
router.delete('/reviews/:id', async (req, res) => {
  if (!(await collection('reviews').remove((r) => r.id === req.params.id))) throw new HttpError(404, 'Review not found.');
  res.json({ ok: true });
});

export default router;
