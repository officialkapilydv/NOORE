import { Router } from 'express';
import { catalog, queryProducts, relatedProducts } from '../services/catalog.js';
import { collection } from '../db/store.js';
import { HttpError } from '../middleware/errors.js';

const router = Router();

// GET /api/products?collection=luxury&family=floral&q=rose&sort=price-asc&limit=8&featured=true
router.get('/', (req, res) => {
  const items = queryProducts(req.query);
  res.json({
    items,
    total: items.length,
    facets: {
      collections: catalog.collections().map((c) => ({ slug: c.slug, name: c.name, count: catalog.products().filter((p) => p.collection === c.slug).length })),
      families: catalog.families(),
      priceRange: {
        min: Math.min(...catalog.products().map((p) => p.price)),
        max: Math.max(...catalog.products().map((p) => p.price)),
      },
    },
  });
});

// GET /api/products/suggest?q=ou  → lightweight search suggestions for the overlay
router.get('/suggest', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ items: [] });
  const items = queryProducts({ q, limit: 6 }).map((p) => ({
    slug: p.slug, name: p.name, collection: p.collection, price: p.price, image: p.image, tagline: p.tagline, vessel: p.vessel,
  }));
  res.json({ items });
});

router.get('/:slug', async (req, res) => {
  const product = catalog.product(req.params.slug);
  if (!product) throw new HttpError(404, 'We could not find that candle.');
  const col = catalog.collection(product.collection);
  const reviews = await collection('reviews').filter((r) => r.productSlug === product.slug && r.approved !== false);
  const includes = (product.includes || []).map((s) => catalog.product(s)).filter(Boolean);
  res.json({
    ...product,
    specs: col?.specs || {},
    collectionMeta: col ? { slug: col.slug, name: col.name, title: col.title, tone: col.tone } : null,
    includesProducts: includes,
    reviews,
    related: relatedProducts(product.slug, 4),
  });
});

export default router;
