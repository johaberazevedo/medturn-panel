'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Autenticação Padrão
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao obter usuário.');

      // 2. Descobrir o papel (Role) do usuário
      const { data: memberships, error: memberError } = await supabase
        .from('hospital_users')
        .select('role')
        .eq('user_id', authData.user.id);

      if (memberError) {
        console.error('Erro ao buscar vínculos:', memberError);
      }

      // 🔐 REGRA FINAL
      const isAdmin = memberships?.some(m => m.role === 'admin');

      if (isAdmin) {
        router.push('/dashboard');
      } else {
        router.push('/medico');
      }

    } catch (err: any) {
      const msg = err?.message ?? '';

      // 🔇 erro esperado: não precisa poluir o console
      const isExpectedAuthError =
        msg.includes('Invalid login credentials') ||
        msg.includes('Email not confirmed');

      if (!isExpectedAuthError) {
        console.error(err);
      }

      if (msg.includes('Invalid login credentials')) {
        setErrorMsg('E-mail ou senha incorretos.');
      } else if (msg.includes('Email not confirmed')) {
        setErrorMsg('Seu e-mail ainda não foi confirmado.');
      } else {
        setErrorMsg('Não foi possível entrar. Tente novamente.');
      }

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
              width={72}
              height={72}
              priority
              className="rounded-xl shadow-sm"
            />
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              MedTurn
            </h1>
            <p className="text-sm text-slate-500">
              Gestão inteligente de plantões
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => router.push('/auth/forgot')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-4"
            >
              Esqueci minha senha
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-70 transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-xs text-slate-400">
            Ainda não tem conta? Fale com seu coordenador.
          </p>

          <Link
            href="/vitrine"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-4"
          >
            Conheça os recursos do MedTurn
            <span className="text-base leading-none">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}