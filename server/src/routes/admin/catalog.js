/** Admin · products, collections, coupons, media uploads. */
import { Router } from 'express';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { config } from '../../config.js';
import { catalog, deleteProduct, queryProducts, reorderProducts, upsertCollection, upsertProduct } from '../../services/catalog.js';
import { allCoupons, deleteCoupon, upsertCoupon } from '../../services/coupons.js';
import { HttpError, validate } from '../../middleware/errors.js';

const router = Router();

const slugify = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex colour like #c9a24a');

const sizeSchema = z.object({
  id: z.string().trim().min(1).max(20),
  label: z.string().trim().min(1).max(30),
  weight: z.string().trim().max(30).default(''),
  burnTime: z.string().trim().max(30).default(''),
  price: z.coerce.number().min(0).max(1000000),
});

export const productSchema = z.object({
  slug: z.string().trim().max(80).optional(),
  name: z.string().trim().min(2, 'Give the candle a name.').max(80),
  collection: z.string().trim().min(1, 'Choose a collection.'),
  family: z.string().trim().min(1).max(30).default('floral'),
  kind: z.enum(['single', 'set']).optional(),
  includes: z.array(z.string()).optional(),
  tagline: z.string().trim().max(160).default(''),
  description: z.string().trim().max(2000).default(''),
  story: z.string().trim().max(2000).default(''),
  notes: z.object({ top: z.array(z.string().trim()).default([]), heart: z.array(z.string().trim()).default([]), base: z.array(z.string().trim()).default([]) }).default({ top: [], heart: [], base: [] }),
  moods: z.array(z.string().trim()).default([]),
  rooms: z.array(z.string().trim()).default([]),
  badges: z.array(z.string().trim()).default([]),
  price: z.coerce.number().min(0).max(1000000),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  sizes: z.array(sizeSchema).min(1, 'Add at least one size.'),
  stock: z.coerce.number().int().min(0).default(0),
  rating: z.coerce.number().min(0).max(5).default(5),
  reviewCount: z.coerce.number().int().min(0).default(0),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  image: z.string().trim().max(300).default(''),
  gallery: z.array(z.string().trim()).default([]),
  vessel: z.object({
    type: z.enum(['glass', 'tinted', 'porcelain', 'stone', 'marble', 'matte']),
    color: hex,
    veins: hex.optional(),
    wax: hex,
    lid: z.enum(['none', 'gold', 'wood']).default('none'),
    labelBg: hex,
    labelText: hex,
    accent: hex,
    glow: hex,
  }),
});

/* ─── Products ─── */
router.get('/products', (req, res) => {
  const items = queryProducts({ ...req.query, includeUnpublished: true, sort: req.query.sort || 'order' });
  res.json({ items, total: items.length, collections: catalog.collections().map((c) => ({ slug: c.slug, name: c.name })) });
});

router.get('/products/:slug', (req, res) => {
  const product = catalog.product(req.params.slug, { includeUnpublished: true });
  if (!product) throw new HttpError(404, 'Product not found.');
  res.json(product);
});

router.post('/products', validate(productSchema), async (req, res) => {
  const base = slugify(req.body.slug || req.body.name);
  let slug = base;
  let n = 2;
  while (catalog.product(slug, { includeUnpublished: true })) slug = `${base}-${n++}`;
  if (!catalog.collection(req.body.collection)) throw new HttpError(422, 'Unknown collection.');
  const id = `${req.body.collection.slice(0, 3)}-${Date.now().toString(36)}`;
  const saved = await upsertProduct({ id, ...req.body, slug, price: req.body.price || req.body.sizes[0].price });
  res.status(201).json(saved);
});

router.put('/products/:slug', validate(productSchema), async (req, res) => {
  const existing = catalog.product(req.params.slug, { includeUnpublished: true });
  if (!existing) throw new HttpError(404, 'Product not found.');
  const nextSlug = req.body.slug ? slugify(req.body.slug) : existing.slug;
  if (nextSlug !== existing.slug && catalog.product(nextSlug, { includeUnpublished: true })) throw new HttpError(409, 'That slug is already in use.');
  if (nextSlug !== existing.slug) await deleteProduct(existing.slug);
  const saved = await upsertProduct({ ...existing, ...req.body, slug: nextSlug });
  res.json(saved);
});

router.patch('/products/:slug', async (req, res) => {
  const existing = catalog.product(req.params.slug, { includeUnpublished: true });
  if (!existing) throw new HttpError(404, 'Product not found.');
  const allowed = ['published', 'featured', 'stock', 'price', 'badges', 'order'];
  const patch = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => allowed.includes(k)));
  const saved = await upsertProduct({ ...existing, ...patch, slug: existing.slug });
  res.json(saved);
});

