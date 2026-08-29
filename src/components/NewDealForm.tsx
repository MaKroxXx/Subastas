'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import BidInput from '@/components/BidInput';
import StripeCheckout from '@/components/StripeCheckout';
import { createClient } from '@/lib/supabase/client';
import { DEAL_TYPES, DEAL_TYPE_LABELS, type DealType } from '@/lib/types';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

interface PaymentStep {
  dealId: string;
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
}

export default function NewDealForm({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dealType, setDealType] = useState<DealType>('busco_socio');
  const [contactEmail, setContactEmail] = useState(userEmail);
  const [bid, setBid] = useState(10);
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [payment, setPayment] = useState<PaymentStep | null>(null);

  async function uploadImage(): Promise<string | null> {
    if (!image) return null;
    if (image.size > MAX_IMAGE_BYTES) throw new Error('La imagen supera los 2 MB');

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Sesion caducada, vuelve a entrar');

    const extension = image.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('deal-images')
      .upload(path, image, { cacheControl: '3600', upsert: false });

    if (uploadError) throw new Error(`No se pudo subir la imagen: ${uploadError.message}`);

    return supabase.storage.from('deal-images').getPublicUrl(path).data.publicUrl;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const imageUrl = await uploadImage();

      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          deal_type: dealType,
          contact_email: contactEmail,
          image_url: imageUrl,
          bid,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'No se pudo crear el deal');

      if (!payload.requiresPayment) {
        router.push('/dashboard?created=1');
        router.refresh();
        return;
      }

      setPayment({
        dealId: payload.deal.id,
        clientSecret: payload.clientSecret,
        paymentIntentId: payload.paymentIntentId,
        amount: bid,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setBusy(false);
    }
  }

  if (payment) {
    return (
      <div className="card space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Confirma tu puja</h2>
          <p className="mt-1 text-sm text-neutral">
            Tu deal se publicara en cuanto se confirme el pago.
          </p>
        </div>
        <StripeCheckout
          clientSecret={payment.clientSecret}
          paymentIntentId={payment.paymentIntentId}
          amount={payment.amount}
          returnUrl={`${window.location.origin}/deals/${payment.dealId}`}
          onPaid={() => {
            router.push(`/deals/${payment.dealId}?paid=1`);
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6">
      <div>
        <label className="label" htmlFor="title">
          Titulo del deal
        </label>
        <input
          id="title"
          className="input"
          required
          minLength={8}
          maxLength={140}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Busco socio tecnico para SaaS B2B con clientes"
        />
      </div>

      <div>
        <label className="label" htmlFor="description">
          Descripcion
        </label>
        <textarea
          id="description"
          className="input min-h-[160px]"
          required
          minLength={30}
          maxLength={5000}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Explica el contexto, que buscas y que ofreces."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="deal_type">
            Tipo de deal
          </label>
          <select
            id="deal_type"
            className="input"
            value={dealType}
            onChange={(event) => setDealType(event.target.value as DealType)}
          >
            {DEAL_TYPES.map((type) => (
              <option key={type} value={type}>
                {DEAL_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="contact_email">
            Email de contacto
          </label>
          <input
            id="contact_email"
            type="email"
            className="input"
            required
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
          />
          <p className="mt-1 text-xs text-neutral">No se muestra publicamente.</p>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="image">
          Foto o logo (opcional)
        </label>
        <input
          id="image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="input"
          onChange={(event) => setImage(event.target.files?.[0] ?? null)}
        />
      </div>

      <BidInput value={bid} onChange={setBid} label="Puja inicial semanal" />

      {bid === 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-warning">
          Con puja de 0 € tu deal se publica en la seccion &laquo;Ultimos deals&raquo;, con menos
          visibilidad.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? 'Creando...' : bid > 0 ? 'Crear y pagar' : 'Publicar gratis'}
      </button>
    </form>
  );
}
