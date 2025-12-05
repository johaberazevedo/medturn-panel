'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function MedicoHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Doutor(a)');

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Tenta pegar o nome do usuário
      const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.full_name) {
        setUserName(profile.full_name);
      }

      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Portal do Médico</h1>
          <p className="text-xs text-slate-500">Bem-vindo, {userName}</p>
        </div>
        <button 
          onClick={() => router.push('/perfil')}
          className="text-xs font-medium px-3 py-1.5 border rounded-lg hover:bg-slate-50 transition"
        >
          👤 Meu Perfil
        </button>
      </header>

      <main className="p-6 max-w-md mx-auto space-y-4">
        <MenuCard 
          title="Calendário" 
          desc="Visualize a escala mensal e seus plantões marcados."
          icon="📅"
          onClick={() => router.push('/medico/calendario')}
        />

        <MenuCard 
          title="Trocas e Disponibilidade" 
          desc="Informe os dias que pode trabalhar e solicite trocas."
          icon="✅"
          onClick={() => router.push('/medico/disponibilidade')}
        />

<MenuCard 
          title="Solicitações e Propostas" 
          desc="Veja solicitações recebidas e o status das suas." 
          icon="🤝" 
          onClick={() => router.push('/medico/propostas')}
        />

        <MenuCard 
          title="Histórico" 
          desc="Veja o registro de suas disponibilidades passadas."
          icon="📜"
          onClick={() => router.push('/medico/historico')}
        />
        
        <button 
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/login');
          }}
          className="w-full py-3 text-xs font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 mt-8"
        >
          Sair da conta
        </button>
      </main>
    </div>
  );
}

function MenuCard({ title, desc, icon, onClick }: { title: string, desc: string, icon: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 text-left hover:shadow-md transition-all active:scale-[0.98]"
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </button>
  );
}