router.post('/products/:slug/duplicate', async (req, res) => {
  const existing = catalog.product(req.params.slug, { includeUnpublished: true });
  if (!existing) throw new HttpError(404, 'Product not found.');
  let slug = `${existing.slug}-copy`;
  let n = 2;
  while (catalog.product(slug, { includeUnpublished: true })) slug = `${existing.slug}-copy-${n++}`;
  const saved = await upsertProduct({ ...existing, id: `${existing.id}-${Date.now().toString(36)}`, slug, name: `${existing.name} (copy)`, published: false, featured: false, createdAt: undefined });
  res.status(201).json(saved);
});

router.post('/products/reorder', validate(z.object({ slugs: z.array(z.string()).min(1) })), async (req, res) => {
  await reorderProducts(req.body.slugs);
  res.json({ ok: true });
});

router.delete('/products/:slug', async (req, res) => {
  if (!(await deleteProduct(req.params.slug))) throw new HttpError(404, 'Product not found.');
  res.json({ ok: true });
});

/* ─── Collections ─── */
const collectionSchema = z.object({
  name: z.string().trim().min(2).max(60),
  title: z.string().trim().max(120).default(''),
  description: z.string().trim().max(1000).default(''),
  tone: z.enum(['light', 'amber', 'dark']).default('amber'),
  color: hex,
  accent: hex,
  from: z.coerce.number().min(0).default(0),
  image: z.string().trim().max(300).default(''),
  specs: z.record(z.string().trim().max(200)).default({}),
});

router.get('/collections', (req, res) => {
  res.json({ items: catalog.collections().map((c) => ({ ...c, count: catalog.products({ includeUnpublished: true }).filter((p) => p.collection === c.slug).length })) });
});

router.put('/collections/:slug', validate(collectionSchema), async (req, res) => {
  const existing = catalog.collection(req.params.slug);
  const saved = await upsertCollection({ ...(existing || {}), ...req.body, slug: existing ? existing.slug : slugify(req.params.slug) });
  res.status(existing ? 200 : 201).json(saved);
});

/* ─── Coupons ─── */
const couponSchema = z.object({
  code: z.string().trim().min(3).max(24).regex(/^[A-Za-z0-9-]+$/, 'Letters and numbers only.'),
  label: z.string().trim().min(2).max(120),
  type: z.enum(['percent', 'flat', 'shipping']),
  value: z.coerce.number().min(0).max(100000).default(0),
  collections: z.array(z.string()).optional(),
  minSubtotal: z.coerce.number().min(0).optional().nullable(),
  minItems: z.coerce.number().int().min(0).optional().nullable(),
  maxUses: z.coerce.number().int().min(0).optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

router.get('/coupons', (req, res) => res.json({ items: allCoupons() }));
router.post('/coupons', validate(couponSchema), async (req, res) => res.status(201).json(await upsertCoupon(req.body)));
router.put('/coupons/:code', validate(couponSchema), async (req, res) => {
  if (req.body.code.toUpperCase() !== req.params.code.toUpperCase()) await deleteCoupon(req.params.code);
  res.json(await upsertCoupon(req.body));
});
router.delete('/coupons/:code', async (req, res) => {
  if (!(await deleteCoupon(req.params.code))) throw new HttpError(404, 'Coupon not found.');
  res.json({ ok: true });
});

/* ─── Media ─── */
const UPLOAD_DIR = path.join(config.paths.publicDir, 'images', 'uploads');
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const base = slugify(path.basename(file.originalname, ext)).slice(0, 48) || 'image';
    cb(null, `${Date.now().toString(36)}-${base}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif|avif|svg\+xml)$/.test(file.mimetype)) cb(null, true);
    else cb(new HttpError(415, 'Only JPG, PNG, WEBP, GIF, AVIF or SVG images are allowed.'));
  },
});

router.get('/media', async (req, res) => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const names = await fs.readdir(UPLOAD_DIR);
  const items = await Promise.all(names.filter((n) => !n.startsWith('.')).map(async (name) => {
    const stat = await fs.stat(path.join(UPLOAD_DIR, name));
    return { name, url: `/images/uploads/${name}`, size: stat.size, createdAt: stat.mtime.toISOString() };
  }));
  // bundled product & banner imagery is also selectable
  const bundled = [];
  for (const folder of ['products', 'banners']) {
    try {
      for (const name of await fs.readdir(path.join(config.paths.publicDir, 'images', folder))) bundled.push({ name: `${folder}/${name}`, url: `/images/${folder}/${name}`, bundled: true });
    } catch { /* folder missing */ }
  }
  res.json({ items: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), bundled });
});

router.post('/media', upload.array('files', 10), (req, res) => {
  const files = (req.files || []).map((f) => ({ name: f.filename, url: `/images/uploads/${f.filename}`, size: f.size }));
  if (!files.length) throw new HttpError(400, 'No image received. Send files in the "files" field.');
  res.status(201).json({ items: files });
});

router.delete('/media/:name', async (req, res) => {
  const name = path.basename(req.params.name);
  try {
    await fs.unlink(path.join(UPLOAD_DIR, name));
  } catch {
    throw new HttpError(404, 'File not found.');
  }
  res.json({ ok: true });
});

export default router;
