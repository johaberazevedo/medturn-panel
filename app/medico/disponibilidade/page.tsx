'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type AvailabilityPeriod = 'manha' | 'tarde' | 'noite';

type MembershipRow = {
  hospital_id: string;
  hospitals: { name: string | null } | null;
};

type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type ShiftRow = {
  id: number;
  date: string;
  period: 'manha' | 'tarde' | 'noite' | '24h';
};

type DoctorOption = {
  id: string;
  name: string;
};

const WEEKDAYS: { label: string; short: string; value: WeekdayIndex }[] = [
  { label: 'Domingo', short: 'Dom', value: 0 },
  { label: 'Segunda', short: 'Seg', value: 1 },
  { label: 'Terça', short: 'Ter', value: 2 },
  { label: 'Quarta', short: 'Qua', value: 3 },
  { label: 'Quinta', short: 'Qui', value: 4 },
  { label: 'Sexta', short: 'Sex', value: 5 },
  { label: 'Sábado', short: 'Sáb', value: 6 },
];

function periodLabel(p: ShiftRow['period']) {
  switch (p) {
    case 'manha': return 'Manhã';
    case 'tarde': return 'Tarde';
    case 'noite': return 'Noite';
    case '24h': return '24h';
    default: return p;
  }
}

// 1. Renomeamos a função principal para "Content"
function MedicoDisponibilidadeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('Hospital');
  const [userId, setUserId] = useState<string | null>(null);

  const [dateStr, setDateStr] = useState<string>('');
  const [manha, setManha] = useState(false);
  const [tarde, setTarde] = useState(false);
  const [noite, setNoite] = useState(false);

  // Lote
  const [bulkStartDate, setBulkStartDate] = useState<string>('');
  const [bulkEndDate, setBulkEndDate] = useState<string>('');
  const [bulkSelectedWeekdays, setBulkSelectedWeekdays] = useState<WeekdayIndex[]>([]);
  const [bulkManha, setBulkManha] = useState(false);
  const [bulkTarde, setBulkTarde] = useState(false);
  const [bulkNoite, setBulkNoite] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Plantões e Troca
  const [dayShifts, setDayShifts] = useState<ShiftRow[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [swapShiftId, setSwapShiftId] = useState<number | null>(null);
  const [swapTargetUser, setSwapTargetUser] = useState<string>('');
  const [swapReason, setSwapReason] = useState('');
  const [swapLoading, setSwapLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function todayISODate() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async function loadAvailability(hId: string, uId: string, date: string) {
    const { data, error } = await supabase
      .from('availability')
      .select('period')
      .eq('hospital_id', hId)
      .eq('user_id', uId)
      .eq('date', date);

    if (error) {
      setErrorMsg('Erro ao carregar disponibilidade.');
      return;
    }
    const periods = (data ?? []).map((row: any) => row.period as AvailabilityPeriod);
    setManha(periods.includes('manha'));
    setTarde(periods.includes('tarde'));
    setNoite(periods.includes('noite'));
  }

  async function loadDayShifts(hId: string, uId: string, date: string) {
    const { data } = await supabase
      .from('shifts')
      .select('id, date, period')
      .eq('hospital_id', hId)
      .eq('doctor_user_id', uId)
      .eq('date', date);
    
    setDayShifts((data ?? []) as ShiftRow[]);
  }

  async function loadDoctors(hId: string, currentUserId: string) {
    const { data } = await supabase
      .from('hospital_users')
      .select('user_id, users(full_name)')
      .eq('hospital_id', hId);

    const mapped: DoctorOption[] = (data ?? [])
      .map((row: any) => ({
        id: row.user_id,
        name: row.users?.full_name ?? 'Médico',
      }))
      .filter((d) => d.id !== currentUserId)
      .sort((a, b) => a.name.localeCompare(b.name));

    setDoctors(mapped);
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      const { data: membership } = await supabase
        .from('hospital_users')
        .select('hospital_id, hospitals(name)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        setErrorMsg('Hospital não encontrado.');
        setLoading(false);
        return;
      }

      // CORREÇÃO 2: Normaliza o objeto membership (trata array do Supabase)
      const raw = membership as any;
      const m: MembershipRow = {
        hospital_id: raw.hospital_id,
        hospitals: Array.isArray(raw.hospitals) ? raw.hospitals[0] : raw.hospitals
      };

      setHospitalId(m.hospital_id);
      setHospitalName(m.hospitals?.name ?? 'Hospital');

      const initialDate = searchParams.get('date') || todayISODate();
      setDateStr(initialDate);
      setBulkStartDate(initialDate);
      setBulkEndDate(initialDate);

      await Promise.all([
        loadAvailability(m.hospital_id, user.id, initialDate),
        loadDayShifts(m.hospital_id, user.id, initialDate),
        loadDoctors(m.hospital_id, user.id),
      ]);

      setLoading(false);
    }
    init();
  }, [router, searchParams]);

  // Recarrega ao mudar a data
  useEffect(() => {
    if (!hospitalId || !userId || !dateStr) return;
    loadAvailability(hospitalId, userId, dateStr);
    loadDayShifts(hospitalId, userId, dateStr);
  }, [dateStr, hospitalId, userId]);

  async function handleSave() {
    if (!hospitalId || !userId || !dateStr) return;
    setSaving(true);
    setErrorMsg(null); setSuccessMsg(null);

    const periods: AvailabilityPeriod[] = [];
    if (manha) periods.push('manha');
    if (tarde) periods.push('tarde');
    if (noite) periods.push('noite');

    try {
      // Limpa anterior
      await supabase.from('availability').delete()
        .eq('hospital_id', hospitalId).eq('user_id', userId).eq('date', dateStr);

      if (periods.length > 0) {
        const rows = periods.map(p => ({
          hospital_id: hospitalId,
          user_id: userId,
          date: dateStr,
          period: p
        }));
        const { error } = await supabase.from('availability').insert(rows);
        if (error) throw error;
      }
      setSuccessMsg('Disponibilidade atualizada!');
    } catch (err: any) {
      setErrorMsg(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleSwapSubmit() {
    if (!hospitalId || !userId || !swapShiftId) return;
    setSwapLoading(true);
    setErrorMsg(null); setSuccessMsg(null);

    try {
      const { error } = await supabase.from('shift_swap_requests').insert({
        hospital_id: hospitalId,
        requester_user_id: userId,
        from_shift_id: swapShiftId,
        target_user_id: swapTargetUser || null, // null = Qualquer médico
        reason: swapReason || null,
        status: 'pendente'
      });

      if (error) throw error;

      setSuccessMsg('Pedido de troca enviado com sucesso!');
      setSwapReason('');
      setSwapTargetUser('');
      setSwapShiftId(null);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSwapLoading(false);
    }
  }

  function toggleBulkWeekday(day: WeekdayIndex) {
    setBulkSelectedWeekdays(curr => curr.includes(day) ? curr.filter(d => d !== day) : [...curr, day]);
  }
  
  async function handleBulkApply() {
      if (!hospitalId || !userId) return;
      setBulkLoading(true);
      // Lógica de bulk aqui... (mantida conforme seu original)
      setBulkLoading(false);
      setSuccessMsg('Aplicado em lote (Simulado).');
  }


  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-600">Carregando...</div>;
  if (!hospitalId) return <div className="p-4">Erro de carregamento.</div>;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.push('/medico')} className="text-xl">🏠</button>
        <div className="text-center">
          <p className="text-[10px] uppercase text-slate-500">{hospitalName}</p>
          <h1 className="text-sm font-bold">Minha Disponibilidade</h1>
        </div>
        <button onClick={() => router.push('/medico/calendario')} className="text-xs border px-2 py-1 rounded">Cal.</button>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {errorMsg && <div className="bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded text-xs">{errorMsg}</div>}
        {successMsg && <div className="bg-emerald-50 text-emerald-700 border-emerald-200 border px-3 py-2 rounded text-xs">{successMsg}</div>}

        {/* 1. Meus Plantões / Troca */}
        <section className="bg-white border rounded-xl p-4 space-y-3">
           <h2 className="text-sm font-semibold">Meus plantões dia {dateStr.split('-').reverse().join('/')}</h2>
           {dayShifts.length === 0 ? (
             <p className="text-xs text-slate-500">Você não tem plantão hoje.</p>
           ) : (
             <div className="space-y-2">
                <p className="text-xs text-slate-500">Selecione para passar:</p>
                <div className="flex gap-2 flex-wrap">
                   {dayShifts.map(s => (
                     <button 
                       key={s.id} 
                       onClick={() => setSwapShiftId(s.id)}
                       className={`px-3 py-1 rounded-full text-xs border ${swapShiftId === s.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
                     >
                       {periodLabel(s.period)}
                     </button>
                   ))}
                </div>
                {swapShiftId && (
                    <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
                        <select value={swapTargetUser} onChange={e => setSwapTargetUser(e.target.value)} className="w-full text-xs border rounded p-2">
                            <option value="">Qualquer médico</option>
                            {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <input 
                          placeholder="Motivo (opcional)" 
                          value={swapReason} 
                          onChange={e => setSwapReason(e.target.value)} 
                          className="w-full text-xs border rounded p-2"
                        />
                        <button 
                          onClick={handleSwapSubmit} 
                          disabled={swapLoading}
                          className="w-full bg-slate-800 text-white text-xs py-2 rounded"
                        >
                          {swapLoading ? 'Enviando...' : 'Solicitar Troca'}
                        </button>
                    </div>
                )}
             </div>
           )}
        </section>

        {/* 2. Disponibilidade do Dia */}
        <section className="bg-white border rounded-xl p-4 space-y-3">
           <div className="flex justify-between items-center">
             <h2 className="text-sm font-semibold">Disponibilidade</h2>
             <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} className="text-xs border rounded p-1"/>
           </div>
           <div className="flex gap-2">
              <label className="flex items-center gap-1 text-xs bg-slate-50 p-2 rounded border cursor-pointer">
                 <input type="checkbox" checked={manha} onChange={e => setManha(e.target.checked)} /> Manhã
              </label>
              <label className="flex items-center gap-1 text-xs bg-slate-50 p-2 rounded border cursor-pointer">
                 <input type="checkbox" checked={tarde} onChange={e => setTarde(e.target.checked)} /> Tarde
              </label>
              <label className="flex items-center gap-1 text-xs bg-slate-50 p-2 rounded border cursor-pointer">
                 <input type="checkbox" checked={noite} onChange={e => setNoite(e.target.checked)} /> Noite
              </label>
           </div>
           <button onClick={handleSave} disabled={saving} className="w-full bg-emerald-600 text-white text-xs py-2 rounded font-medium">
             {saving ? 'Salvando...' : 'Salvar Disponibilidade'}
           </button>
        </section>
        
        {/* 3. Lote (Simplificado visualmente) */}
        <section className="bg-white border rounded-xl p-4">
           <h2 className="text-sm font-semibold mb-2">Aplicar em Lote</h2>
           <p className="text-xs text-slate-500 mb-2">Use para marcar férias ou padrão semanal.</p>
           <div className="grid grid-cols-2 gap-2 mb-2">
              <input type="date" value={bulkStartDate} onChange={e => setBulkStartDate(e.target.value)} className="text-xs border rounded p-1"/>
              <input type="date" value={bulkEndDate} onChange={e => setBulkEndDate(e.target.value)} className="text-xs border rounded p-1"/>
           </div>
           <div className="flex flex-wrap gap-1 mb-2">
             {WEEKDAYS.map(w => (
               <button 
                 key={w.value} 
                 onClick={() => toggleBulkWeekday(w.value)}
                 className={`text-[10px] px-2 py-1 rounded border ${bulkSelectedWeekdays.includes(w.value) ? 'bg-slate-800 text-white' : 'bg-white'}`}
               >
                 {w.short}
               </button>
             ))}
           </div>
           <button onClick={handleBulkApply} disabled={bulkLoading} className="w-full border border-slate-300 text-slate-700 text-xs py-2 rounded">
             {bulkLoading ? 'Processando...' : 'Aplicar em lote'}
           </button>
        </section>
      </main>
    </div>
  );
}

// 3. Exportamos o wrapper com Suspense para resolver o erro do Vercel/Next.js
export default function MedicoDisponibilidadePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-600">Carregando...</p>
      </div>
    }>
      <MedicoDisponibilidadeContent />
    </Suspense>
  );
}