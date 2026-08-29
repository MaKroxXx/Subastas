import { jsonError, jsonOk, serverError } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return jsonError('No autenticado', 401);

    const { data: profile } = await supabase
      .from('users')
      .select('id,email,name,bio,created_at')
      .eq('id', user.id)
      .maybeSingle();

    return jsonOk({
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name ?? user.user_metadata?.name ?? null,
        bio: profile?.bio ?? null,
        created_at: profile?.created_at ?? user.created_at,
      },
    });
  } catch (err) {
    return serverError(err, 'auth/me');
  }
}
