import { jsonError, jsonOk, parseBody, serverError } from '@/lib/api';
import { getPublicDeal } from '@/lib/deals';
import { createClient } from '@/lib/supabase/server';
import { updateDealSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface Params {
  params: { id: string };
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const deal = await getPublicDeal(params.id);
    if (!deal) return jsonError('Deal no encontrado', 404);
    return jsonOk({ deal });
  } catch (err) {
    return serverError(err, 'deals/detail');
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError('No autenticado', 401);

    const { data, error } = await parseBody(request, updateDealSchema);
    if (error) return error;

    const { data: existing } = await supabase
      .from('deals')
      .select('id,user_id,status')
      .eq('id', params.id)
      .maybeSingle();

    if (!existing) return jsonError('Deal no encontrado', 404);
    if (existing.user_id !== user.id) return jsonError('No puedes editar este deal', 403);
    if (existing.status === 'closed') return jsonError('El deal esta cerrado', 409);

    // No tocamos `updated_at`: es el desempate del ranking y editar el texto
    // no debe servir para adelantar posiciones.
    const patch = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
    if (Object.keys(patch).length === 0) return jsonError('Nada que actualizar', 422);

    const { data: updated, error: updateError } = await supabase
      .from('deals')
      .update(patch)
      .eq('id', params.id)
      .select('id,title,description,deal_type,contact_email,image_url,status')
      .single();

    if (updateError) return jsonError(updateError.message, 400);
    return jsonOk({ deal: updated });
  } catch (err) {
    return serverError(err, 'deals/update');
  }
}
