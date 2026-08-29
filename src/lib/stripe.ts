import Stripe from 'stripe';
import { stripeSecretKey } from '@/lib/env';

let cached: Stripe | null = null;

/** Instancia unica de Stripe (server-only). */
export function getStripe(): Stripe {
  if (!cached) {
    // Sin apiVersion explicita se usa la version fijada en la cuenta de Stripe.
    cached = new Stripe(stripeSecretKey());
  }
  return cached;
}

/** Convierte euros a centimos, la unidad que espera Stripe. */
export function toCents(amountEuros: number): number {
  return Math.round(amountEuros * 100);
}

/** Stripe exige un minimo de 0,50 EUR por cargo. */
export const MIN_CHARGE_EUR = 0.5;
