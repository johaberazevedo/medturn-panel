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
    <div className="min-h-screen bg-slate-50 px-4 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] items-center justify-center py-8">
        <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[36px] border border-slate-100 bg-white shadow-sm lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="hidden bg-[#102322] p-8 lg:flex lg:flex-col lg:justify-between">
            <div>
              <Image
                src="/medturn-logo-transparent.png"
                alt="MedTurn"
                width={96}
                height={96}
                priority
                className="object-contain"
              />

              <div className="mt-8">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#40C0A2]">
                  MedTurn
                </p>

                <h1 className="mt-3 max-w-sm text-4xl font-black tracking-tighter text-white">
                  Gestão inteligente de plantões.
                </h1>

                <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
                  Escalas, trocas, comunicação e relatórios em um fluxo simples para coordenações médicas.
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs leading-relaxed text-slate-300">
                Acesse com seu e-mail cadastrado pela coordenação do hospital.
              </p>
            </div>
          </section>

          <section className="px-6 py-8 sm:px-8">
            <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
              <Image
                src="/medturn-logo-transparent.png"
                alt="MedTurn"
                width={88}
                height={88}
                priority
                className="object-contain lg:hidden"
              />

              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.28em] text-[#40C0A2] lg:mt-0">
                MedTurn
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tighter text-slate-950">
                Acesse sua conta
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Use suas credenciais para acessar sua área.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-500">
                  E-mail
                </label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#40C0A2] focus:bg-white"
                  placeholder="doutor@exemplo.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Senha
                </label>

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#40C0A2] focus:bg-white"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => router.push('/auth/forgot')}
                  className="text-xs font-bold text-slate-500 underline underline-offset-4 hover:text-slate-900"
                >
                  Esqueci minha senha
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-slate-950 py-3 text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="mt-8 space-y-3 text-center">
              <p className="text-xs text-slate-400">
                Ainda não tem conta? Fale com seu coordenador.
              </p>

              <Link
                href="/vitrine"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 underline underline-offset-4 hover:text-slate-950"
              >
                Conheça os recursos do MedTurn
                <span className="text-base leading-none">→</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}