import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MedTurn Admin',
  description: 'Painel administrativo dos hospitais no MedTurn',
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
