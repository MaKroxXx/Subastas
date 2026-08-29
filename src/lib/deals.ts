import type { SupabaseClient } from '@supabase/supabase-js';
import { demoGetDeal, demoListDeals, demoStats } from '@/lib/demo';
import { isDemoMode } from '@/lib/env';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { sanitizeSearch } from '@/lib/validation';
import type { DealType, PublicDeal } from '@/lib/types';

export const DEAL_COLUMNS =
  'id,user_id,title,description,deal_type,image_url,current_bid,status,week_number,views_count,contacts_count,created_at,updated_at,deal_closed,closed_date,author_name,position';

export interface ListDealsOptions {
  page?: number;
  perPage?: number;
  type?: DealType;
  q?: string;
  /** 'featured' = con puja > 0; 'latest' = puja 0; 'all' = ambos. */
  section?: 'featured' | 'latest' | 'all';
}

export interface ListDealsResult {
  deals: PublicDeal[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/**
 * Listado de deals desde la vista `ranked_deals`, que ya incorpora la posicion
 * global y el nombre del publicador (nunca su email).
 */
export async function listDeals(
  options: ListDealsOptions = {},
  client?: SupabaseClient,
): Promise<ListDealsResult> {
  if (isDemoMode()) return demoListDeals(options);

  const { page = 1, perPage = 10, type, q, section = 'all' } = options;
  const supabase = client ?? createClient();

  let query = supabase
    .from('ranked_deals')
    .select(DEAL_COLUMNS, { count: 'exact' })
    .eq('status', 'active');

  if (section === 'featured') query = query.gt('current_bid', 0);
  if (section === 'latest') query = query.eq('current_bid', 0);
  if (type) query = query.eq('deal_type', type);

  if (q) {
    const term = sanitizeSearch(q);
    if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  if (section === 'latest') {
    query = query.order('created_at', { ascending: false });
  } else {
    query = query
      .order('current_bid', { ascending: false })
      .order('updated_at', { ascending: false });
  }

  const from = (page - 1) * perPage;
  const { data, error, count } = await query.range(from, from + perPage - 1);

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    deals: (data ?? []) as unknown as PublicDeal[],
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/** Deal publico por id (incluye los cerrados, que se muestran con badge). */
export async function getPublicDeal(id: string, client?: SupabaseClient): Promise<PublicDeal | null> {
  if (isDemoMode()) return demoGetDeal(id);

  const supabase = client ?? createClient();
  const { data, error } = await supabase
    .from('ranked_deals')
    .select(DEAL_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as unknown as PublicDeal) ?? null;
}

/** Suma una visita sin bloquear el render si falla. */
export async function registerView(id: string): Promise<void> {
  if (isDemoMode()) return;

  try {
    const supabase = createAdminClient();
    await supabase.rpc('increment_deal_views', { p_deal_id: id });
  } catch (error) {
    console.error('[deals] no se pudo registrar la visita:', error);
  }
}

export interface MarketplaceStats {
  activeDeals: number;
  users: number;
}

export async function getStats(): Promise<MarketplaceStats> {
  if (isDemoMode()) return demoStats();

  try {
    const supabase = createAdminClient();
    const [deals, users] = await Promise.all([
      supabase.from('deals').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('users').select('id', { count: 'exact', head: true }),
    ]);
    return { activeDeals: deals.count ?? 0, users: users.count ?? 0 };
  } catch (error) {
    console.error('[deals] no se pudieron cargar las estadisticas:', error);
    return { activeDeals: 0, users: 0 };
  }
}
