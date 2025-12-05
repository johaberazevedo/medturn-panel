'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
      // Buscamos na tabela de vínculo hospital_users
      const { data: membership, error: memberError } = await supabase
        .from('hospital_users')
        .select('role')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      // Se der erro ou não achar, assumimos que é um usuário novo ou médico sem vínculo ainda
      // Nesse caso, mandamos para o portal médico (ou uma tela de onboarding)
      if (memberError) {
        console.error('Erro ao buscar perfil:', memberError);
      }

      const role = membership?.role; // 'admin' | 'medico' | null

      // 3. Redirecionamento Inteligente
      if (role === 'admin') {
        router.push('/dashboard'); // Painel Admin
      } else {
        router.push('/medico'); // Portal do Médico
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Falha ao fazer login.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-sm w-full bg-white border rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">MedTurn</h1>
          <p className="text-sm text-slate-500">Gestão inteligente de escalas</p>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-70 transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Ainda não tem conta? Fale com seu coordenador.
          </p>
        </div>
      </div>
    </div>
  );
}