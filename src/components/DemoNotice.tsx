import { isDemoMode } from '@/lib/env';

/**
 * Aviso visible cuando la web corre sin Supabase: los datos son de ejemplo y
 * las acciones que escriben (registro, publicar, pagar) estan desactivadas.
 */
export default function DemoNotice({ action }: { action?: string }) {
  if (!isDemoMode()) return null;

  return (
    <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
      <p className="font-semibold">Modo demo</p>
      <p className="mt-1">
        {action ?? 'Esta accion'} necesita Supabase y Stripe configurados. Los deals que ves son de
        ejemplo. Anade tus claves en <code className="font-mono">.env.local</code> para activar la
        web completa (ver README).
      </p>
    </div>
  );
}
