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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserEmail(user.email ?? '');
      setUserName(user.user_metadata?.full_name ?? 'Usuário');
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
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-sm text-slate-600">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header Simples */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-800">
          ← Voltar
        </button>
        <h1 className="font-semibold text-sm">Meu Perfil</h1>
        <div className="w-10"></div> {/* Espaçador para centralizar o título */}
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-6 space-y-6">
        
        {/* Cartão de Dados Pessoais */}
        <section className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Dados da Conta</h2>
          <div>
            <label className="text-xs text-slate-500 block">Nome</label>
            <p className="text-sm font-medium text-slate-800">{userName}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 block">E-mail</label>
            <p className="text-sm font-medium text-slate-800">{userEmail}</p>
          </div>
        </section>

        {/* Formulário de Troca de Senha */}
        <section className="bg-white border rounded-xl p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">Trocar Senha</h2>
          
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-600">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-200 outline-none"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-slate-600">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-200 outline-none"
                placeholder="Digite novamente"
              />
            </div>

            {message && (
              <div className={`text-xs px-3 py-2 rounded-lg border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !newPassword}
              className="w-full bg-slate-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Salvando...' : 'Atualizar Senha'}
            </button>
          </form>
        </section>

      </main>
    </div>
  );
}