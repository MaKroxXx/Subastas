'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [term, setTerm] = useState(params.get('q') ?? '');

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams();
    if (term.trim()) next.set('q', term.trim());
    const type = params.get('type');
    if (type) next.set('type', type);
    router.push(next.toString() ? `/?${next}` : '/');
  }

  return (
    <form onSubmit={onSubmit} role="search">
      <label htmlFor="navbar-search" className="sr-only">
        Buscar deals
      </label>
      <input
        id="navbar-search"
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Buscar deals: socio tecnico, SaaS, inversion..."
        className="input"
      />
    </form>
  );
}
