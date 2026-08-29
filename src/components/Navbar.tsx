import Link from 'next/link';
import { Suspense } from 'react';
import { isDemoMode } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import SearchBar from '@/components/SearchBar';
import UserMenu from '@/components/UserMenu';

export const dynamic = 'force-dynamic';

export default async function Navbar() {
  const demo = isDemoMode();
  const supabase = demo ? null : createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  let name: string | null = null;
  if (user && supabase) {
    const { data: profile } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .maybeSingle();
    name = profile?.name ?? (user.user_metadata?.name as string | undefined) ?? user.email ?? null;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-gray-900">
          Deal<span className="text-primary">Startups</span>
        </Link>

        {demo ? (
          <span className="badge bg-amber-50 text-amber-700 ring-amber-200">Demo</span>
        ) : null}

        <div className="hidden flex-1 sm:block">
          {/* useSearchParams() exige un limite de Suspense en paginas estaticas. */}
          <Suspense fallback={<div className="h-[38px] rounded-lg bg-gray-100" />}>
            <SearchBar />
          </Suspense>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard/new-deal" className="btn-primary hidden sm:inline-flex">
                Nuevo deal
              </Link>
              <UserMenu name={name ?? 'Mi cuenta'} />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">
                Entrar
              </Link>
              <Link href="/signup" className="btn-primary hidden sm:inline-flex">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
