import Link from 'next/link';
import { DEAL_TYPE_BADGE, DEAL_TYPE_LABELS, formatEuro, type PublicDeal } from '@/lib/types';

function isNew(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 48 * 60 * 60 * 1000;
}

function preview(description: string, length = 180): string {
  const clean = description.replace(/\s+/g, ' ').trim();
  return clean.length > length ? `${clean.slice(0, length)}…` : clean;
}

export default function DealCard({ deal }: { deal: PublicDeal }) {
  return (
    <article className="card p-5 transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        {deal.position ? (
          <span className="text-sm font-bold text-neutral">#{deal.position}</span>
        ) : null}
        <span className={`badge ${DEAL_TYPE_BADGE[deal.deal_type]}`}>
          {DEAL_TYPE_LABELS[deal.deal_type]}
        </span>
        {isNew(deal.created_at) ? (
          <span className="badge bg-blue-50 text-blue-700 ring-blue-200">Nuevo</span>
        ) : null}
        {deal.status === 'closed' ? (
          <span className="badge bg-gray-100 text-gray-600 ring-gray-300">CERRADO</span>
        ) : null}
        <span className="ml-auto text-sm font-semibold text-success">
          {formatEuro(Number(deal.current_bid))}
        </span>
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-snug text-gray-900">
        <Link href={`/deals/${deal.id}`} className="hover:text-primary">
          {deal.title}
        </Link>
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-neutral">{preview(deal.description)}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral">
        <span>Por {deal.author_name}</span>
        <span>{deal.views_count} visitas</span>
        <span>{deal.contacts_count} contactos</span>
        <Link href={`/deals/${deal.id}`} className="ml-auto font-semibold text-primary hover:underline">
          Ver y contactar →
        </Link>
      </div>
    </article>
  );
}
