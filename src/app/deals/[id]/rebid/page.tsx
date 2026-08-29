import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import RebidForm from '@/components/RebidForm';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Repujar' };
export const dynamic = 'force-dynamic';

export default async function RebidPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/deals/${params.id}/rebid`);

  const { data: deal } = await supabase
    .from('deals')
    .select('id,title,user_id,current_bid,status')
    .eq('id', params.id)
    .maybeSingle();

  if (!deal) notFound();
  if (deal.user_id !== user.id) redirect(`/deals/${params.id}`);

  if (deal.status !== 'active') {
    return (
      <div className="mx-auto max-w-lg">
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-warning">
          {deal.status === 'closed'
            ? 'Este deal esta cerrado: ya no admite pujas.'
            : 'Este deal todavia no esta publicado o esta archivado.'}
        </p>
        <Link href={`/deals/${deal.id}`} className="btn-secondary mt-4">
          Volver al deal
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href={`/deals/${deal.id}`} className="text-sm text-neutral hover:underline">
        ← Volver al deal
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Aumentar visibilidad</h1>
      <p className="mt-1 text-sm text-neutral">
        Sube tu puja para adelantar posiciones en el ranking de esta semana.
      </p>

      <div className="mt-6">
        <RebidForm dealId={deal.id} dealTitle={deal.title} currentBid={Number(deal.current_bid)} />
      </div>
    </div>
  );
}
