import type { Metadata } from 'next';
import Script from 'next/script';
import Navbar from '@/components/Navbar';
import { siteUrl } from '@/lib/env';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'DealStartups | Marketplace de deals con pujas semanales',
    template: '%s | DealStartups',
  },
  description:
    'Encuentra socios, inversores y oportunidades. Publica tu deal y puja por visibilidad. Ranking semanal.',
  openGraph: {
    title: 'DealStartups',
    description: 'Encuentra socios, inversores y oportunidades. Puja por visibilidad.',
    type: 'website',
    locale: 'es_ES',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="es">
      <body className="min-h-screen bg-canvas">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-24 sm:px-6">{children}</main>
        <footer className="border-t border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-neutral sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>© {new Date().getFullYear()} DealStartups</p>
            <p>Puja por visibilidad. Semanal. Justo.</p>
          </div>
        </footer>

        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
