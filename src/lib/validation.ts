import { z } from 'zod';
import { DEAL_TYPES } from '@/lib/types';

export const MAX_DEALS_PER_DAY = 5;

export const emailSchema = z.string().trim().toLowerCase().email('Email no valido').max(255);

export const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres').max(72),
  name: z.string().trim().min(2, 'Nombre demasiado corto').max(120),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Introduce tu contrasena').max(72),
});

/** Puja: sin minimo (0 permitido) y sin limite superior practico. */
export const bidSchema = z.coerce
  .number({ invalid_type_error: 'La puja debe ser un numero' })
  .min(0, 'La puja no puede ser negativa')
  .max(100000, 'Puja demasiado alta')
  .refine((value) => Number.isFinite(value), 'Puja no valida')
  .transform((value) => Math.round(value * 100) / 100);

export const createDealSchema = z.object({
  title: z.string().trim().min(8, 'El titulo debe tener al menos 8 caracteres').max(140),
  description: z.string().trim().min(30, 'Describe tu deal con al menos 30 caracteres').max(5000),
  deal_type: z.enum(DEAL_TYPES, { errorMap: () => ({ message: 'Tipo de deal no valido' }) }),
  contact_email: emailSchema,
  image_url: z.string().url().max(1000).optional().nullable(),
  bid: bidSchema,
});

export const updateDealSchema = z.object({
  title: z.string().trim().min(8).max(140).optional(),
  description: z.string().trim().min(30).max(5000).optional(),
  deal_type: z.enum(DEAL_TYPES).optional(),
  contact_email: emailSchema.optional(),
  image_url: z.string().url().max(1000).nullable().optional(),
});

export const rebidSchema = z.object({
  amount: bidSchema,
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Nombre demasiado corto').max(120),
  email: emailSchema,
  message: z.string().trim().min(10, 'El mensaje debe tener al menos 10 caracteres').max(2000),
});

export const listDealsSchema = z.object({
  page: z.coerce.number().int().min(1).max(500).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
  type: z.enum(DEAL_TYPES).optional(),
  q: z.string().trim().max(120).optional(),
  section: z.enum(['featured', 'latest', 'all']).default('all'),
});

/** Escapa los comodines de PostgREST para busquedas `ilike` seguras. */
export function sanitizeSearch(term: string): string {
  return term.replace(/[%_,()]/g, ' ').trim();
}

export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Datos no validos';
}
