import { jsonError, jsonOk, serverError } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Marca el deal como cerrado. Solo el propietario. */
export async function PUT(_request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError('No autenticado', 401);

    const { data: deal } = await supabase
      .from('deals')
      .select('id,user_id,status')
      .eq('id', params.id)
      .maybeSingle();

    if (!deal) return jsonError('Deal no encontrado', 404);
    if (deal.user_id !== user.id) return jsonError('No puedes cerrar este deal', 403);
    if (deal.status === 'closed') return jsonOk({ deal });
    if (deal.status === 'pending') return jsonError('El deal aun no esta publicado', 409);

    const { data: updated, error } = await supabase
      .from('deals')
      .update({
        status: 'closed',
        deal_closed: true,
        closed_date: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select('id,status,deal_closed,closed_date')
      .single();

    if (error) return jsonError(error.message, 400);
    return jsonOk({ deal: updated });
  } catch (err) {
    return serverError(err, 'deals/close');
  }
}
