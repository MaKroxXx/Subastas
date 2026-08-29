import Link from 'next/link';

interface Props {
  page: number;
  totalPages: number;
  /** Parametros a conservar entre paginas (busqueda, filtro...). */
  params: Record<string, string | undefined>;
  basePath?: string;
}

function buildHref(basePath: string, params: Props['params'], page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  if (page > 1) query.set('page', String(page));
  return query.toString() ? `${basePath}?${query}` : basePath;
}

export default function Pagination({ page, totalPages, params, basePath = '/' }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Paginacion">
      {page > 1 ? (
        <Link href={buildHref(basePath, params, page - 1)} className="btn-secondary">
          ← Anterior
        </Link>
      ) : (
        <span className="btn-secondary pointer-events-none opacity-50">← Anterior</span>
      )}

      <span className="text-sm text-neutral">
        Pagina {page} de {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={buildHref(basePath, params, page + 1)} className="btn-secondary">
          Siguiente →
        </Link>
      ) : (
        <span className="btn-secondary pointer-events-none opacity-50">Siguiente →</span>
      )}
    </nav>
  );
}
