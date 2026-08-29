import { jsonError, jsonOk, serverError } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/server';
import { isoWeekNumber } from '@/lib/week';

export const dynamic = 'force-dynamic';

/**
 * Reset semanal (lunes 00:00 UTC). Lo dispara el cron de Vercel definido en
 * vercel.json; tambien acepta una llamada manual con el header
 * `Authorization: Bearer $CRON_SECRET`.
 */
async function runWeeklyReset(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorized =
    (secret && request.headers.get('authorization') === `Bearer ${secret}`) ||
    // Vercel Cron firma sus llamadas con esta cabecera.
    request.headers.get('x-vercel-cron') !== null;

  if (!authorized) return jsonError('No autorizado', 401);

  try {
    const admin = createAdminClient();
    const week = isoWeekNumber();
    const { data, error } = await admin.rpc('weekly_reset', { p_week: week, p_archive_weeks: 8 });

    if (error) return jsonError(error.message, 500);

    const result = Array.isArray(data) ? data[0] : data;
    return jsonOk({ week, ...result });
  } catch (err) {
    return serverError(err, 'cron/weekly-reset');
  }
}

export async function GET(request: Request) {
  return runWeeklyReset(request);
}

export async function POST(request: Request) {
  return runWeeklyReset(request);
}
