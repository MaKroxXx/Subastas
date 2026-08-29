import { jsonError, jsonOk, serverError } from '@/lib/api';
import { DEAL_COLUMNS } from '@/lib/deals';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Perfil publico: nombre, bio y deals activos. Nunca el email. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from('users')
      .select('id,name,bio,created_at')
      .eq('id', params.id)
      .maybeSingle();

    if (error) return jsonError(error.message, 400);
    if (!profile) return jsonError('Usuario no encontrado', 404);

    const { data: deals } = await createClient()
      .from('ranked_deals')
      .select(DEAL_COLUMNS)
      .eq('user_id', params.id)
      .eq('status', 'active')
      .order('current_bid', { ascending: false })
      .limit(20);

    return jsonOk({ user: profile, deals: deals ?? [] });
  } catch (err) {
    return serverError(err, 'users/profile');
  }
}
