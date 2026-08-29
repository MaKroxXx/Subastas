import { jsonError, jsonOk, parseBody, serverError } from '@/lib/api';
import { listDeals } from '@/lib/deals';
import { isStripeConfigured } from '@/lib/env';
import { createBidIntent } from '@/lib/payments';
import { MIN_CHARGE_EUR } from '@/lib/stripe';
import { rateLimit } from '@/lib/rateLimit';
import { createClient } from '@/lib/supabase/server';
import { createDealSchema, listDealsSchema, MAX_DEALS_PER_DAY } from '@/lib/validation';
import { isoWeekNumber } from '@/lib/week';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listDealsSchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    perPage: url.searchParams.get('perPage') ?? undefined,
    type: url.searchParams.get('type') ?? undefined,
    q: url.searchParams.get('q') ?? undefined,
    section: url.searchParams.get('section') ?? undefined,
  });

  if (!parsed.success) return jsonError('Parametros de busqueda no validos', 422);

  try {
    return jsonOk(await listDeals(parsed.data));
  } catch (err) {
    return serverError(err, 'deals/list');
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return jsonError('Debes iniciar sesion para publicar un deal', 401);

    const memoryLimit = rateLimit(`new-deal:${user.id}`, MAX_DEALS_PER_DAY, 24 * 60 * 60 * 1000);
    if (!memoryLimit.allowed) {
      return jsonError(`Maximo ${MAX_DEALS_PER_DAY} deals al dia`, 429, {
        retryAfter: memoryLimit.retryAfterSeconds,
      });
    }

    // El contador en memoria se pierde entre despliegues: confirmamos en BD.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: dealsToday } = await supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', since);

    if ((dealsToday ?? 0) >= MAX_DEALS_PER_DAY) {
      return jsonError(`Maximo ${MAX_DEALS_PER_DAY} deals al dia`, 429);
    }

    const { data, error } = await parseBody(request, createDealSchema);
    if (error) return error;

    const needsPayment = data.bid > 0;
    if (needsPayment && data.bid < MIN_CHARGE_EUR) {
      return jsonError(`La puja debe ser 0 EUR o al menos ${MIN_CHARGE_EUR} EUR`, 422);
    }
    if (needsPayment && !isStripeConfigured()) {
      return jsonError('Los pagos no estan configurados en este entorno', 503);
    }

    const { data: deal, error: insertError } = await supabase
      .from('deals')
      .insert({
        user_id: user.id,
        title: data.title,
        description: data.description,
        deal_type: data.deal_type,
        contact_email: data.contact_email,
        image_url: data.image_url ?? null,
        current_bid: 0,
        // Con puja > 0 el deal no se publica hasta que Stripe confirma el pago.
        status: needsPayment ? 'pending' : 'active',
        week_number: isoWeekNumber(),
      })
      .select('id,title,status')
      .single();

    if (insertError) return jsonError(`No se pudo crear el deal: ${insertError.message}`, 400);

    if (!needsPayment) {
      await supabase.from('bid_history').insert({
        deal_id: deal.id,
        user_id: user.id,
        amount: 0,
        payment_status: 'free',
        kind: 'initial',
      });
      return jsonOk({ deal, requiresPayment: false }, 201);
    }

    try {
      const { clientSecret, paymentIntentId } = await createBidIntent({
        dealId: deal.id,
        dealTitle: deal.title,
        userId: user.id,
        userEmail: user.email ?? '',
        amount: data.bid,
        kind: 'initial',
      });
      return jsonOk({ deal, requiresPayment: true, clientSecret, paymentIntentId }, 201);
    } catch (paymentError) {
      // Sin intent no hay forma de pagar: retiramos el deal pendiente.
      await supabase.from('deals').delete().eq('id', deal.id);
      return serverError(paymentError, 'deals/create-intent');
    }
  } catch (err) {
    return serverError(err, 'deals/create');
  }
}
