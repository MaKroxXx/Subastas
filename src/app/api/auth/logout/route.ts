import { jsonOk, serverError } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
    return jsonOk({ ok: true });
  } catch (err) {
    return serverError(err, 'auth/logout');
  }
}
