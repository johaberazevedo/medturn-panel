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
  users: { full_name: string | null; email?: string | null } | null;
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

function formatDateBR(dateStr: string) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, (month ?? 1) - 1, day ?? 1);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTimeBR(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function periodLabel(p: ShiftRow['period']) {
  switch (p) {
    case 'manha': return 'Manhã';
    case 'tarde': return 'Tarde';
    case 'noite': return 'Noite';
    case '24h': return '24h';
  }
}

const PERIOD_ORDER: ShiftRow['period'][] = ['manha', 'tarde', 'noite', '24h'];

// =======================
// ✅ STATUS: Presente / Pendente / Ausente (janela de 2h)
// =======================
type PresenceState = 'presente' | 'pendente' | 'ausente';

function startHourForPeriod(p: ShiftRow['period']) {
  if (p === 'manha') return 7;
  if (p === 'tarde') return 13;
  if (p === 'noite') return 19;
  return 7; // 24h começa 07:00 (ajustável)
}

function makeLocalDateTime(dateStr: string, hour: number, minute = 0) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hour, minute, 0, 0);
}

function computePresence(args: {
  date: string;
  period: ShiftRow['period'];
  hasCheckin: boolean;
  now?: Date;
}): { state: PresenceState; startAt: Date; deadline: Date } {
  const now = args.now ?? new Date();

  const startAt = makeLocalDateTime(args.date, startHourForPeriod(args.period));
  const deadline = new Date(startAt.getTime() + 2 * 60 * 60 * 1000);

  if (args.hasCheckin) return { state: 'presente', startAt, deadline };
  if (now <= deadline) return { state: 'pendente', startAt, deadline };
  return { state: 'ausente', startAt, deadline };
}

