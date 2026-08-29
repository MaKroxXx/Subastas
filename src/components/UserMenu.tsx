'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function UserMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function logout() {
    setBusy(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    setOpen(false);
    setBusy(false);
    router.push('/');
    router.refresh();
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="max-w-[10rem] truncate">{name}</span>
        <span aria-hidden>▾</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          <Link
            href="/dashboard"
            role="menuitem"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Mi panel
          </Link>
          <Link
            href="/dashboard/new-deal"
            role="menuitem"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Nuevo deal
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            disabled={busy}
            className="block w-full px-4 py-2 text-left text-sm text-danger hover:bg-gray-50 disabled:opacity-60"
          >
            {busy ? 'Saliendo...' : 'Cerrar sesion'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
