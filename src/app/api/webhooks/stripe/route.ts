import type Stripe from 'stripe';
import { jsonError, jsonOk } from '@/lib/api';
import { stripeWebhookSecret } from '@/lib/env';
import { applySuccessfulBid, cancelFailedBid } from '@/lib/payments';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';
// El body debe llegar sin transformar para poder verificar la firma.
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) return jsonError('Falta la cabecera stripe-signature', 400);

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = getStripe().webhooks.constructEvent(payload, signature, stripeWebhookSecret());
  } catch (error) {
    console.error('[stripe] firma no valida:', error);
    return jsonError('Firma de webhook no valida', 400);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await applySuccessfulBid((event.data.object as Stripe.PaymentIntent).id);
        break;
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
        await cancelFailedBid((event.data.object as Stripe.PaymentIntent).id);
        break;
      default:
        break;
    }
    return jsonOk({ received: true });
  } catch (error) {
    // Un 500 hace que Stripe reintente el evento; las operaciones son idempotentes.
    console.error(`[stripe] error procesando ${event.type}:`, error);
    return jsonError('Error procesando el evento', 500);
  }
}
