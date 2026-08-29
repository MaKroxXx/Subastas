import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { firstZodError } from '@/lib/validation';

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/** Parsea el body JSON con un esquema zod y devuelve el error listo para responder. */
export async function parseBody<T>(
  request: Request,
  schema: { parse: (input: unknown) => T },
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { data: null, error: jsonError('El cuerpo de la peticion debe ser JSON valido') };
  }

  try {
    return { data: schema.parse(raw), error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return { data: null, error: jsonError(firstZodError(error), 422) };
    }
    return { data: null, error: jsonError('Datos no validos', 422) };
  }
}

/** Convierte cualquier excepcion en una respuesta 500 sin filtrar detalles internos. */
export function serverError(error: unknown, context: string) {
  console.error(`[api] ${context}:`, error);
  return jsonError('Error interno del servidor', 500);
}
