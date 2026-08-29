'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import BidInput from '@/components/BidInput';
import StripeCheckout from '@/components/StripeCheckout';
import { formatEuro } from '@/lib/types';

interface Props {
  dealId: string;
  dealTitle: string;
  currentBid: number;
}

export default function RebidForm({ dealId, dealTitle, currentBid }: Props) {
  const router = useRouter();
  const suggested = Math.max(currentBid + 5, 5);
  const [amount, setAmount] = useState(suggested);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [payment, setPayment] = useState<{ clientSecret: string; paymentIntentId: string } | null>(
    null,
  );

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/deals/${dealId}/rebid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'No se pudo crear la puja');

      setPayment({ clientSecret: payload.clientSecret, paymentIntentId: payload.paymentIntentId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setBusy(false);
    }
  }

  if (payment) {
    return (
      <div className="card space-y-4 p-6">
        <h2 className="text-lg font-semibold">Confirma tu puja de {formatEuro(amount)}</h2>
        <StripeCheckout
          clientSecret={payment.clientSecret}
          paymentIntentId={payment.paymentIntentId}
          amount={amount}
          returnUrl={`${window.location.origin}/deals/${dealId}`}
          onPaid={() => {
            router.push(`/deals/${dealId}?paid=1`);
            router.refresh();
          }}
          onCancel={() => setPayment(null)}
        />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6">
      <div>
        <h2 className="text-lg font-semibold">{dealTitle}</h2>
        <p className="mt-1 text-sm text-neutral">
          Puja actual: <strong>{formatEuro(currentBid)}</strong>. La nueva puja debe superarla.
        </p>
      </div>

      <BidInput
        value={amount}
        onChange={setAmount}
        min={currentBid}
        label="Nueva puja"
        help={`Debe ser mayor que ${formatEuro(currentBid)}`}
      />

      {amount <= currentBid ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-warning">
          Sube la puja por encima de {formatEuro(currentBid)} para mejorar tu posicion.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn-primary" disabled={busy || amount <= currentBid}>
        {busy ? 'Preparando pago...' : `Pujar ${formatEuro(amount)}`}
      </button>
    </form>
  );
}
