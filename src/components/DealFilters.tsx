'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { DEAL_TYPES, DEAL_TYPE_LABELS } from '@/lib/types';

/** Filtro por tipo de deal. Escribe el valor en la query string. */
export default function DealFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get('type') ?? '';

  function onChange(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set('type', value);
    else next.delete('type');
    next.delete('page');
    router.push(next.toString() ? `/?${next}` : '/');
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="type-filter" className="text-sm text-neutral">
        Tipo
      </label>
      <select
        id="type-filter"
        className="input w-auto"
        value={current}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Todos</option>
        {DEAL_TYPES.map((type) => (
          <option key={type} value={type}>
            {DEAL_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
    </div>
  );
}
