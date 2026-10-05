/** Admin · settings (brand, contact, address, social, shipping, home copy, FAQ, legal) and content pages. */
import { Router } from 'express';
import { z } from 'zod';
import { getSettings, pagesRepo, resetSettings, updateSettings } from '../../services/settings.js';
import { HttpError, validate } from '../../middleware/errors.js';

const router = Router();
const str = (max = 300) => z.string().trim().max(max);
const url = z.string().trim().max(300).refine((v) => v === '' || /^(https?:\/\/|\/|mailto:|tel:)/.test(v), 'Enter a full URL (https://…) or leave blank');

const settingsSchema = z.object({
  brand: z.object({ name: str(40), tagline: str(120), description: str(400) }).partial(),
  contact: z.object({ email: z.string().trim().email().or(z.literal('')), phone: str(30), whatsapp: str(30), hours: str(80), supportNote: str(200) }).partial(),
  address: z.object({ label: str(60), line1: str(120), line2: str(120), city: str(60), state: str(60), postalCode: str(12), country: str(60), note: str(200), mapUrl: url }).partial(),
  social: z.object({ instagram: url, facebook: url, pinterest: url, youtube: url, x: url, whatsapp: url }).partial(),
  shipping: z.object({ freeOver: z.coerce.number().min(0), flat: z.coerce.number().min(0), giftWrap: z.coerce.number().min(0), dispatchDays: z.coerce.number().int().min(0), deliveryDays: str(20), returnsDays: z.coerce.number().int().min(0) }).partial(),
  announcement: z.object({ enabled: z.boolean(), text: str(160), link: str(200) }).partial(),
  home: z.object({ eyebrow: str(80), title: str(80), titleItalic: str(80), lead: str(400), primaryCta: str(40), secondaryCta: str(40), marquee: z.array(str(80)).max(12) }).partial(),
  seo: z.object({ title: str(80), description: str(200) }).partial(),
  legal: z.object({ company: str(120), gstin: str(30), footerNote: str(120) }).partial(),
  faq: z.array(z.object({ q: str(200), a: str(1500) })).max(30),
}).partial();

router.get('/settings', (req, res) => res.json(getSettings()));
router.put('/settings', validate(settingsSchema), async (req, res) => res.json(await updateSettings(req.body)));
router.post('/settings/reset', async (req, res) => res.json(await resetSettings()));

const pageSchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only.'),
  title: str(120).min(2),
  summary: str(300).default(''),
  body: z.string().max(60000).default(''),
  published: z.boolean().default(true),
  showInFooter: z.boolean().default(false),
});

router.get('/pages', async (req, res) => res.json({ items: (await pagesRepo.all()).map(({ body, ...p }) => ({ ...p, length: body?.length || 0 })) }));
router.get('/pages/:slug', async (req, res) => {
  const page = await pagesRepo.get(req.params.slug);
  if (!page) throw new HttpError(404, 'Page not found.');
  res.json(page);
});
router.post('/pages', validate(pageSchema), async (req, res) => {
  if (await pagesRepo.get(req.body.slug)) throw new HttpError(409, 'A page with that slug already exists.');
  res.status(201).json(await pagesRepo.upsert(req.body));
});
router.put('/pages/:slug', validate(pageSchema), async (req, res) => {
  const existing = await pagesRepo.get(req.params.slug);
  if (!existing) throw new HttpError(404, 'Page not found.');
  if (req.body.slug !== existing.slug) {
    if (await pagesRepo.get(req.body.slug)) throw new HttpError(409, 'A page with that slug already exists.');
    await pagesRepo.remove(existing.slug);
  }
  res.json(await pagesRepo.upsert({ ...existing, ...req.body }));
});
router.delete('/pages/:slug', async (req, res) => {
  if (!(await pagesRepo.remove(req.params.slug))) throw new HttpError(404, 'Page not found.');
  res.json({ ok: true });
});

export default router;
