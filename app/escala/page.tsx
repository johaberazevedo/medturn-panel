'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type ShiftRow = {
  id: number;
  date: string;
  period: 'manha' | 'tarde' | 'noite' | '24h';
  users: { full_name: string | null } | null;
};

type Membership = {
  hospital_id: string;
  hospitals: { name: string | null } | null;
};

// Config de capacidade por período (mesma lógica da tela de edição)
const PERIOD_CONFIG: {
  key: 'manha' | 'tarde' | 'noite' | '24h';
  label: string;
  short: string;
  maxDoctors: number;
}[] = [
  { key: 'manha', label: 'MANHÃ', short: 'M', maxDoctors: 6 },
  { key: 'tarde', label: 'TARDE', short: 'T', maxDoctors: 6 },
  { key: 'noite', label: 'NOITE', short: 'N', maxDoctors: 3 },
  { key: '24h', label: '24H', short: '24H', maxDoctors: 6 },
];

export default function EscalaMensalPage() {
  const router = useRouter();

  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('');
  const [userName, setUserName] = useState<string | null>(null);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para cópia de mês
  const [copyTargetMonth, setCopyTargetMonth] = useState<string>('');
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const monthName = new Date(year, month).toLocaleDateString('pt-BR', {
    month: 'long',
  });

  function getDaysMatrix(year: number, month: number) {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    const matrix: (number | null)[][] = [];
    let week: (number | null)[] = [];

    let weekdayOfFirst = first.getDay(); // 0 = domingo, 1 = segunda, ...

    // Preenche dias vazios antes do primeiro dia
    for (let i = 0; i < weekdayOfFirst; i++) {
      week.push(null);
    }

    for (let day = 1; day <= last.getDate(); day++) {
      week.push(day);

      if (week.length === 7) {
        matrix.push(week);
        week = [];
      }
    }

    while (week.length < 7) {
      week.push(null);
    }
    matrix.push(week);

    return matrix;
  }

  async function loadShifts(hId: string, y: number, m: number) {
    // Monta as datas no formato YYYY-MM-DD para evitar problemas de fuso
    const monthStr = String(m + 1).padStart(2, '0');

    const monthStart = `${y}-${monthStr}-01`;
    const lastDayOfMonth = new Date(y, m + 1, 0).getDate();
    const monthEnd = `${y}-${monthStr}-${String(lastDayOfMonth).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('shifts')
      .select('id, date, period, users(full_name)')
      .eq('hospital_id', hId)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .order('date');

    if (!error && data) {
      setShifts(data as ShiftRow[]);
    }
  }

  function handleMonthChange(delta: number) {
    let newMonth = month + delta;
    let newYear = year;

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    setMonth(newMonth);
    setYear(newYear);

    if (hospitalId) loadShifts(hospitalId, newYear, newMonth);
  }

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      setUserName(profile?.full_name ?? user.email ?? 'Usuário');

      const { data: membership } = await supabase
        .from('hospital_users')
        .select('hospital_id, hospitals(name)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        setLoading(false);
        return;
      }

      const m = membership as Membership;
      setHospitalId(m.hospital_id);
      setHospitalName(m.hospitals?.name ?? 'Hospital');

      await loadShifts(m.hospital_id, year, month);
      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matrix = getDaysMatrix(year, month);

  function periodBadge(period: string) {
    const styles: any = {
      manha: 'bg-green-100 text-green-700 border border-green-300',
      tarde: 'bg-blue-100 text-blue-700 border border-blue-300',
      noite: 'bg-purple-100 text-purple-700 border border-purple-300',
      '24h': 'bg-orange-100 text-orange-700 border border-orange-300',
    };

    const labels: any = {
      manha: 'MANHÃ',
      tarde: 'TARDE',
      noite: 'NOITE',
      '24h': '24H',
    };

    return (
      <span
        className={
          'text-[10px] px-2 py-0.5 rounded-lg font-medium ' + styles[period]
        }
      >
        {labels[period]}
      </span>
    );
  }

  function periodCountBadge(
    period: 'manha' | 'tarde' | 'noite' | '24h',
    count: number
  ) {
    const cfg = PERIOD_CONFIG.find((p) => p.key === period);
    if (!cfg) return null;

    const max = cfg.maxDoctors;

    let base =
      'inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border ';
    let label = cfg.short;

    if (count === 0) {
      base += 'bg-red-50 text-red-700 border-red-200';
    } else if (count < max) {
      base += 'bg-amber-50 text-amber-700 border-amber-200';
    } else {
      base += 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    return (
      <span className={base}>
        <span>{label}</span>
        <span className="font-semibold">
          {count}/{max}
        </span>
      </span>
    );
  }

  async function handleCopyMonth() {
    if (!hospitalId) return;
    setCopyError(null);
    setCopySuccess(null);

    if (!copyTargetMonth) {
      setCopyError('Escolha o mês de destino.');
      return;
    }

    const [targetYearStr, targetMonthStr] = copyTargetMonth.split('-');
    const targetYearNum = parseInt(targetYearStr, 10);
    const targetMonthIndex = parseInt(targetMonthStr, 10) - 1;

    if (
      Number.isNaN(targetYearNum) ||
      Number.isNaN(targetMonthIndex) ||
      targetMonthIndex < 0 ||
      targetMonthIndex > 11
    ) {
      setCopyError('Mês de destino inválido.');
      return;
    }

    if (targetYearNum === year && targetMonthIndex === month) {
      setCopyError('O mês de destino é igual ao mês atual.');
      return;
    }

    setCopyLoading(true);

    try {
      const sourceStart = new Date(year, month, 1)
        .toISOString()
        .slice(0, 10);
      const sourceEnd = new Date(year, month + 1, 0)
        .toISOString()
        .slice(0, 10);

      type CopyRow = {
        date: string;
        period: string | null;
        doctor_user_id: string | null;
      };

      const { data: sourceData, error: sourceError } = await supabase
        .from('shifts')
        .select('date, period, doctor_user_id')
        .eq('hospital_id', hospitalId)
        .gte('date', sourceStart)
        .lte('date', sourceEnd);

      if (sourceError) {
        setCopyError(
          `Erro ao carregar escala do mês atual: ${sourceError.message}`
        );
        setCopyLoading(false);
        return;
      }

      const sourceRows = (sourceData ?? []) as CopyRow[];

      const rowsToInsert: {
        hospital_id: string;
        date: string;
        period: string;
        doctor_user_id: string;
      }[] = [];

      for (const row of sourceRows) {
        if (!row.period || !row.doctor_user_id) continue;

        const day = parseInt(row.date.slice(8, 10), 10);
        if (Number.isNaN(day)) continue;

        const targetDate = new Date(targetYearNum, targetMonthIndex, day);

        // Ignora dias que não existem no mês destino
        if (targetDate.getMonth() !== targetMonthIndex) {
          continue;
        }

        const targetIso = targetDate.toISOString().slice(0, 10);

        rowsToInsert.push({
          hospital_id: hospitalId,
          date: targetIso,
          period: row.period,
          doctor_user_id: row.doctor_user_id,
        });
      }

      const targetStart = new Date(targetYearNum, targetMonthIndex, 1)
        .toISOString()
        .slice(0, 10);
      const targetEnd = new Date(targetYearNum, targetMonthIndex + 1, 0)
        .toISOString()
        .slice(0, 10);

      const { error: deleteError } = await supabase
        .from('shifts')
        .delete()
        .eq('hospital_id', hospitalId)
        .gte('date', targetStart)
        .lte('date', targetEnd);

      if (deleteError) {
        setCopyError(
          `Erro ao limpar escala do mês de destino: ${deleteError.message}`
        );
        setCopyLoading(false);
        return;
      }

      if (rowsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('shifts')
          .insert(rowsToInsert);

        if (insertError) {
          setCopyError(
            `Erro ao copiar escala para o mês destino: ${insertError.message}`
          );
          setCopyLoading(false);
          return;
        }

        setCopySuccess(
          `Escala copiada com sucesso para ${copyTargetMonth}.`
        );
      } else {
        setCopySuccess(
          'Não havia plantões no mês atual para copiar (ou todos caíram em dias inexistentes no mês destino).'
        );
      }

      setYear(targetYearNum);
      setMonth(targetMonthIndex);
      await loadShifts(hospitalId, targetYearNum, targetMonthIndex);
    } catch (err: any) {
      setCopyError(
        `Erro inesperado ao copiar escala: ${err?.message ?? String(err)}`
      );
    } finally {
      setCopyLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-600">Carregando escala...</p>
      </div>
    );
  }

  if (!hospitalId) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white border rounded-xl px-4 py-3 text-sm">
          Não foi possível identificar seu hospital. Verifique seu cadastro.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold">Escala mensal</h1>
            <p className="text-[11px] text-slate-500">
              {hospitalName}
              {userName ? ` • Logado como ${userName}` : ''}
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs border px-3 py-1.5 rounded-lg"
          >
            Voltar
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleMonthChange(-1)}
              className="text-sm px-3 py-1 border rounded-lg"
            >
              ◀
            </button>

            <h2 className="text-xl font-semibold capitalize text-center">
              {monthName} {year}
            </h2>

            <button
              onClick={() => handleMonthChange(1)}
              className="text-sm px-3 py-1 border rounded-lg"
            >
              ▶
            </button>
          </div>

          {/* Barra de cópia de mês */}
          <div className="mt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2 border rounded-xl bg-white px-3 py-2">
            <span className="text-[11px] text-slate-600">
              Copiar escala deste mês para outro mês (mesmo padrão de dias).
            </span>
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={copyTargetMonth}
                onChange={(e) => {
                  setCopyTargetMonth(e.target.value);
                  setCopyError(null);
                  setCopySuccess(null);
                }}
                className="border rounded-lg px-2 py-1.5 text-xs"
              />
              <button
                onClick={handleCopyMonth}
                disabled={copyLoading || !hospitalId}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-60"
              >
                {copyLoading ? 'Copiando...' : 'Copiar escala para mês'}
              </button>
            </div>
          </div>

          {copyError && (
            <div className="bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-xs">
              {copyError}
            </div>
          )}
          {copySuccess && (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-lg text-xs">
              {copySuccess}
            </div>
          )}
        </div>

        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 text-center font-semibold text-slate-600 mb-2 mt-2 text-[11px]">
          <div>Dom</div>
          <div>Seg</div>
          <div>Ter</div>
          <div>Qua</div>
          <div>Qui</div>
          <div>Sex</div>
          <div>Sab</div>
        </div>

        {/* GRID de dias */}
        <div className="grid grid-cols-7 gap-2">
          {matrix.map((week, wi) =>
            week.map((day, di) => {
              const iso =
                day !== null
                  ? `${year}-${String(month + 1).padStart(2, '0')}-${String(
                      day
                    ).padStart(2, '0')}`
                  : null;

              const dayShifts = shifts.filter((s) => s.date === iso);

              const counts: Record<'manha' | 'tarde' | 'noite' | '24h', number> =
                {
                  manha: 0,
                  tarde: 0,
                  noite: 0,
                  '24h': 0,
                };

              dayShifts.forEach((s) => {
                if (counts[s.period] !== undefined) {
                  counts[s.period]++;
                }
              });

              return (
                <div
                  key={`${wi}-${di}`}
                  className={`min-h-[140px] bg-white p-2 rounded-lg border text-xs flex flex-col ${
                    day ? '' : 'opacity-40'
                  }`}
                >
                  <div className="font-bold mb-1">{day ?? ''}</div>

                  {/* Linha de contadores por período */}
                  {day && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {PERIOD_CONFIG.map((p) => (
                        <span key={p.key}>
                          {periodCountBadge(p.key, counts[p.key])}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Lista de plantões do dia */}
                  {dayShifts.map((s) => (
                    <div
                      key={s.id}
                      className="mb-1 p-1 bg-slate-50 rounded border flex flex-col"
                    >
                      <span className="font-medium text-[11px]">
                        {s.users?.full_name ?? 'Sem nome'}
                      </span>
                      <div className="mt-1">{periodBadge(s.period)}</div>
                    </div>
                  ))}

                  {day && iso && (
                    <button
                      onClick={() =>
                        router.push(`/escala/editar?date=${iso}`)
                      }
                      className="text-[10px] text-slate-500 underline mt-auto"
                    >
                      + editar / adicionar
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}