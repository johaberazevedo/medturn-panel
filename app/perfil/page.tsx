'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  
  // Estados do formulário de senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    async function getUser() {
      const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  setLoading(false);
  router.push('/login');
  return;
}

setUserEmail(user.email ?? '');

const { data: profile, error: profileError } = await supabase
  .from('users')
  .select('full_name')
  .eq('id', user.id)
  .maybeSingle();

if (profileError) {
  console.error('Erro ao carregar perfil:', profileError);
}

setUserName(profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? 'Usuário');
setLoading(false);
    }
    getUser();
  }, [router]);

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    setSaving(true);

    try {
      // Função nativa do Supabase para o usuário trocar a própria senha
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erro ao alterar senha: ' + error.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="rounded-[32px] border border-slate-100 bg-white px-6 py-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="rounded-b-[28px] bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-start px-6 py-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center">
            <img
              src="/medturn-logo-transparent.png"
              alt="MedTurn"
              className="h-20 w-20 object-contain"
            />
          </div>

          <div className="ml-5 flex flex-1 flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="pt-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#40C0A2]">
                MedTurn • Conta
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tighter text-slate-950">
                Meu Perfil
              </h1>

              <p className="mt-2 text-[11px] font-semibold text-slate-400">
                Gerencie seus dados de acesso.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button
                onClick={() => router.back()}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95"
              >
                Voltar
              </button>

              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-2xl bg-slate-950 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-white shadow-sm hover:bg-slate-800 active:scale-95"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 py-6 space-y-5">
        <section className="rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
            Dados da conta
          </p>

          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
            Informações pessoais
          </h2>

          <div className="mt-5 space-y-3">
            <div className="rounded-3xl bg-slate-50 px-4 py-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Nome
              </label>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {userName}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 px-4 py-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                E-mail
              </label>
              <p className="mt-1 text-sm font-bold text-slate-800 break-words">
                {userEmail}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
            Segurança
          </p>

          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
            Trocar senha
          </h2>

          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            A nova senha será aplicada diretamente à sua conta de acesso.
          </p>
          
          <form onSubmit={handlePasswordUpdate} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Nova senha
              </label>
<input
  type="password"
  value={newPassword}
  onChange={(e) => setNewPassword(e.target.value)}
  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#40C0A2]"
  placeholder="Mínimo 6 caracteres"
  minLength={6}
  required
/>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Confirmar nova senha
              </label>
<input
  type="password"
  value={confirmPassword}
  onChange={(e) => setConfirmPassword(e.target.value)}
  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#40C0A2]"
  placeholder="Digite novamente"
  minLength={6}
  required
/>
            </div>

            {message && (
              <div
                className={`rounded-2xl border px-4 py-3 text-xs font-semibold ${
                  message.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !newPassword || !confirmPassword}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-sm hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Atualizar senha'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}