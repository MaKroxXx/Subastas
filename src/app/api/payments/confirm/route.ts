import { z } from 'zod';
import { jsonError, jsonOk, parseBody, serverError } from '@/lib/api';
import { applySuccessfulBid } from '@/lib/payments';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const schema = z.object({ payment_intent_id: z.string().min(1).max(255) });

/**
 * Reconciliacion inmediata tras el checkout: comprueba en Stripe que el pago
 * esta cobrado y aplica la puja sin esperar al webhook. Es idempotente, asi que
 * el webhook posterior no duplica nada. Util tambien en local, donde no hay
 * webhook configurado.
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError('No autenticado', 401);

    const { data, error } = await parseBody(request, schema);
    if (error) return error;

    const intent = await getStripe().paymentIntents.retrieve(data.payment_intent_id);
    if (intent.metadata?.user_id !== user.id) return jsonError('Pago no encontrado', 404);
    if (intent.status !== 'succeeded') {
      return jsonError(`El pago todavia no esta confirmado (${intent.status})`, 409);
    }

    await applySuccessfulBid(intent.id);
    return jsonOk({ applied: true, deal_id: intent.metadata?.deal_id ?? null });
  } catch (err) {
    return serverError(err, 'payments/confirm');
  }
}
