'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type AvailabilityPeriod = 'manha' | 'tarde' | 'noite';
type AvailabilityRow = { date: string; period: AvailabilityPeriod; };

export default function HistoricoDisponibilidadePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<AvailabilityRow[]>([]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      
      // Busca histórico
      const { data } = await supabase
        .from('availability')
        .select('date, period')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(50);

      if (data) setList(data as AvailabilityRow[]);
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) return <div className="p-4 text-center text-xs">Carregando...</div>;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.push('/medico')} className="text-lg">🏠</button>
        <h1 className="text-sm font-bold">Histórico</h1>
      </header>
      <main className="p-4 max-w-md mx-auto">
        {list.length === 0 ? (
           <p className="text-xs text-slate-500 text-center mt-10">Nenhum registro encontrado.</p>
        ) : (
           <ul className="space-y-2">
             {list.map((item, i) => (
               <li key={i} className="bg-white p-3 rounded-lg border flex justify-between items-center text-xs">
                 <span className="font-medium">{item.date.split('-').reverse().join('/')}</span>
                 <span className="px-2 py-1 bg-slate-100 rounded-full capitalize">{item.period}</span>
               </li>
             ))}
           </ul>
        )}
      </main>
    </div>
  );
}