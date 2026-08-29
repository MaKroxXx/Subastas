import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SearchBar from '@/components/SearchBar';
import UserMenu from '@/components/UserMenu';

export const dynamic = 'force-dynamic';

export default async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name: string | null = null;
  if (user) {
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

        <div className="hidden flex-1 sm:block">
          <SearchBar />
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
