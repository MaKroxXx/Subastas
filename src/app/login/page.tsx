import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import DemoNotice from '@/components/DemoNotice';
import LoginForm from '@/components/LoginForm';
import { getSessionUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Entrar' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const user = await getSessionUser();
  if (user) redirect('/dashboard');

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-gray-900">Entrar</h1>
      <p className="mt-1 text-sm text-neutral">Accede para publicar deals y contactar.</p>

      <div className="mt-6 space-y-4">
        <DemoNotice action="Iniciar sesion" />
        <div className="card p-6">
          <LoginForm next={searchParams.next} />
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-neutral">
        ¿No tienes cuenta?{' '}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
