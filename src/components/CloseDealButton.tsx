'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Reporta un deal como cerrado (deja de admitir contactos y pujas). */
export default function CloseDealButton({ dealId }: { dealId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function close() {
    if (!window.confirm('¿Marcar este deal como cerrado? No podras reabrirlo ni repujar.')) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/deals/${dealId}/close`, { method: 'PUT' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'No se pudo cerrar el deal');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" className="btn-secondary" onClick={close} disabled={busy}>
        {busy ? 'Cerrando...' : 'Reportar como cerrado'}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
