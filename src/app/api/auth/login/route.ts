import { jsonError, jsonOk, parseBody, serverError } from '@/lib/api';
import { rateLimit } from '@/lib/rateLimit';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limit = rateLimit(`login:${ip}`, 20, 15 * 60 * 1000);
  if (!limit.allowed) {
    return jsonError('Demasiados intentos de acceso. Prueba mas tarde.', 429, {
      retryAfter: limit.retryAfterSeconds,
    });
  }

  const { data, error } = await parseBody(request, loginSchema);
  if (error) return error;

  try {
    const supabase = createClient();
    const { data: result, error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    // Mensaje generico: no revelamos si el email existe.
    if (signInError) return jsonError('Email o contrasena incorrectos', 401);

    return jsonOk({ user: { id: result.user.id, email: result.user.email } });
  } catch (err) {
    return serverError(err, 'auth/login');
  }
}
