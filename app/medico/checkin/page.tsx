'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Tipo atualizado para suportar múltiplos hospitais na mesma tela
type ShiftRow = {
  id: number;
  date: string;
  period: 'manha' | 'tarde' | 'noite' | '24h';
  doctor_user_id: string | null;
  is_chief: boolean;
  hospitals: { name: string | null } | null;
};

type CheckinRow = {
  shift_id: number;
  doctor_user_id: string;
  created_at: string;
  source: string;
  method: string;
  is_propagated: boolean;
};

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function periodLabel(p: ShiftRow['period']) {
  switch (p) {
    case 'manha': return 'Manhã';
    case 'tarde': return 'Tarde';
    case 'noite': return 'Noite';
    case '24h': return '24h';
  }
}

function formatDateBR(dateStr: string) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, (month ?? 1) - 1, day ?? 1);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function formatTimeBR(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function turnStartHour(period: ShiftRow['period']) {
  if (period === 'manha') return 7;
  if (period === 'tarde') return 13;
  if (period === 'noite') return 19;
  return 7;
}

function windowStatus(shift: ShiftRow, hasCheckin: boolean) {
  if (hasCheckin) return 'presente' as const;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), turnStartHour(shift.period), 0, 0);
  const deadline = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  if (now < start) return 'pendente' as const;
  if (now <= deadline) return 'pendente' as const;
  return 'ausente' as const;
}

export default function MedicoCheckinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [date] = useState<string>(todayISO());
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [busyShiftId, setBusyShiftId] = useState<number | null>(null);

  const checkinMap = useMemo(() => {
    const m = new Map<number, CheckinRow>();
    for (const c of checkins) {
      if (!m.has(c.shift_id)) m.set(c.shift_id, c);
    }
    return m;
  }, [checkins]);

  const reloadCheckins = useCallback(async (shiftIds: number[], uId: string) => {
    if (shiftIds.length === 0) return;
    const { data } = await supabase
      .from('shift_checkins')
      .select('*')
      .in('shift_id', shiftIds)
      .eq('doctor_user_id', uId)
      .order('created_at', { ascending: false });
    if (data) setCheckins(data as CheckinRow[]);
  }, []);

  const loadAllHospitalsData = useCallback(async (uId: string) => {
    const { data: shiftData, error: shiftErr } = await supabase
      .from('shifts')
      .select('id, date, period, doctor_user_id, is_chief, hospitals(name)')
      .eq('date', date)
      .eq('doctor_user_id', uId)
      .order('period', { ascending: true });

    if (shiftErr) {
      setErrorMsg(`Erro: ${shiftErr.message}`);
    } else if (shiftData) {
      setShifts(shiftData as unknown as ShiftRow[]);
      await reloadCheckins(shiftData.map(s => s.id), uId);
    }
  }, [date, reloadCheckins]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      await loadAllHospitalsData(user.id);
      setLoading(false);
    }
    init();
  }, [router, loadAllHospitalsData]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('universal-checkin')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'shift_checkins', filter: `doctor_user_id=eq.${userId}` }, 
        () => loadAllHospitalsData(userId)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, loadAllHospitalsData]);

  async function doCheckin(shiftId: number) {
    try {
      setBusyShiftId(shiftId);
      setErrorMsg(null);
      const { error } = await supabase.rpc('create_shift_checkin', {
        p_shift_id: shiftId,
        p_source: 'web',
        p_method: 'button',
      });
      if (error) {
        setErrorMsg(error.message);
      } else if (userId) {
        await loadAllHospitalsData(userId);
      }
    } finally {
      setBusyShiftId(null);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Carregando seus plantões...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Meus Plantões Hoje</h1>
          <p className="text-xs text-slate-500">{formatDateBR(date)} • Todos os Hospitais</p>
        </div>
        <button onClick={() => router.push('/medico')} className="text-xs border px-3 py-1.5 rounded-lg hover:bg-slate-50 transition">Voltar</button>
      </header>

      <main className="p-6 max-w-md mx-auto space-y-4">
        {errorMsg && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs border border-red-200">{errorMsg}</div>}

        {shifts.length === 0 ? (
          <div className="bg-white border rounded-2xl p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500">Nenhum turno escalado para hoje.</p>
          </div>
        ) : (
          shifts.map((s) => {
            const c = checkinMap.get(s.id);
            const status = windowStatus(s, !!c);
            const hospitalName = s.hospitals?.name ?? 'Hospital';

            return (
              <div key={s.id} className="bg-white border rounded-2xl p-4 shadow-sm relative overflow-hidden">
                {/* Linha lateral colorida baseada no status */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${status === 'presente' ? 'bg-emerald-500' : status === 'pendente' ? 'bg-amber-500' : 'bg-red-500'}`} />
                
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">{hospitalName}</p>
                    <h2 className="text-sm font-bold text-slate-800">Turno {periodLabel(s.period)} {s.is_chief && ' (Chefia)'}</h2>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium 
                    ${status === 'presente' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                      status === 'pendente' ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                      'bg-red-50 border-red-200 text-red-700'}`}>
                    {status.toUpperCase()}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  {c ? (
                    <p className="flex items-center gap-1 text-emerald-600">
                      <span>✓ Confirmado às {formatTimeBR(c.created_at)}</span>
                      {c.source === 'web_admin' && <span className="italic">(pelo coordenador)</span>}
                    </p>
                  ) : (
                    <p>Aguardando registro de entrada...</p>
                  )}
                </div>

                {/* NOVO BLOCO DE CONFIRMAÇÃO DE UNIDADE */}
                {!c && status === 'pendente' && (
                  <div className="mt-4 pt-3 border-t border-slate-50">
                    <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Confirmação de Unidade:</p>
                    <p className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2">
                      Você está prestes a registrar presença no <strong>{hospitalName}</strong>.
                    </p>
                    
                    <button
                      onClick={() => doCheckin(s.id)}
                      disabled={busyShiftId === s.id}
                      className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition disabled:opacity-50"
                    >
                      {busyShiftId === s.id ? 'REGISTRANDO...' : 'CONFIRMAR ENTRADA'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}