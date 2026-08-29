import { jsonError, jsonOk, serverError } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Mensajes recibidos en un deal. Solo el propietario (RLS lo garantiza). */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError('No autenticado', 401);

    const { data: deal } = await supabase
      .from('deals')
      .select('id,user_id')
      .eq('id', params.id)
      .maybeSingle();

    if (!deal) return jsonError('Deal no encontrado', 404);
    if (deal.user_id !== user.id) return jsonError('No puedes ver estos mensajes', 403);

    const { data: contacts, error } = await supabase
      .from('deal_contacts')
      .select('id,deal_id,visitor_email,visitor_name,message,contacted_at')
      .eq('deal_id', params.id)
      .order('contacted_at', { ascending: false });

    if (error) return jsonError(error.message, 400);
    return jsonOk({ contacts: contacts ?? [] });
  } catch (err) {
    return serverError(err, 'deals/contacts');
  }
}
