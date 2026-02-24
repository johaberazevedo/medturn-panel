'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Opcional: garantir que existe sessão de recovery
    const [validating, setValidating] = useState(true);
  const [canSetPassword, setCanSetPassword] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        if (typeof window === 'undefined') return;

        setValidating(true);
        setErrorMsg(null);

        const url = new URL(window.location.href);

        // ✅ 1) Fluxo PKCE: vem como ?code=...
        const code = url.searchParams.get('code');

if (code) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

  if (error || !data?.session) {
    console.error(error);
    setErrorMsg('Link inválido ou expirado. Solicite um novo link.');
    setCanSetPassword(false);
    return;
  }

  setCanSetPassword(true);
  return;
}

// ✅ 2) Fluxo alternativo: tokens no hash (#access_token=...)
if (url.hash && url.hash.includes('access_token=')) {
  const authAny = supabase.auth as any;
  const { data, error } = await authAny.getSessionFromUrl({ storeSession: true });

  if (error || !data?.session) {
    console.error(error);
    setErrorMsg('Link inválido ou expirado. Solicite um novo link.');
    setCanSetPassword(false);
    return;
  }

  setCanSetPassword(true);
  return;
}

        // ✅ 3) Se abriu /auth/reset “na mão” (sem link)
        setErrorMsg('Abra esta página usando o link enviado por e-mail.');
        setCanSetPassword(false);
      } catch (e) {
        console.error(e);
        setErrorMsg('Link inválido ou expirado. Solicite um novo link.');
        setCanSetPassword(false);
      } finally {
        setValidating(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpdate(e: React.FormEvent) {
  e.preventDefault();
  setMsg(null);
  setErrorMsg(null);

  // 🔒 Impede envio se o link não foi validado
  if (!canSetPassword) {
    setErrorMsg('Link inválido ou expirado. Solicite um novo link.');
    return;
  }

  if (password.length < 8) {
    setErrorMsg('A senha deve ter pelo menos 8 caracteres.');
    return;
  }
    if (password !== confirm) {
      setErrorMsg('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        console.error(error);
        setErrorMsg('Não foi possível atualizar sua senha. Solicite um novo link.');
        return;
      }

      setMsg('Senha atualizada com sucesso. Você já pode entrar.');
      // dá 1s e volta pro login
      setTimeout(() => router.push('/login'), 800);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro inesperado. Tente novamente.');
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
              Definir nova senha
            </h1>
            <p className="text-sm text-slate-500">
              Crie uma senha nova para sua conta.
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

                {validating && (
          <div className="mb-4 bg-slate-50 text-slate-700 text-xs p-3 rounded-lg border border-slate-200">
            Validando link...
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nova senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="mínimo 8 caracteres"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Confirmar senha
            </label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="repita a senha"
            />
          </div>

                    <button
            type="submit"
            disabled={loading || validating || !canSetPassword}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-70 transition-colors"
          >
            {loading ? 'Salvando...' : 'Atualizar senha'}
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