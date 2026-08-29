import DealCard from '@/components/DealCard';
import DealFilters from '@/components/DealFilters';
import Pagination from '@/components/Pagination';
import { getStats, listDeals } from '@/lib/deals';
import { isDealType } from '@/lib/types';
import { nextResetDate } from '@/lib/week';

export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  type?: string;
  page?: string;
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const page = Math.max(1, Number(searchParams.page ?? '1') || 1);
  const type = isDealType(searchParams.type) ? searchParams.type : undefined;
  const q = searchParams.q?.trim() || undefined;

  const [featured, latest, stats] = await Promise.all([
    listDeals({ page, perPage: 10, type, q, section: 'featured' }),
    // "Ultimos deals" solo en la primera pagina: es la seccion secundaria.
    page === 1 ? listDeals({ page: 1, perPage: 10, type, q, section: 'latest' }) : null,
    getStats(),
  ]);

  const reset = nextResetDate();

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 sm:p-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Encuentra socios, inversores, oportunidades
        </h1>
        <p className="mt-3 text-lg text-neutral">Puja por visibilidad. Semanal. Justo.</p>

        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-neutral">Deals activos</dt>
            <dd className="text-2xl font-bold text-gray-900">{stats.activeDeals}</dd>
          </div>
          <div>
            <dt className="text-neutral">Usuarios</dt>
            <dd className="text-2xl font-bold text-gray-900">{stats.users}</dd>
          </div>
          <div>
            <dt className="text-neutral">Proximo reset del ranking</dt>
            <dd className="text-2xl font-bold text-gray-900">
              {reset.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Deals destacados</h2>
            <p className="text-sm text-neutral">
              Ordenados por puja semanal. {featured.total} deals con puja activa.
            </p>
          </div>
          <DealFilters />
        </div>

        {q ? (
          <p className="mt-3 text-sm text-neutral">
            Resultados para <strong>{q}</strong>
          </p>
        ) : null}

        {featured.deals.length > 0 ? (
          <div className="mt-5 space-y-4">
            {featured.deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-neutral">
            Todavia no hay deals destacados con estos filtros.
          </p>
        )}

        <Pagination
          page={featured.page}
          totalPages={featured.totalPages}
          params={{ q, type }}
        />
      </section>

      {latest && latest.deals.length > 0 ? (
        <section>
          <h2 className="text-xl font-bold text-gray-900">Ultimos deals</h2>
          <p className="text-sm text-neutral">Publicados sin puja (0 €), ordenados por fecha.</p>
          <div className="mt-5 space-y-4 opacity-90">
            {latest.deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
