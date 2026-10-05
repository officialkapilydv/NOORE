/**
 * Payment adapter.
 * `cod` and `card` are fulfilled locally (card is a simulated gateway so the storefront
 * can be demoed end-to-end). To go live, add a provider here (Razorpay / Stripe) that
 * creates a payment intent and returns `clientSecret`/`orderId` for the client SDK.
 */
import crypto from 'node:crypto';

export const PAYMENT_METHODS = ['cod', 'card', 'upi'];

export async function authorisePayment({ method, amount, card }) {
  if (!PAYMENT_METHODS.includes(method)) {
    const err = new Error('Unsupported payment method');
    err.status = 400;
    throw err;
  }
  if (method === 'cod') {
    return { status: 'pending', provider: 'cod', reference: null, message: 'Pay on delivery' };
  }
  // Simulated gateway: a card number ending in 0000 is declined, everything else succeeds.
  if (method === 'card' && card?.last4 === '0000') {
    const err = new Error('Your card was declined by the issuer. Try another card.');
    err.status = 402;
    throw err;
  }
  await new Promise((r) => setTimeout(r, 350));
  return {
    status: 'paid',
    provider: method === 'upi' ? 'upi-sim' : 'card-sim',
    reference: `pay_${crypto.randomBytes(6).toString('hex')}`,
    amount,
    message: 'Payment captured',
  };
}
