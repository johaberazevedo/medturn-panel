'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { toast, Toaster } from 'sonner';

type AvailabilityPeriod = 'manha' | 'tarde' | 'noite';

interface HospitalOption {
  id: string;
  name: string;
}

function MedicoDisponibilidadeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('Hospital');
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]); // Lista de hospitais do médico
  const [userId, setUserId] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState<string>('');
  const [periods, setPeriods] = useState<AvailabilityPeriod[]>([]);
  const [dayShifts, setDayShifts] = useState<any[]>([]);

  // Função para carregar dados de um hospital específico
  const loadHospitalData = useCallback(async (hId: string, uId: string, date: string) => {
    const { data: avail } = await supabase
      .from('availability')
      .select('period')
      .eq('hospital_id', hId)
      .eq('user_id', uId)
      .eq('date', date);
    
    setPeriods((avail ?? []).map((r: any) => r.period as AvailabilityPeriod));

    const { data: shifts } = await supabase
      .from('shifts')
      .select('id, period')
      .eq('hospital_id', hId)
      .eq('doctor_user_id', uId)
      .eq('date', date);
    
    setDayShifts(shifts ?? []);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      // 1. Busca todos os hospitais que o médico tem vínculo
      const { data: memberships } = await supabase
        .from('hospital_users')
        .select('hospital_id, hospitals(name)')
        .eq('user_id', user.id);

      if (memberships && memberships.length > 0) {
        const formattedHospitals = memberships.map((m: any) => ({
          id: m.hospital_id,
          name: m.hospitals?.name || 'Hospital Sem Nome'
        }));
        setHospitals(formattedHospitals);

        // 2. Define o hospital inicial (LocalStorage ou o primeiro da lista)
        const storedHosp = window.localStorage.getItem(`activeHospitalId:${user.id}`);
        const initialHosp = formattedHospitals.find(h => h.id === storedHosp) || formattedHospitals[0];

        setHospitalId(initialHosp.id);
        setHospitalName(initialHosp.name);

        const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
        setDateStr(initialDate);

        await loadHospitalData(initialHosp.id, user.id, initialDate);
      }
      setLoading(false);
    }
    init();
  }, [router, searchParams, loadHospitalData]);

  // Listener para quando mudar o hospital ou a data
  useEffect(() => {
    if (hospitalId && userId && dateStr) {
      loadHospitalData(hospitalId, userId, dateStr);
    }
  }, [hospitalId, dateStr, userId, loadHospitalData]);

  const handleHospitalChange = (id: string) => {
    const selected = hospitals.find(h => h.id === id);
    if (selected && userId) {
      setHospitalId(selected.id);
      setHospitalName(selected.name);
      window.localStorage.setItem(`activeHospitalId:${userId}`, selected.id);
      toast.info(`Hospital alterado para ${selected.name}`);
    }
  };

  async function handleTogglePeriod(p: AvailabilityPeriod) {
    if (!hospitalId || !userId || !dateStr) return;
    
    const isRemoving = periods.includes(p);
    const newPeriods = isRemoving ? periods.filter(x => x !== p) : [...periods, p];
    
    setPeriods(newPeriods);
    
    if (isRemoving) {
      toast.info(`Disponibilidade de ${p} removida`, { duration: 2000 });
    } else {
      toast.success(`Disponibilidade de ${p} salva!`, { icon: '✅', duration: 2000 });
    }

    try {
      await supabase.from('availability').delete().eq('hospital_id', hospitalId).eq('user_id', userId).eq('date', dateStr);
      if (newPeriods.length > 0) {
        await supabase.from('availability').insert(newPeriods.map(period => ({ 
          hospital_id: hospitalId, 
          user_id: userId, 
          date: dateStr, 
          period 
        })));
      }
    } catch (error) {
      toast.error("Erro ao sincronizar com o servidor.");
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Carregando...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors />
      
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => router.push('/medico')} className="text-slate-400 hover:text-slate-600">◀ Voltar</button>
        <div className="text-center flex flex-col items-center">
          <h1 className="text-sm font-black uppercase text-slate-800 tracking-tighter">Disponibilidade</h1>
          
          {/* SELETOR DE HOSPITAL */}
          {hospitals.length > 1 ? (
            <select 
              value={hospitalId || ''} 
              onChange={(e) => handleHospitalChange(e.target.value)}
              className="text-[10px] text-emerald-600 font-bold bg-transparent border-none focus:ring-0 p-0 cursor-pointer uppercase"
            >
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          ) : (
            <p className="text-[10px] text-emerald-600 font-bold uppercase">{hospitalName}</p>
          )}
        </div>
        <div className="w-10" /> 
      </header>

      <main className="max-w-md mx-auto px-6 py-8 space-y-8">
        <section className="bg-white border rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-slate-800">Selecione o Dia</h2>
            <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} className="text-xs border-none font-bold text-emerald-600 focus:ring-0 cursor-pointer"/>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(['manha', 'tarde', 'noite'] as const).map(p => {
              const isActive = periods.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => handleTogglePeriod(p)}
                  className={`flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all duration-200 ${
                    isActive ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase">{p}</span>
                  <span className="text-lg mt-1">{p === 'manha' ? '☀️' : p === 'tarde' ? '🌤️' : '🌙'}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest ml-2">Meus Plantões no Dia</h2>
          {dayShifts.length === 0 ? (
            <div className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center">
              <p className="text-xs text-slate-400 font-medium">Nenhum plantão escalado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayShifts.map(s => (
                <div key={s.id} className="bg-white border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="text-sm font-bold text-slate-800 capitalize">{s.period}</div>
                  <button onClick={() => router.push(`/medico/troca?shiftId=${s.id}`)} className="text-[10px] font-black bg-slate-900 text-white px-4 py-2 rounded-xl">TROCAR</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function MedicoDisponibilidadePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Carregando...</div>}>
      <MedicoDisponibilidadeContent />
    </Suspense>
  );
}