import Stripe from 'stripe';
import { stripeSecretKey } from '@/lib/env';

let cached: Stripe | null = null;

/** Instancia unica de Stripe (server-only). */
export function getStripe(): Stripe {
  if (!cached) {
    // Fijamos la version de la API en vez de heredar la de la cuenta: cuentas
    // antiguas pueden tener fijada una version sin los campos que usamos
    // (por ejemplo automatic_payment_methods al crear el PaymentIntent).
    cached = new Stripe(stripeSecretKey(), { apiVersion: '2025-02-24.acacia' });
  }
  return cached;
}

/** Convierte euros a centimos, la unidad que espera Stripe. */
export function toCents(amountEuros: number): number {
  return Math.round(amountEuros * 100);
}

/** Stripe exige un minimo de 0,50 EUR por cargo. */
export const MIN_CHARGE_EUR = 0.5;
