import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import CloseDealButton from '@/components/CloseDealButton';
import { getDashboardData } from '@/lib/dashboard';
import { getSessionUser } from '@/lib/supabase/server';
import { DEAL_TYPE_LABELS, formatEuro, type DealStatus } from '@/lib/types';

export const metadata: Metadata = { title: 'Mi panel' };
export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<DealStatus, string> = {
  pending: 'Pago pendiente',
  active: 'Activo',
  closed: 'Cerrado',
  archived: 'Archivado',
};

const STATUS_STYLES: Record<DealStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  closed: 'bg-gray-100 text-gray-600 ring-gray-300',
  archived: 'bg-gray-100 text-gray-500 ring-gray-300',
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  succeeded: 'Pagado',
  failed: 'Fallido',
  free: 'Gratis',
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default async function DashboardPage({ searchParams }: { searchParams: { created?: string } }) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/dashboard');

  const { deals, bids, contacts, totals } = await getDashboardData(user.id);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi panel</h1>
          <p className="mt-1 text-sm text-neutral">Tus deals, pujas y mensajes recibidos.</p>
        </div>
        <Link href="/dashboard/new-deal" className="btn-primary">
          Nuevo deal
        </Link>
      </header>

      {searchParams.created === '1' ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-success">
          Deal publicado correctamente.
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-neutral">Invertido en pujas</p>
          <p className="text-2xl font-bold text-gray-900">{formatEuro(totals.spent)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-neutral">Visitas totales</p>
          <p className="text-2xl font-bold text-gray-900">{totals.views}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-neutral">Contactos recibidos</p>
          <p className="text-2xl font-bold text-gray-900">{totals.contacts}</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">Mis deals</h2>
        {deals.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-neutral">
            Todavia no has publicado ningun deal.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {deals.map((deal) => (
              <div key={deal.id} className="card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`badge ${STATUS_STYLES[deal.status]}`}>
                    {STATUS_LABELS[deal.status]}
                  </span>
                  <span className="text-xs text-neutral">{DEAL_TYPE_LABELS[deal.deal_type]}</span>
                  <span className="ml-auto text-sm font-semibold text-success">
                    {formatEuro(deal.current_bid)}
                  </span>
                </div>

                <h3 className="mt-2 text-lg font-semibold text-gray-900">
                  <Link href={`/deals/${deal.id}`} className="hover:text-primary">
                    {deal.title}
                  </Link>
                </h3>

                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral">
                  <span>Posicion: {deal.position ? `#${deal.position}` : '—'}</span>
                  <span>{deal.views_count} visitas</span>
                  <span>{deal.contacts_count} contactos</span>
                  <span>Creado el {formatDate(deal.created_at)}</span>
                </div>

                {deal.status === 'active' ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/deals/${deal.id}/rebid`} className="btn-primary">
                      Repujar
                    </Link>
                    <CloseDealButton dealId={deal.id} />
                  </div>
                ) : null}

                {deal.status === 'pending' ? (
                  <p className="mt-3 text-sm text-warning">
                    Este deal se publicara cuando se confirme el pago de la puja.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">Mensajes recibidos</h2>
        {contacts.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-neutral">
            Aun no tienes mensajes.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {contacts.map((contact) => (
              <li key={contact.id} className="card p-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold text-gray-900">{contact.visitor_name}</span>
                  <a
                    href={`mailto:${contact.visitor_email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {contact.visitor_email}
                  </a>
                  <span className="ml-auto text-xs text-neutral">
                    {formatDate(contact.contacted_at)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral">En: {contact.deal_title}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-gray-800">{contact.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">Historial de pujas y pagos</h2>
        {bids.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-neutral">
            Todavia no has realizado pujas.
          </p>
        ) : (
          <div className="card mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-neutral">
                <tr>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Deal</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Importe</th>
                  <th className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {bids.map((bid) => (
                  <tr key={bid.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-3 text-neutral">{formatDate(bid.timestamp)}</td>
                    <td className="px-5 py-3">{bid.deal_title}</td>
                    <td className="px-5 py-3 text-neutral">
                      {bid.kind === 'initial' ? 'Publicacion' : 'Repuja'}
                    </td>
                    <td className="px-5 py-3 font-semibold">{formatEuro(bid.amount)}</td>
                    <td className="px-5 py-3">
                      {PAYMENT_LABELS[bid.payment_status] ?? bid.payment_status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
