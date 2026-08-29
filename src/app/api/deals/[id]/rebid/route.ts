import { jsonError, jsonOk, parseBody, serverError } from '@/lib/api';
import { isStripeConfigured } from '@/lib/env';
import { createBidIntent } from '@/lib/payments';
import { MIN_CHARGE_EUR } from '@/lib/stripe';
import { rateLimit } from '@/lib/rateLimit';
import { createClient } from '@/lib/supabase/server';
import { rebidSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** Nueva puja sobre un deal propio. El importe debe superar la puja actual. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError('Debes iniciar sesion para pujar', 401);

    const limit = rateLimit(`rebid:${user.id}`, 20, 60 * 60 * 1000);
    if (!limit.allowed) {
      return jsonError('Demasiadas pujas seguidas. Prueba en unos minutos.', 429, {
        retryAfter: limit.retryAfterSeconds,
      });
    }

    const { data, error } = await parseBody(request, rebidSchema);
    if (error) return error;

    const { data: deal } = await supabase
      .from('deals')
      .select('id,title,user_id,current_bid,status')
      .eq('id', params.id)
      .maybeSingle();

    if (!deal) return jsonError('Deal no encontrado', 404);
    if (deal.user_id !== user.id) return jsonError('Solo el propietario puede repujar', 403);
    if (deal.status === 'closed') return jsonError('Un deal cerrado no admite pujas', 409);
    if (deal.status === 'archived') return jsonError('Este deal esta archivado', 409);
    if (deal.status === 'pending') {
      return jsonError('Termina primero el pago de la publicacion', 409);
    }

    const current = Number(deal.current_bid);
    if (data.amount <= current) {
      return jsonError(`La nueva puja debe superar los ${current} EUR actuales`, 422);
    }
    if (data.amount < MIN_CHARGE_EUR) {
      return jsonError(`El importe minimo es ${MIN_CHARGE_EUR} EUR`, 422);
    }
    if (!isStripeConfigured()) {
      return jsonError('Los pagos no estan configurados en este entorno', 503);
    }

    const { clientSecret, paymentIntentId } = await createBidIntent({
      dealId: deal.id,
      dealTitle: deal.title,
      userId: user.id,
      userEmail: user.email ?? '',
      amount: data.amount,
      kind: 'rebid',
    });

    return jsonOk({ clientSecret, paymentIntentId, amount: data.amount }, 201);
  } catch (err) {
    return serverError(err, 'deals/rebid');
  }
}
