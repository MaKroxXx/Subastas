import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabaseAnonKey, supabaseServiceKey, supabaseUrl } from '@/lib/env';

/**
 * Cliente ligado a la sesion del usuario (cookies). Respeta RLS.
 * Usar en Server Components, Route Handlers y Server Actions.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Los Server Components no pueden escribir cookies: el middleware
          // ya se encarga de refrescar la sesion.
        }
      },
    },
  });
}

/**
 * Cliente con service role: ignora RLS. Solo en el servidor y unicamente
 * despues de haber validado la autorizacion a mano.
 */
export function createAdminClient() {
  return createSupabaseClient(supabaseUrl(), supabaseServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Devuelve el usuario autenticado o null. */
export async function getSessionUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
