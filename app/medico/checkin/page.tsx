'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type ShiftRow = {
  id: number;
  date: string; // YYYY-MM-DD
  period: 'manha' | 'tarde' | 'noite' | '24h';
  doctor_user_id: string | null;
  is_chief: boolean;
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
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTimeBR(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Janela de check-in (fixa por enquanto):
 * manha: 07:00, tarde: 13:00, noite: 19:00, 24h: 07:00
 * Regra: pendente até +2h do início. Depois disso vira ausente.
 */
function turnStartHour(period: ShiftRow['period']) {
  if (period === 'manha') return 7;
  if (period === 'tarde') return 13;
  if (period === 'noite') return 19;
  return 7; // 24h
}

function windowStatus(shift: ShiftRow, hasCheckin: boolean) {
  if (hasCheckin) return 'presente' as const;

  const today = todayISO();
  if (shift.date !== today) return 'ausente' as const;

  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    turnStartHour(shift.period),
    0,
    0,
    0
  );

  const deadline = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  if (now < start) return 'pendente' as const;     // ainda nem começou
  if (now <= deadline) return 'pendente' as const; // dentro da janela
  return 'ausente' as const;                       // passou 2h
}

export default function MedicoCheckinPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('Hospital');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [date] = useState<string>(todayISO());
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [busyShiftId, setBusyShiftId] = useState<number | null>(null);

  const checkinMap = useMemo(() => {
    // checkins já vem order by created_at desc -> primeiro é o mais recente por shift
    const m = new Map<number, CheckinRow>();
    for (const c of checkins) {
      if (!m.has(c.shift_id)) m.set(c.shift_id, c);
    }
    return m;
  }, [checkins]);

  async function reloadCheckins(shiftIds: number[], userId: string) {
    if (shiftIds.length === 0) {
      setCheckins([]);
      return;
    }

    const { data: checkinData, error: checkinErr } = await supabase
      .from('shift_checkins')
      .select('shift_id, doctor_user_id, created_at, source, method, is_propagated')
      .in('shift_id', shiftIds)
      .eq('doctor_user_id', userId)
      .order('created_at', { ascending: false });

    if (checkinErr) {
      setErrorMsg(`Erro ao recarregar check-ins: ${checkinErr.message}`);
      return;
    }

    setCheckins((checkinData ?? []) as CheckinRow[]);
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      setErrorMsg(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const storedHospitalId =
  typeof window !== 'undefined'
    ? window.localStorage.getItem(`activeHospitalId:${user.id}`)
    : null;

      if (!storedHospitalId) {
  router.push('/selecionar-hospital?redirect=/medico/checkin');
  return;
}

      const { data: hosp, error: hospError } = await supabase
        .from('hospitals')
        .select('id, name')
        .eq('id', storedHospitalId)
        .maybeSingle();

      if (hospError || !hosp) {
        setErrorMsg('Não foi possível identificar o hospital selecionado.');
        setLoading(false);
        return;
      }

      setHospitalId(hosp.id);
      setHospitalName(hosp.name ?? 'Hospital');

      // 1) shifts de hoje do médico logado
      const { data: shiftData, error: shiftErr } = await supabase
        .from('shifts')
        .select('id, date, period, doctor_user_id, is_chief')
        .eq('hospital_id', hosp.id)
        .eq('date', date)
        .eq('doctor_user_id', user.id)
        .order('period', { ascending: true });

      if (shiftErr) {
        setErrorMsg(`Erro ao carregar seus turnos: ${shiftErr.message}`);
        setShifts([]);
        setCheckins([]);
        setLoading(false);
        return;
      }

      const myShifts = (shiftData ?? []) as ShiftRow[];
      setShifts(myShifts);

      await reloadCheckins(myShifts.map(s => s.id), user.id);

      setLoading(false);
    }

    init();
  }, [router, date]);

  async function doCheckin(shift: ShiftRow) {
    try {
      setBusyShiftId(shift.id);
      setErrorMsg(null);

      // ✅ RPC correto (confirmado no seu banco)
      const { error: rpcErr } = await supabase.rpc('create_shift_checkin', {
        p_shift_id: shift.id,
        p_source: 'web',
        p_method: 'button',
      });

      if (rpcErr) {
        setErrorMsg(`Erro ao fazer check-in: ${rpcErr.message}`);
        return;
      }

      // Recarrega check-ins (inclui o propagado se o médico tiver turno contíguo atribuído)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await reloadCheckins(shifts.map(s => s.id), user.id);
    } finally {
      setBusyShiftId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
        Carregando check-in...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Check-in</h1>
          <p className="text-xs text-slate-500">
            {hospitalName} • {formatDateBR(date)}
          </p>
        </div>
        <button
          onClick={() => router.push('/medico')}
          className="text-xs font-medium px-3 py-1.5 border rounded-lg hover:bg-slate-50 transition"
        >
          Voltar
        </button>
      </header>

      <main className="p-6 max-w-md mx-auto space-y-3">
        {errorMsg && (
          <div className="bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}

        {shifts.length === 0 ? (
          <div className="bg-white border rounded-2xl p-4 text-xs text-slate-600">
            Você não tem turno atribuído para hoje.
          </div>
        ) : (
          <div className="space-y-3">
            {shifts.map((s) => {
              const c = checkinMap.get(s.id) ?? null;
              const status = windowStatus(s, !!c);

              const badge =
                status === 'presente'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : status === 'pendente'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-red-50 text-red-700 border-red-200';

              const label =
                status === 'presente' ? 'Presente'
                : status === 'pendente' ? 'Pendente'
                : 'Ausente';

              const canCheckin = status === 'pendente' && !c;

              return (
                <div key={s.id} className="bg-white border rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {periodLabel(s.period)}
                        {s.is_chief ? ' • CH' : ''}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {c
                          ? `Check-in: ${formatTimeBR(c.created_at)} ${c.is_propagated ? '(propagado)' : ''}`
                          : 'Sem check-in ainda'}
                      </p>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full border text-[10px] ${badge}`}>
                      {label}
                    </span>
                  </div>

                  <button
                    onClick={() => doCheckin(s)}
                    disabled={!canCheckin || busyShiftId === s.id}
                    className="mt-3 w-full py-2 text-xs font-medium rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {busyShiftId === s.id ? 'Confirmando...' : 'Fazer check-in'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}