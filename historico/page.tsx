'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type LogRow = {
  id: number;
  created_at: string;
  action_type: string;
  shift: {
    date: string;
    period: 'manha' | 'tarde' | 'noite' | '24h';
  } | null; // Pode vir nulo se o plantão for deletado, por segurança
  admin: { full_name: string; email: string } | null;
  previous_doctor: { full_name: string } | null;
  new_doctor: { full_name: string } | null;
};

export default function HistoricoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogRow[]>([]);
  
  // Estados visuais
  const [hospitalName, setHospitalName] = useState('Hospital Geral'); // Nome padrão
  const [adminName, setAdminName] = useState('');

  // Formatações
  function formatDateTimeBR(dateStr: string) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  }

  function formatDateBR(dateStr: string) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  function periodLabel(p: string) {
    const map: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', '24h': '24h' };
    return map[p] || p;
  }

  // Busca os logs
  const loadLogs = useCallback(async (hospitalId?: string) => {
    try {
      let query = supabase
        .from('shift_logs')
        .select(`
          id, created_at, action_type,
          shift:shift_id ( date, period ),
          admin:admin_id ( full_name, email ),
          previous_doctor:previous_doctor_id ( full_name ),
          new_doctor:new_doctor_id ( full_name )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      // Só filtra se tivermos um ID de hospital válido
      if (hospitalId) {
        query = query.eq('hospital_id', hospitalId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Tratamento para garantir que não quebre se vier array
      const formatted = (data || []).map((item: any) => ({
        ...item,
        shift: Array.isArray(item.shift) ? item.shift[0] : item.shift,
        admin: Array.isArray(item.admin) ? item.admin[0] : item.admin,
        previous_doctor: Array.isArray(item.previous_doctor) ? item.previous_doctor[0] : item.previous_doctor,
        new_doctor: Array.isArray(item.new_doctor) ? item.new_doctor[0] : item.new_doctor,
      }));

      setLogs(formatted);
    } catch (e) {
      console.error('Erro ao buscar logs:', e);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // Tenta descobrir o hospital, mas não trava se falhar
      const { data: membership } = await supabase
        .from('hospital_users')
        .select('hospital_id, hospitals(name), users(full_name)')
        .eq('user_id', user.id)
        .maybeSingle();

      let targetHospitalId = undefined;

      if (membership) {
        const raw = membership as any;
        const hName = Array.isArray(raw.hospitals) ? raw.hospitals[0]?.name : raw.hospitals?.name;
        const uName = Array.isArray(raw.users) ? raw.users[0]?.full_name : raw.users?.full_name;
        
        if (hName) setHospitalName(hName);
        if (uName) setAdminName(uName);
        targetHospitalId = raw.hospital_id;
      }

      await loadLogs(targetHospitalId);
      setLoading(false);
    }
    init();
  }, [router, loadLogs]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase text-slate-500 tracking-wider">Gestão de Escalas</p>
            <h1 className="text-lg font-bold text-slate-800">Histórico de Alterações</h1>
            <p className="text-xs text-slate-500">{hospitalName} {adminName && `• ${adminName}`}</p>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-xs font-medium px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            Voltar
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
             <div className="p-12 text-center text-slate-500 text-sm animate-pulse">Carregando histórico...</div>
          ) : logs.length === 0 ? (
             <div className="p-12 text-center flex flex-col items-center gap-2">
               <span className="text-slate-400 text-2xl">📝</span>
               <span className="text-slate-500 text-sm">Nenhuma alteração registrada ainda.</span>
               <span className="text-slate-400 text-xs">Tente trocar um plantão no painel para testar.</span>
             </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold tracking-wide">
                <tr>
                  <th className="px-6 py-3">Quando</th>
                  <th className="px-6 py-3">Responsável</th>
                  <th className="px-6 py-3">Plantão</th>
                  <th className="px-6 py-3">O que mudou</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                      {formatDateTimeBR(log.created_at)}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                            {log.admin?.full_name?.charAt(0) || 'S'}
                         </div>
                         <div>
                           <div className="font-medium text-slate-700 text-xs">
                             {log.admin?.full_name || 'Sistema'}
                           </div>
                         </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {log.shift ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-slate-800 text-xs">
                            {formatDateBR(log.shift.date)}
                          </span>
                          <span className={`text-[10px] w-fit px-2 py-0.5 rounded-full font-medium ${
                            log.shift.period === 'manha' ? 'bg-orange-50 text-orange-700' :
                            log.shift.period === 'tarde' ? 'bg-blue-50 text-blue-700' :
                            'bg-purple-50 text-purple-700'
                          }`}>
                            {periodLabel(log.shift.period)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-red-400 italic">Plantão deletado</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100 group-hover:bg-white group-hover:border-slate-200 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Sai:</span>
                          <span className={`${log.previous_doctor?.full_name ? "text-slate-600 font-medium" : "text-slate-400 italic"}`}>
                            {log.previous_doctor?.full_name || 'Vago'}
                          </span>
                        </div>
                        <div className="w-full h-px bg-slate-100"></div>
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-500 font-bold">Entra:</span>
                          <span className="font-bold text-slate-800">
                            {log.new_doctor?.full_name || 'Vago'}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}