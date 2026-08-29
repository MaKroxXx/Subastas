import { jsonError, jsonOk, serverError } from '@/lib/api';
import { getDashboardData } from '@/lib/dashboard';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError('No autenticado', 401);

    return jsonOk(await getDashboardData(user.id));
  } catch (err) {
    return serverError(err, 'users/dashboard');
  }
}
