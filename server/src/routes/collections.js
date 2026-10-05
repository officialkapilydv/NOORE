import { Router } from 'express';
import { catalog, queryProducts } from '../services/catalog.js';
import { HttpError } from '../middleware/errors.js';

const router = Router();

router.get('/', (req, res) => {
  const items = catalog.collections().map((c) => ({
    ...c,
    count: catalog.products().filter((p) => p.collection === c.slug).length,
    preview: queryProducts({ collection: c.slug, limit: 3 }).map((p) => ({ slug: p.slug, name: p.name, vessel: p.vessel, image: p.image, price: p.price })),
  }));
  res.json({ items });
});

router.get('/:slug', (req, res) => {
  const col = catalog.collection(req.params.slug);
  if (!col) throw new HttpError(404, 'That collection does not exist.');
  const products = queryProducts({ collection: col.slug, sort: req.query.sort });
  res.json({ ...col, products, count: products.length });
});

export default router;
