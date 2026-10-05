/** Newsletter, contact, corporate gifting enquiries and product reviews. */
import { Router } from 'express';
import { z } from 'zod';
import { collection } from '../db/store.js';
import { catalog } from '../services/catalog.js';
import { HttpError, validate } from '../middleware/errors.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { uid } from '../utils/ids.js';

const router = Router();

router.post('/newsletter', rateLimit({ max: 10 }), validate(z.object({
  email: z.string().trim().email('Please enter a valid email.'),
  source: z.string().max(40).optional().default('footer'),
})), async (req, res) => {
  const email = req.body.email.toLowerCase();
  const list = collection('newsletter');
  const existing = await list.find((s) => s.email === email);
  if (existing) return res.json({ ok: true, message: 'You are already on the list — we will be in touch.' });
  await list.insert({ id: uid('sub_'), email, source: req.body.source });
  res.status(201).json({ ok: true, message: 'Welcome to NOORÉ. Your 10% code: WELCOME10' });
});

router.post('/contact', rateLimit({ max: 8 }), validate(z.object({
  name: z.string().trim().min(2, 'Please tell us your name.').max(80),
  email: z.string().trim().email('Please enter a valid email.'),
  topic: z.enum(['order', 'product', 'gifting', 'wholesale', 'press', 'other']).default('other'),
  message: z.string().trim().min(10, 'Tell us a little more (at least 10 characters).').max(2000),
})), async (req, res) => {
  const ticket = await collection('contacts').insert({ id: uid('msg_'), ...req.body, status: 'open' });
  res.status(201).json({ ok: true, id: ticket.id, message: 'Thank you — we reply within one working day.' });
});

router.post('/gifting/enquiry', rateLimit({ max: 8 }), validate(z.object({
  company: z.string().trim().min(2, 'Please enter your company name.').max(120),
  name: z.string().trim().min(2, 'Please tell us your name.').max(80),
  email: z.string().trim().email('Please enter a valid work email.'),
  phone: z.string().trim().max(20).optional().default(''),
  quantity: z.coerce.number().int().min(10, 'Corporate orders start at 10 pieces.').max(100000),
  budgetPerGift: z.coerce.number().min(500).max(100000).optional(),
  occasion: z.string().trim().max(80).optional().default(''),
  deliveryBy: z.string().trim().max(40).optional().default(''),
  branding: z.boolean().optional().default(false),
  message: z.string().trim().max(2000).optional().default(''),
})), async (req, res) => {
  const enquiry = await collection('enquiries').insert({ id: uid('enq_'), ...req.body, status: 'new' });
  res.status(201).json({ ok: true, id: enquiry.id, message: 'Our gifting studio will send a proposal within 48 hours.' });
});

router.get('/reviews/:slug', async (req, res) => {
  const items = await collection('reviews').filter((r) => r.productSlug === req.params.slug && r.approved !== false);
  res.json({ items: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
});

router.post('/reviews/:slug', rateLimit({ max: 5 }), validate(z.object({
  name: z.string().trim().min(2).max(60),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(80),
  body: z.string().trim().min(10, 'Please write at least a sentence.').max(1200),
})), async (req, res) => {
  const product = catalog.product(req.params.slug);
  if (!product) throw new HttpError(404, 'Unknown product.');
  const review = await collection('reviews').insert({ id: uid('rev_'), productSlug: product.slug, ...req.body, approved: true, verified: false });
  res.status(201).json(review);
});

export default router;
