import { getStripe, toCents } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { dealPublishedEmail, sendEmail } from '@/lib/email';

export interface CreateBidIntentInput {
  dealId: string;
  dealTitle: string;
  userId: string;
  userEmail: string;
  amount: number;
  kind: 'initial' | 'rebid';
}

/**
 * Crea el PaymentIntent en Stripe y deja la puja registrada como `pending`.
 * La puja no se aplica al deal hasta que el webhook confirma el cobro.
 */
export async function createBidIntent(input: CreateBidIntentInput) {
  const stripe = getStripe();
  const admin = createAdminClient();

  const intent = await stripe.paymentIntents.create({
    amount: toCents(input.amount),
    currency: 'eur',
    automatic_payment_methods: { enabled: true },
    receipt_email: input.userEmail,
    description: `${input.kind === 'initial' ? 'Publicacion' : 'Repuja'}: ${input.dealTitle}`,
    metadata: {
      deal_id: input.dealId,
      user_id: input.userId,
      amount: String(input.amount),
      kind: input.kind,
    },
  });

  const { error } = await admin.from('bid_history').insert({
    deal_id: input.dealId,
    user_id: input.userId,
    amount: input.amount,
    payment_id: intent.id,
    payment_status: 'pending',
    kind: input.kind,
  });

  if (error) {
    // Sin registro de puja no podriamos aplicar el pago: cancelamos el intent.
    await stripe.paymentIntents.cancel(intent.id).catch(() => undefined);
    throw new Error(`No se pudo registrar la puja: ${error.message}`);
  }

  return { paymentIntentId: intent.id, clientSecret: intent.client_secret };
}

/**
 * Aplica una puja pagada. Es idempotente: el webhook de Stripe puede reintentar
 * el mismo evento varias veces.
 */
export async function applySuccessfulBid(paymentIntentId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: bid, error } = await admin
    .from('bid_history')
    .select('id,deal_id,user_id,amount,payment_status,kind')
    .eq('payment_id', paymentIntentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!bid) {
    console.warn(`[payments] sin puja asociada al pago ${paymentIntentId}`);
    return;
  }
  if (bid.payment_status === 'succeeded') return;

  const { data: deal, error: dealError } = await admin
    .from('deals')
    .select('id,title,current_bid,status,contact_email')
    .eq('id', bid.deal_id)
    .maybeSingle();

  if (dealError) throw new Error(dealError.message);
  if (!deal) return;

  await admin.from('bid_history').update({ payment_status: 'succeeded' }).eq('id', bid.id);

  const amount = Number(bid.amount);
  await admin
    .from('deals')
    .update({
      // Una repuja siempre supera la puja actual, pero nos protegemos ante
      // webhooks fuera de orden quedandonos con el importe mas alto.
      current_bid: Math.max(amount, Number(deal.current_bid)),
      status: deal.status === 'pending' ? 'active' : deal.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', deal.id);

  if (bid.kind === 'initial') {
    const { subject, text } = dealPublishedEmail(deal.title, deal.id, amount);
    await sendEmail({ to: deal.contact_email, subject, text });
  }
}

/**
 * Marca la puja como fallida. Si era la publicacion inicial y el deal seguia
 * pendiente de pago, se elimina la entrada.
 */
export async function cancelFailedBid(paymentIntentId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: bid } = await admin
    .from('bid_history')
    .select('id,deal_id,kind,payment_status')
    .eq('payment_id', paymentIntentId)
    .maybeSingle();

  if (!bid || bid.payment_status === 'succeeded') return;

  await admin.from('bid_history').update({ payment_status: 'failed' }).eq('id', bid.id);

  if (bid.kind === 'initial') {
    await admin.from('deals').delete().eq('id', bid.deal_id).eq('status', 'pending');
  }
}
