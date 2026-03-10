import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'MedTurn',
    template: '%s | MedTurn',
  },
  description:
    'Gestão inteligente de plantões, trocas, escalas médicas e fechamento financeiro em um só sistema.',
  metadataBase: new URL('https://medturnapp.com'),

  openGraph: {
    type: 'website',
    url: 'https://medturnapp.com',
    siteName: 'MedTurn',
    title: 'MedTurn — Gestão inteligente de plantões',
    description:
      'Organize escalas médicas, aprove trocas com aprovação e centralize o fechamento financeiro da equipe.',
    locale: 'pt_BR',
    images: [
      {
        url: '/medturn-logo.png',
        width: 512,
        height: 512,
        alt: 'MedTurn',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'MedTurn — Gestão inteligente de plantões',
    description:
      'Organize escalas médicas, aprove trocas com aprovação e centralize o fechamento financeiro da equipe.',
    images: ['/medturn-logo.png'],
  },

  icons: {
    icon: '/favicon.ico',
    apple: '/medturn-logo-rounded.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-100 text-slate-900">
        {children}
      </body>
    </html>
  );
}