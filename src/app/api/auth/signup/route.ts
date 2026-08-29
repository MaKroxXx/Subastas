import { jsonError, jsonOk, parseBody, serverError } from '@/lib/api';
import { rateLimit } from '@/lib/rateLimit';
import { createClient } from '@/lib/supabase/server';
import { signupSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limit = rateLimit(`signup:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) {
    return jsonError('Demasiados intentos. Prueba mas tarde.', 429, {
      retryAfter: limit.retryAfterSeconds,
    });
  }

  const { data, error } = await parseBody(request, signupSchema);
  if (error) return error;

  try {
    const supabase = createClient();
    const { data: result, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name } },
    });

    if (signUpError) {
      const status = signUpError.status === 422 ? 409 : signUpError.status || 400;
      return jsonError(signUpError.message, status);
    }

    // Con confirmacion de email activada no hay sesion hasta que el usuario
    // confirma; el cliente debe avisar de que revise su correo.
    return jsonOk(
      {
        user: result.user ? { id: result.user.id, email: result.user.email } : null,
        needsEmailConfirmation: !result.session,
      },
      201,
    );
  } catch (err) {
    return serverError(err, 'auth/signup');
  }
}
