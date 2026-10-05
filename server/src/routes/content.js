/** Public · site settings and content pages consumed by the storefront. */
import { Router } from 'express';
import { pagesRepo, publicSettings } from '../services/settings.js';
import { HttpError } from '../middleware/errors.js';

const router = Router();

router.get('/settings', (req, res) => res.json(publicSettings()));

router.get('/pages', async (req, res) => {
  const items = (await pagesRepo.published()).map(({ body, ...p }) => p);
  res.json({ items });
});

router.get('/pages/:slug', async (req, res) => {
  const page = await pagesRepo.get(req.params.slug);
  if (!page || page.published === false) throw new HttpError(404, 'Page not found.');
  res.json(page);
});

export default router;
