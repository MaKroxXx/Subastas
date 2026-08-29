import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import DemoNotice from '@/components/DemoNotice';
import SignupForm from '@/components/SignupForm';
import { getSessionUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Crear cuenta' };
export const dynamic = 'force-dynamic';

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user) redirect('/dashboard');

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
      <p className="mt-1 text-sm text-neutral">Publica deals y puja por visibilidad.</p>

      <div className="mt-6 space-y-4">
        <DemoNotice action="Crear una cuenta" />
        <div className="card p-6">
          <SignupForm />
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-neutral">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
