import { z } from 'zod';
import { jsonError, jsonOk, parseBody, serverError } from '@/lib/api';
import { isStripeConfigured } from '@/lib/env';
import { createBidIntent } from '@/lib/payments';
import { MIN_CHARGE_EUR } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { bidSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const schema = z.object({
  deal_id: z.string().uuid('Deal no valido'),
  amount: bidSchema,
});

/**
 * Crea un PaymentIntent para un deal propio. Sirve tanto para reintentar el
 * pago de una publicacion pendiente como para una repuja.
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

    if (data.amount < MIN_CHARGE_EUR) {
      return jsonError(`El importe minimo es ${MIN_CHARGE_EUR} EUR`, 422);
    }
    if (!isStripeConfigured()) {
      return jsonError('Los pagos no estan configurados en este entorno', 503);
    }

    const { data: deal } = await supabase
      .from('deals')
      .select('id,title,user_id,current_bid,status')
      .eq('id', data.deal_id)
      .maybeSingle();

    if (!deal) return jsonError('Deal no encontrado', 404);
    if (deal.user_id !== user.id) return jsonError('Este deal no es tuyo', 403);
    if (deal.status === 'closed' || deal.status === 'archived') {
      return jsonError('Este deal ya no admite pagos', 409);
    }

    const kind = deal.status === 'pending' ? 'initial' : 'rebid';
    if (kind === 'rebid' && data.amount <= Number(deal.current_bid)) {
      return jsonError(`La nueva puja debe superar los ${deal.current_bid} EUR actuales`, 422);
    }

    const { clientSecret, paymentIntentId } = await createBidIntent({
      dealId: deal.id,
      dealTitle: deal.title,
      userId: user.id,
      userEmail: user.email ?? '',
      amount: data.amount,
      kind,
    });

    return jsonOk({ clientSecret, paymentIntentId, amount: data.amount }, 201);
  } catch (err) {
    return serverError(err, 'payments/create-intent');
  }
}
