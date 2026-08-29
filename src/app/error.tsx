'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Algo ha fallado</h1>
      <p className="mt-2 text-sm text-neutral">
        Vuelve a intentarlo. Si el problema persiste, revisa la configuracion de Supabase y Stripe.
      </p>
      <p className="mt-2 text-xs text-neutral">{error.message}</p>
      <button type="button" className="btn-primary mt-6" onClick={reset}>
        Reintentar
      </button>
    </div>
  );
}
