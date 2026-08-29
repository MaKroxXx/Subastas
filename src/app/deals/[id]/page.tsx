import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import CloseDealButton from '@/components/CloseDealButton';
import { getPublicDeal, registerView } from '@/lib/deals';
import { isDemoMode, isStripeConfigured } from '@/lib/env';
import { applySuccessfulBid } from '@/lib/payments';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { DEAL_TYPE_BADGE, DEAL_TYPE_LABELS, formatEuro } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
  searchParams: { paid?: string; payment_intent?: string; redirect_status?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const deal = await getPublicDeal(params.id);
    if (!deal) return { title: 'Deal no encontrado' };
    return {
      title: deal.title,
      description: deal.description.slice(0, 160),
    };
  } catch {
    return { title: 'Deal' };
  }
}

/**
 * Algunos metodos de pago vuelven de Stripe por redireccion. Si el pago ya esta
 * cobrado aplicamos la puja al momento en vez de esperar al webhook.
 */
async function reconcileRedirect(searchParams: Props['searchParams'], userId: string | null) {
  if (!userId || !isStripeConfigured()) return;
  if (searchParams.redirect_status !== 'succeeded' || !searchParams.payment_intent) return;

  try {
    const intent = await getStripe().paymentIntents.retrieve(searchParams.payment_intent);
    if (intent.status === 'succeeded' && intent.metadata?.user_id === userId) {
      await applySuccessfulBid(intent.id);
    }
  } catch (error) {
    console.error('[deal] no se pudo reconciliar el pago:', error);
  }
}

export default async function DealDetailPage({ params, searchParams }: Props) {
  const supabase = isDemoMode() ? null : createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  await reconcileRedirect(searchParams, user?.id ?? null);

  const deal = await getPublicDeal(params.id);
  if (!deal) notFound();

  const isOwner = user?.id === deal.user_id;
  if (!isOwner) await registerView(deal.id);

  const profile =
    user && supabase
      ? await supabase.from('users').select('name,email').eq('id', user.id).maybeSingle()
      : null;

  const justPaid = searchParams.paid === '1' || searchParams.redirect_status === 'succeeded';

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <article className="lg:col-span-2">
        <Link href="/" className="text-sm text-neutral hover:underline">
          ← Volver al ranking
        </Link>

        {justPaid ? (
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-success">
            Pago confirmado. Tu puja ya cuenta para el ranking.
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`badge ${DEAL_TYPE_BADGE[deal.deal_type]}`}>
            {DEAL_TYPE_LABELS[deal.deal_type]}
          </span>
          {deal.status === 'closed' ? (
            <span className="badge bg-gray-100 text-gray-600 ring-gray-300">CERRADO</span>
          ) : null}
          {deal.position ? (
            <span className="badge bg-blue-50 text-blue-700 ring-blue-200">
              Posicion #{deal.position}
            </span>
          ) : null}
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">{deal.title}</h1>

        <p className="mt-2 text-sm text-neutral">
          Publicado por {deal.author_name} ·{' '}
          {new Date(deal.created_at).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>

        {deal.image_url ? (
          <div className="relative mt-6 h-64 w-full overflow-hidden rounded-xl bg-gray-100">
            <Image
              src={deal.image_url}
              alt={deal.title}
              fill
              sizes="(max-width: 1024px) 100vw, 640px"
              className="object-cover"
            />
          </div>
        ) : null}

        <div className="card mt-6 whitespace-pre-wrap p-6 text-[15px] leading-relaxed text-gray-800">
          {deal.description}
        </div>
      </article>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="card space-y-4 p-6">
          <div>
            <p className="text-sm text-neutral">Puja semanal</p>
            <p className="text-3xl font-bold text-success">{formatEuro(Number(deal.current_bid))}</p>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-neutral">Posicion</dt>
              <dd className="font-semibold text-gray-900">
                {deal.position ? `#${deal.position}` : 'Sin puja'}
              </dd>
            </div>
            <div>
              <dt className="text-neutral">Visitas</dt>
              <dd className="font-semibold text-gray-900">{deal.views_count}</dd>
            </div>
            <div>
              <dt className="text-neutral">Contactos</dt>
              <dd className="font-semibold text-gray-900">{deal.contacts_count}</dd>
            </div>
            <div>
              <dt className="text-neutral">Semana</dt>
              <dd className="font-semibold text-gray-900">{deal.week_number || '—'}</dd>
            </div>
          </dl>

          {isOwner && deal.status === 'active' ? (
            <div className="space-y-3 border-t border-gray-200 pt-4">
              <Link href={`/deals/${deal.id}/rebid`} className="btn-primary w-full">
                Repujar
              </Link>
              <CloseDealButton dealId={deal.id} />
            </div>
          ) : null}
        </div>

        <div className="card p-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Contactar</h2>
          <ContactForm
            dealId={deal.id}
            isLoggedIn={Boolean(user)}
            isOwner={isOwner}
            isClosed={deal.status === 'closed'}
            defaultName={profile?.data?.name ?? ''}
            defaultEmail={profile?.data?.email ?? user?.email ?? ''}
          />
        </div>
      </aside>
    </div>
  );
}
