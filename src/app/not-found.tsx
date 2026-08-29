import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">No encontramos esta pagina</h1>
      <p className="mt-2 text-sm text-neutral">
        Puede que el deal se haya cerrado o que la direccion sea incorrecta.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Ver deals activos
      </Link>
    </div>
  );
}
