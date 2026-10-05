import { Router } from 'express';
import { z } from 'zod';
import { priceCart, PricingError } from '../services/pricing.js';
import { allCoupons } from '../services/coupons.js';
import { validate } from '../middleware/errors.js';

const router = Router();

export const cartItemSchema = z.object({
  slug: z.string().min(1),
  sizeId: z.string().min(1).optional(),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
});

const priceSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Your cart is empty.'),
  couponCode: z.string().trim().max(32).optional().nullable(),
  giftWrap: z.boolean().optional(),
});

// POST /api/cart/price → authoritative totals for the drawer & checkout summary
router.post('/price', validate(priceSchema), (req, res, next) => {
  try {
    res.json(priceCart(req.body));
  } catch (err) {
    if (err instanceof PricingError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// GET /api/cart/coupons → public list (labels only) so the UI can hint at offers
router.get('/coupons', (req, res) => {
  res.json({ items: allCoupons().filter((c) => c.active !== false && c.public !== false).map((c) => ({ code: c.code, label: c.label })) });
});

export default router;
