'use client';

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { useState } from 'react';
import { formatEuro } from '@/lib/types';

let stripePromise: Promise<Stripe | null> | null = null;

function getStripePromise() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}

interface Props {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  /** URL a la que vuelve el usuario si el metodo de pago exige redireccion. */
  returnUrl: string;
  onPaid: () => void | Promise<void>;
  onCancel?: () => void;
}

function CheckoutForm({ paymentIntentId, amount, returnUrl, onPaid, onCancel }: Omit<Props, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setBusy(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message ?? 'No se pudo procesar el pago');
      setBusy(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      // Aplicamos la puja sin esperar al webhook (la operacion es idempotente).
      await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
      }).catch(() => undefined);
      await onPaid();
      return;
    }

    setError('El pago quedo pendiente de confirmacion. Te avisaremos por email.');
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />

      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-success" disabled={!stripe || busy}>
          {busy ? 'Procesando...' : `Pagar ${formatEuro(amount)}`}
        </button>
        {onCancel ? (
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default function StripeCheckout({ clientSecret, ...rest }: Props) {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-warning">
        Falta configurar NEXT_PUBLIC_STRIPE_PUBLIC_KEY para poder cobrar.
      </p>
    );
  }

  return (
    <Elements
      stripe={getStripePromise()}
      options={{
        clientSecret,
        appearance: { theme: 'stripe', variables: { colorPrimary: '#3B82F6' } },
      }}
    >
      <CheckoutForm {...rest} />
    </Elements>
  );
}
