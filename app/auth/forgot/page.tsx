'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErrorMsg(null);

    try {
      const origin =
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

      const base = origin.replace(/\/$/, '');

const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${base}/auth/reset`,
});

      // Não revelar se o email existe ou não
      if (error) {
        console.error(error);
      }

      setMsg('Se esse e-mail existir, você receberá um link para redefinir sua senha.');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Não foi possível enviar o link agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-sm w-full bg-white border rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="flex flex-col items-center gap-3 mb-1">
            <Image
              src="/medturn-logo.png"
              alt="MedTurn"
              width={64}
              height={64}
              priority
              className="rounded-xl shadow-sm"
            />
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Redefinir senha
            </h1>
            <p className="text-sm text-slate-500">
              Enviaremos um link para o seu e-mail.
            </p>
          </div>
        </div>

        {msg && (
          <div className="mb-4 bg-emerald-50 text-emerald-700 text-xs p-3 rounded-lg border border-emerald-100">
            {msg}
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="doutor@exemplo.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-70 transition-colors"
          >
            {loading ? 'Enviando...' : 'Enviar link'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full border border-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Voltar ao login
          </button>
        </form>
      </div>
    </div>
  );
}