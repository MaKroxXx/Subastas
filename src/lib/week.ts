/**
 * Numero de semana ISO-8601 con formato YYYYWW (ej. 202614).
 * El ranking se resetea cada lunes a las 00:00.
 */
export function isoWeekNumber(date: Date = new Date()): number {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Jueves de la semana actual determina el anio ISO.
  const dayNumber = (target.getUTCDay() + 6) % 7; // lunes = 0
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);
  const isoYear = target.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDayNumber = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNumber + 3);
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
  return isoYear * 100 + week;
}

/** Fecha del proximo lunes a las 00:00 UTC. */
export function nextResetDate(from: Date = new Date()): Date {
  const next = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const daysUntilMonday = (8 - next.getUTCDay()) % 7 || 7;
  next.setUTCDate(next.getUTCDate() + daysUntilMonday);
  return next;
}
