import { Router } from 'express';
import { z } from 'zod';
import { collection } from '../db/store.js';
import { priceCart, PricingError } from '../services/pricing.js';
import { authorisePayment, PAYMENT_METHODS } from '../services/payment.js';
import { catalog, saveProducts } from '../services/catalog.js';
import { holdCouponUse } from '../services/coupons.js';
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

/** Staff-only fields (internal notes, who changed a status) never leave the admin API. */
function customerView(order) {
  const { internalNote, ...rest } = order;
  return { ...rest, timeline: (order.timeline || []).map(({ by, ...t }) => t) };
}

/** Someone holding only the order number sees progress and contents, not who or where. */
function guestView(order) {
  const o = customerView(order);
  return {
    orderNumber: o.orderNumber,
    status: o.status,
    createdAt: o.createdAt,
    estimatedDelivery: o.estimatedDelivery,
    timeline: o.timeline,
    lines: o.lines,
    currency: o.currency,
    subtotal: o.subtotal,
    discount: o.discount,
    shipping: o.shipping,
    giftWrap: o.giftWrap,
    giftWrapFee: o.giftWrapFee,
    total: o.total,
    trackingNumber: o.trackingNumber,
    trackingUrl: o.trackingUrl,
    address: { city: o.address?.city, state: o.address?.state },
    payment: { method: o.payment?.method, status: o.payment?.status },
  };
}

router.post('/', rateLimit({ windowMs: 60_000, max: 10 }), optionalAuth, validate(orderSchema), async (req, res, next) => {
  try {
    const pricing = priceCart({ items: req.body.items, couponCode: req.body.couponCode, giftWrap: req.body.giftWrap });

    // Reserve stock and the coupon use synchronously — in the same tick as the checks above —
    // so a concurrent order can't pass the same checks while this one waits on payment.
    const adjustStock = (sign) => {
      for (const line of pricing.lines) {
        const product = catalog.product(line.slug, { includeUnpublished: true });
        if (product) product.stock = Math.max(0, product.stock + sign * line.quantity);
      }
    };
    adjustStock(-1);
    const couponUse = pricing.coupon ? holdCouponUse(pricing.coupon.code) : null;
    let payment;
    try {
      payment = await authorisePayment({ method: req.body.paymentMethod, amount: pricing.total, card: req.body.card });
    } catch (err) {
      adjustStock(1);
      couponUse?.release();
      throw err;
    }

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

    let saved;
    try {
      await saveProducts();
      await couponUse?.persist();
      saved = await collection('orders').insert(order);
    } catch (err) {
      // Nothing was recorded, so hand the reservation back rather than leave phantom sales.
      adjustStock(1);
      couponUse?.release();
      throw err;
    }
    res.status(201).json(customerView(saved));
  } catch (err) {
    if (err instanceof PricingError) return res.status(err.status).json(err);
    next(err);
  }
});

// Orders for the signed-in customer. Matched on the account id only: emails aren't verified at
// sign-up, so matching on email would let anyone register a victim's address and read their orders.
router.get('/mine', requireAuth, async (req, res) => {
  const orders = await collection('orders').filter((o) => o.userId === req.user.sub);
  res.json({ items: orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(customerView) });
});

// Public lookup by order number + email (guest tracking). Rate-limited so numbers can't be enumerated.
router.get('/:orderNumber', rateLimit({ windowMs: 60_000, max: 30, name: 'order-lookup' }), async (req, res) => {
  const order = await collection('orders').find((o) => o.orderNumber === req.params.orderNumber.toUpperCase());
  if (!order) throw new HttpError(404, 'We could not find an order with that number.');
  const email = String(req.query.email || '').toLowerCase();
  if (email && email !== order.email) throw new HttpError(403, 'That email does not match this order.');
  res.json(email ? customerView(order) : guestView(order));
});

export default router;
