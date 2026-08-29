import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import NewDealForm from '@/components/NewDealForm';
import { getSessionUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Nuevo deal' };
export const dynamic = 'force-dynamic';

export default async function NewDealPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/dashboard/new-deal');

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="text-sm text-neutral hover:underline">
        ← Volver al panel
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Publicar un deal</h1>
      <p className="mt-1 text-sm text-neutral">
        Decide cuanto quieres pagar por visibilidad esta semana. Sin puja minima.
      </p>

      <div className="mt-6">
        <NewDealForm userEmail={user.email ?? ''} />
      </div>
    </div>
  );
}