function badgeForState(state: PresenceState) {
  if (state === 'presente') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (state === 'pendente') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

function labelForState(state: PresenceState) {
  if (state === 'presente') return 'Presente';
  if (state === 'pendente') return 'Pendente';
  return 'Ausente';
}

function formatHHMM(d: Date) {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function CheckinPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('Hospital');
  const [date, setDate] = useState<string>(todayISO());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);

  const load = useCallback(async (hId: string, dayISO: string) => {
    setErrorMsg(null);

    const { data: shiftData, error: shiftErr } = await supabase
      .from('shifts')
      .select('id, date, period, doctor_user_id, is_chief, users(full_name, email)')
      .eq('hospital_id', hId)
      .eq('date', dayISO)
      .order('period', { ascending: true });

    if (shiftErr) {
      setErrorMsg(`Erro ao carregar shifts: ${shiftErr.message}`);
      setShifts([]);
      setCheckins([]);
      return;
    }

    const formattedShifts = (shiftData ?? []).map((s: any) => ({
      ...s,
      users: Array.isArray(s.users) ? s.users[0] : s.users,
    })) as ShiftRow[];

    setShifts(formattedShifts);

    const shiftIds = formattedShifts.map(s => s.id);
    if (shiftIds.length === 0) {
      setCheckins([]);
      return;
    }

    const { data: checkinData, error: checkinErr } = await supabase
      .from('shift_checkins')
      .select('shift_id, doctor_user_id, created_at, source, method, is_propagated')
      .in('shift_id', shiftIds)
      .order('created_at', { ascending: false });

    if (checkinErr) {
      setErrorMsg(`Erro ao carregar check-ins: ${checkinErr.message}`);
      setCheckins([]);
      return;
    }

    setCheckins((checkinData ?? []) as CheckinRow[]);
  }, []);

  // --- PATCH 1: Lógica de Gravação ---
  async function handleManualCheckin(shiftId: number, doctorId: string) {
  // 1. Checagem local rápida: se já estiver presente no Map, nem tenta
  const key = `${shiftId}:${doctorId}`;
  if (checkinMap.has(key)) {
    alert("Este médico já possui check-in para este turno.");
    return;
  }

  const confirmed = window.confirm("Deseja realizar o check-in manual para este médico?");
  if (!confirmed) return;

  setErrorMsg(null);
  const { error } = await supabase
    .from('shift_checkins')
    .insert({
      shift_id: shiftId,
      doctor_user_id: doctorId,
      source: 'web_admin',
      method: 'manual'
    });

  if (error) {
    // Se o erro for de duplicidade, a gente trata com carinho em vez de assustar o usuário
    if (error.code === '23505') { 
      alert("O check-in já foi realizado por outro meio (ou clique duplo).");
      load(hospitalId!, date); // Recarrega para garantir que a tela esteja certa
    } else {
      setErrorMsg("Erro ao realizar check-in manual: " + error.message);
    }
  }
}

  useEffect(() => {
    async function init() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const storedHospitalId =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('activeHospitalId')
          : null;

      if (!storedHospitalId) {
        router.push('/selecionar-hospital');
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

      await load(hosp.id, date);
      setLoading(false);
    }
    init();
  }, [router, date, load]);

  useEffect(() => {
    if (!hospitalId) return;

    const channel = supabase
      .channel('checkin-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_checkins' }, () => {
        load(hospitalId, date);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [hospitalId, date, load]);

  const checkinMap = useMemo(() => {
    const m = new Map<string, CheckinRow>();
    for (const c of checkins) {
      const key = `${c.shift_id}:${c.doctor_user_id}`;
      if (!m.has(key)) m.set(key, c);
    }
    return m;
  }, [checkins]);

  const grouped = useMemo(() => {
    const rows = shifts
      .filter(s => !!s.doctor_user_id)
      .map(s => {
        const key = `${s.id}:${s.doctor_user_id}`;
        const c = checkinMap.get(key) ?? null;

        const presence = computePresence({
          date: s.date,
          period: s.period,
          hasCheckin: !!c,
        });

        return {
          shift: s,
          checkin: c,
          state: presence.state,
          deadline: presence.deadline,
          doctorName: s.users?.full_name ?? s.users?.email ?? 'Sem nome',
        };
      });

    const byPeriod: Record<string, typeof rows> = { manha: [], tarde: [], noite: [], '24h': [] };
    rows.forEach(r => byPeriod[r.shift.period].push(r));

    for (const p of Object.keys(byPeriod)) {
      byPeriod[p].sort((a, b) => {
        if (a.shift.is_chief && !b.shift.is_chief) return -1;
        if (!a.shift.is_chief && b.shift.is_chief) return 1;
        return a.doctorName.localeCompare(b.doctorName, 'pt-BR', { sensitivity: 'base' });
      });
    }

    return byPeriod as Record<ShiftRow['period'], typeof rows>;
  }, [shifts, checkinMap]);

  function summary(period: ShiftRow['period']) {
    const list = grouped[period] ?? [];
    const total = list.length;
    const present = list.filter(x => x.state === 'presente').length;
    return { total, present };
  }

  if (loading && !hospitalId) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase text-slate-500">Check-in • {hospitalName}</p>
            <h1 className="text-xl font-semibold">Presença por turno</h1>
            <p className="text-[11px] text-slate-500">Data: {formatDateBR(date)}</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs border rounded-lg px-2 py-1.5 bg-white"
            />
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Voltar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {errorMsg && (
          <div className="bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}

        {PERIOD_ORDER.map((p) => {
          const { total, present } = summary(p);
          const list = grouped[p] ?? [];

          if (total === 0) return null;

          return (
            <section key={p} className="bg-white border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">{periodLabel(p)}</h2>
                <span className="text-[11px] text-slate-600">
                  Presentes: <strong>{present}/{total}</strong>
                </span>
              </div>

              <div className="overflow-auto">
                <table className="w-full text-xs">
                  <thead className="text-slate-500">
                    <tr className="text-left">
                      <th className="py-2 pr-2">Médico</th>
                      <th className="py-2 pr-2">Status</th>
                      <th className="py-2 pr-2">Hora</th>
                      <th className="py-2 pr-2">Origem</th>
                      {/* --- PATCH 2: Cabeçalho da Tabela --- */}
                      <th className="py-2 pr-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(({ shift, checkin, state, deadline, doctorName }) => (
                      <tr key={`${shift.id}-${shift.doctor_user_id}`} className="border-t">
                        <td className="py-2 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800">{doctorName}</span>
                            {shift.is_chief && (
                              <span className="text-[10px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded">
                                CH
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2 pr-2">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] ${badgeForState(state)}`}>
                            {labelForState(state)}
                            {state === 'pendente' ? (
                              <span className="ml-1 text-[10px] opacity-70">
                                (até {formatHHMM(deadline)})
                              </span>
                            ) : null}
                            {state === 'presente' && checkin?.is_propagated ? (
                              <span className="ml-1 text-[10px] opacity-70">
                                (propagado)
                              </span>
                            ) : null}
                          </span>
                        </td>

                        <td className="py-2 pr-2 text-slate-700">
                          {checkin ? formatTimeBR(checkin.created_at) : '—'}
                        </td>

                        <td className="py-2 pr-2 text-slate-600">
                          {checkin ? `${checkin.source}/${checkin.method}` : '—'}
                        </td>

                        {/* --- PATCH 3: Botão de Ação --- */}
                        <td className="py-2 pr-2 text-right">
                          {state !== 'presente' && (
                            <button
                              onClick={() => handleManualCheckin(shift.id, shift.doctor_user_id!)}
                              className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700 transition font-medium"
                            >
                              Confirmar manualmente
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}

        {!loading && shifts.filter(s => !!s.doctor_user_id).length === 0 && (
          <div className="bg-white border rounded-xl p-4 text-xs text-slate-500">
            Nenhum plantão atribuído para esta data.
          </div>
        )}
      </main>
    </div>
  );
}