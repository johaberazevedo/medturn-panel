'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type ShiftRow = {
  id: number;
  date: string;
  period: 'manha' | 'tarde' | 'noite' | '24h';
  doctor_user_id: string | null;
  is_chief: boolean;
  hospitals: { 
    name: string | null;
    is_checkin_enabled: boolean; 
  } | null;
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

function turnStartHour(period: ShiftRow['period']) {
  if (period === 'manha') return 7;
  if (period === 'tarde') return 13;
  if (period === 'noite') return 19;
  return 7;
}

// ✅ Lógica de tempo corrigida: Sem 1h de antecedência
function getTimingStatus(shift: ShiftRow) {
  const now = new Date();
  const startHour = turnStartHour(shift.period);
  const [y, m, d] = shift.date.split('-').map(Number);
  
  const startAt = new Date(y, m - 1, d, startHour, 0, 0);
  const deadline = new Date(startAt.getTime() + 2 * 60 * 60 * 1000); // 2h depois

  if (now < startAt) return { state: 'cedo', startAt }; // Bloqueado se for antes
  if (now <= deadline) return { state: 'na_janela', startAt };
  return { state: 'atrasado', startAt };
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

  const loadAllHospitalsData = useCallback(async (uId: string) => {
    const { data: shiftData, error: shiftErr } = await supabase
      .from('shifts')
      .select('id, date, period, doctor_user_id, is_chief, hospitals(name, is_checkin_enabled)')
      .eq('date', date)
      .eq('doctor_user_id', uId)
      .order('period', { ascending: true });

    if (shiftErr) {
      setErrorMsg(`Erro: ${shiftErr.message}`);
    } else if (shiftData) {
      setShifts(shiftData as unknown as ShiftRow[]);
      
      const sIds = shiftData.map(s => s.id);
      if (sIds.length > 0) {
        const { data: ckData } = await supabase.from('shift_checkins').select('*').in('shift_id', sIds).eq('doctor_user_id', uId);
        if (ckData) setCheckins(ckData as CheckinRow[]);
      }
    }
  }, [date]);

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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm font-medium">Sincronizando plantões...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Meus Plantões Hoje</h1>
          <p className="text-xs text-slate-500">{formatDateBR(date)}</p>
        </div>
        <button onClick={() => router.push('/medico')} className="text-xs border px-3 py-1.5 rounded-lg hover:bg-slate-50 transition">Voltar</button>
      </header>

      <main className="p-6 max-w-md mx-auto space-y-4">
        {errorMsg && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs border border-red-200">{errorMsg}</div>}

        {shifts.map((s) => {
          const c = checkinMap.get(s.id);
          const timing = getTimingStatus(s);
          const hospitalName = s.hospitals?.name ?? 'Hospital';
          const isEnabled = s.hospitals?.is_checkin_enabled;

          const statusVisual = c ? 'presente' : (timing.state === 'atrasado' ? 'ausente' : 'pendente');

          return (
            <div key={s.id} className="bg-white border rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusVisual === 'presente' ? 'bg-emerald-500' : statusVisual === 'pendente' ? 'bg-amber-500' : 'bg-red-500'}`} />
              
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">{hospitalName}</p>
                  <h2 className="text-sm font-bold text-slate-800">Turno {periodLabel(s.period)}</h2>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                {c ? (
                  <p className="flex items-center gap-1 text-emerald-600 font-medium">✓ Confirmado às {formatTimeBR(c.created_at)}</p>
                ) : (
                  <p>{isEnabled ? 'Aguardando registro de entrada...' : 'Unidade sem rastreio de presença.'}</p>
                )}
              </div>

              {!c && (
                <div className="mt-4 pt-3 border-t border-slate-50">
                  {!isEnabled ? (
                    <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-2 bg-slate-50 rounded-lg">Sua unidade não rastreia presença no plantão.</p>
                  ) : timing.state === 'cedo' ? (
                    /* ✅ Bloqueio se for antes do horário de início */
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Aguardando início do plantão às {turnStartHour(s.period)}:00h</p>
                    </div>
                  ) : timing.state === 'na_janela' ? (
                    <button
                      onClick={() => doCheckin(s.id)}
                      disabled={busyShiftId === s.id}
                      className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition disabled:opacity-50"
                    >
                      {busyShiftId === s.id ? 'REGISTRANDO...' : 'CONFIRMAR ENTRADA'}
                    </button>
                  ) : (
                    <p className="text-[10px] text-red-500 font-bold uppercase text-center py-2 bg-red-50 rounded-lg">Janela expirada (Ausente)</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}