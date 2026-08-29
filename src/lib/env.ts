/**
 * Acceso centralizado a variables de entorno. Las funciones `require*` lanzan
 * un error claro en runtime en vez de fallar con `undefined` mas adelante.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}. Revisa tu .env.local`);
  }
  return value;
}

export const supabaseUrl = () =>
  required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);

export const supabaseAnonKey = () =>
  required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const supabaseServiceKey = () =>
  required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);

export const stripeSecretKey = () => required('STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY);

export const stripeWebhookSecret = () =>
  required('STRIPE_WEBHOOK_SECRET', process.env.STRIPE_WEBHOOK_SECRET);

export const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000';

export const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);
