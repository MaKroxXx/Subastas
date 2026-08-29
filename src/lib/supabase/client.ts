'use client';

import { createBrowserClient } from '@supabase/ssr';
import { supabaseAnonKey, supabaseUrl } from '@/lib/env';

/** Cliente de Supabase para componentes de cliente. */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
