import { Router } from 'express';
import { z } from 'zod';
import { collection } from '../db/store.js';
import { priceCart, PricingError } from '../services/pricing.js';
import { authorisePayment, PAYMENT_METHODS } from '../services/payment.js';
import { catalog, saveProducts } from '../services/catalog.js';
import { recordCouponUse } from '../services/coupons.js';
import { orderNumber, uid } from '../utils/ids.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { HttpError, validate } from '../middleware/errors.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { cartItemSchema } from './cart.js';

const router = Router();

const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter the recipient name.').max(80),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{8,16}$/, 'Please enter a valid phone number.'),
  line1: z.string().trim().min(4, 'Please enter a street address.').max(120),
  line2: z.string().trim().max(120).optional().default(''),
  city: z.string().trim().min(2, 'Please enter a city.').max(60),
  state: z.string().trim().min(2, 'Please enter a state.').max(60),
  postalCode: z.string().trim().regex(/^[0-9]{6}$/, 'Please enter a 6-digit PIN code.'),
  country: z.string().trim().default('India'),
});

const orderSchema = z.object({
  email: z.string().trim().email('Please enter a valid email.'),
  items: z.array(cartItemSchema).min(1, 'Your cart is empty.'),
  shipping: addressSchema,
  couponCode: z.string().trim().max(32).optional().nullable(),
  giftWrap: z.boolean().optional().default(false),
  giftMessage: z.string().trim().max(240).optional().default(''),
  paymentMethod: z.enum(PAYMENT_METHODS),
  card: z.object({ last4: z.string().regex(/^\d{4}$/), brand: z.string().max(20).optional() }).optional(),
  notes: z.string().trim().max(500).optional().default(''),
});

router.post('/', rateLimit({ windowMs: 60_000, max: 10 }), optionalAuth, validate(orderSchema), async (req, res, next) => {
  try {
    const pricing = priceCart({ items: req.body.items, couponCode: req.body.couponCode, giftWrap: req.body.giftWrap });
    const payment = await authorisePayment({ method: req.body.paymentMethod, amount: pricing.total, card: req.body.card });

    const order = {
      id: uid('ord_'),
      orderNumber: orderNumber(),
      status: payment.status === 'paid' ? 'confirmed' : 'placed',
      email: req.body.email.toLowerCase(),
      userId: req.user?.sub || null,
      address: req.body.shipping,
      giftMessage: req.body.giftMessage,
      notes: req.body.notes,
      payment: { method: req.body.paymentMethod, ...payment },
      ...pricing,
      timeline: [{ status: 'placed', at: new Date().toISOString(), label: 'Order placed' }],
      estimatedDelivery: new Date(Date.now() + 4 * 86_400_000).toISOString(),
    };
    if (payment.status === 'paid') order.timeline.push({ status: 'confirmed', at: new Date().toISOString(), label: 'Payment confirmed' });

    // decrement stock and persist; record coupon redemption
    for (const line of pricing.lines) {
      const product = catalog.product(line.slug);
      if (product) product.stock = Math.max(0, product.stock - line.quantity);
    }
    await saveProducts();
    if (pricing.coupon) await recordCouponUse(pricing.coupon.code);

    await collection('orders').insert(order);
    res.status(201).json(order);
  } catch (err) {
    if (err instanceof PricingError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// Orders for the signed-in customer
router.get('/mine', requireAuth, async (req, res) => {
  const orders = await collection('orders').filter((o) => o.userId === req.user.sub || o.email === req.user.email);
  res.json({ items: orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
});

// Public lookup by order number + email (guest tracking)
router.get('/:orderNumber', async (req, res) => {
  const order = await collection('orders').find((o) => o.orderNumber === req.params.orderNumber.toUpperCase());
  if (!order) throw new HttpError(404, 'We could not find an order with that number.');
  const email = String(req.query.email || '').toLowerCase();
  if (email && email !== order.email) throw new HttpError(403, 'That email does not match this order.');
  // Guests get a trimmed view unless they provide the matching email.
  if (!email) {
    const { address, payment, ...rest } = order;
    return res.json({ ...rest, address: { city: address?.city, state: address?.state }, payment: { method: payment.method, status: payment.status } });
  }
  res.json(order);
});

export default router;
