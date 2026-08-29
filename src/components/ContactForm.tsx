'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Props {
  dealId: string;
  isLoggedIn: boolean;
  isOwner: boolean;
  isClosed: boolean;
  defaultName?: string;
  defaultEmail?: string;
}

export default function ContactForm({
  dealId,
  isLoggedIn,
  isOwner,
  isClosed,
  defaultName = '',
  defaultEmail = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (isClosed) {
    return (
      <p className="rounded-lg bg-gray-100 px-4 py-3 text-sm text-neutral">
        Este deal esta cerrado y ya no admite contactos.
      </p>
    );
  }

  if (isOwner) {
    return (
      <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
        Este deal es tuyo. Revisa los mensajes recibidos en tu{' '}
        <Link href="/dashboard" className="font-semibold underline">
          panel
        </Link>
        .
      </p>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <p>Necesitas una cuenta para contactar con el publicador.</p>
        <div className="mt-3 flex gap-2">
          <Link href={`/login?next=/deals/${dealId}`} className="btn-primary">
            Entrar
          </Link>
          <Link href="/signup" className="btn-secondary">
            Crear cuenta
          </Link>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-success">
        Mensaje enviado. El publicador recibira un aviso por email.
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" className="btn-primary w-full" onClick={() => setOpen(true)}>
        Contactar
      </button>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/deals/${dealId}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'No se pudo enviar el mensaje');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="label" htmlFor="contact-name">
          Tu nombre
        </label>
        <input
          id="contact-name"
          className="input"
          required
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="contact-email-field">
          Tu email
        </label>
        <input
          id="contact-email-field"
          type="email"
          className="input"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="contact-message">
          Mensaje
        </label>
        <textarea
          id="contact-message"
          className="input min-h-[120px]"
          required
          minLength={10}
          maxLength={2000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Cuentale por que te interesa y como puedes aportar."
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Enviando...' : 'Enviar mensaje'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)} disabled={busy}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
