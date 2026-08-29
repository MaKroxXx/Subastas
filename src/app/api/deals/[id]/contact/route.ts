import { jsonError, jsonOk, parseBody, serverError } from '@/lib/api';
import { newContactEmail, sendEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rateLimit';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { contactSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** Envia un mensaje al publicador. Requiere sesion iniciada. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError('Debes iniciar sesion para contactar', 401);

    const limit = rateLimit(`contact:${user.id}`, 15, 60 * 60 * 1000);
    if (!limit.allowed) {
      return jsonError('Has enviado demasiados mensajes. Prueba mas tarde.', 429, {
        retryAfter: limit.retryAfterSeconds,
      });
    }

    const { data, error } = await parseBody(request, contactSchema);
    if (error) return error;

    const { data: deal } = await supabase
      .from('deals')
      .select('id,title,user_id,status,contact_email,contacts_count')
      .eq('id', params.id)
      .maybeSingle();

    if (!deal) return jsonError('Deal no encontrado', 404);
    if (deal.status !== 'active') return jsonError('Este deal ya no admite contactos', 409);
    if (deal.user_id === user.id) return jsonError('No puedes contactar con tu propio deal', 422);

    // Service role: el visitante no tiene permiso de escritura sobre la tabla.
    const admin = createAdminClient();
    const { data: contact, error: insertError } = await admin
      .from('deal_contacts')
      .insert({
        deal_id: deal.id,
        visitor_id: user.id,
        visitor_email: data.email,
        visitor_name: data.name,
        message: data.message,
      })
      .select('id,contacted_at')
      .single();

    if (insertError) return jsonError(insertError.message, 400);

    await admin
      .from('deals')
      .update({ contacts_count: Number(deal.contacts_count) + 1 })
      .eq('id', deal.id);

    const { subject, text } = newContactEmail(deal.title, deal.id, data.name, data.message);
    await sendEmail({ to: deal.contact_email, subject, text });

    return jsonOk({ contact }, 201);
  } catch (err) {
    return serverError(err, 'deals/contact');
  }
}
