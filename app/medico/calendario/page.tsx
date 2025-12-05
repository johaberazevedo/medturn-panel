'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type AvailabilityPeriod = 'manha' | 'tarde' | 'noite';

type MembershipRow = {
  hospital_id: string;
  hospitals: {
    name: string | null;
  } | null;
};

type ShiftRow = {
  date: string;
  period: 'manha' | 'tarde' | 'noite' | '24h';
};

type MonthAvailability = Record<string, AvailabilityPeriod[]>;
type MonthShifts = Record<string, ShiftRow[]>;

function buildMonthMatrix(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);

  const matrix: (number | null)[][] = [];
  let week: (number | null)[] = [];

  const weekdayOfFirst = first.getDay(); // 0 = domingo

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

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    matrix.push(week);
  }

  return matrix;
}

// Helper para pegar estilo e sigla do período
function getPeriodBadge(p: string) {
    switch (p) {
      case 'manha': return { label: 'M', color: 'bg-green-100 text-green-700 border-green-200' };
      case 'tarde': return { label: 'T', color: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'noite': return { label: 'N', color: 'bg-purple-100 text-purple-700 border-purple-200' };
      case '24h': return { label: '24', color: 'bg-orange-100 text-orange-700 border-orange-200' };
      default: return { label: '?', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
}

export default function MedicoCalendarioPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('Hospital');
  const [userId, setUserId] = useState<string | null>(null);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0–11

  const [monthAvailability, setMonthAvailability] = useState<MonthAvailability>({});
  const [monthShifts, setMonthShifts] = useState<MonthShifts>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const monthMatrix = buildMonthMatrix(year, month);
  const monthLabel = new Date(year, month, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  // Função auxiliar para gerar YYYY-MM-DD localmente sem UTC shift
  function toLocalISO(y: number, m: number, d: number) {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }

  async function loadMonthData(hId: string, uId: string, y: number, m: number) {
    setErrorMsg(null);

    const lastDay = new Date(y, m + 1, 0).getDate();
    const monthStart = toLocalISO(y, m, 1);
    const monthEnd = toLocalISO(y, m, lastDay);

    // 1) Disponibilidade do médico
    const { data: availData, error: availError } = await supabase
      .from('availability')
      .select('date, period')
      .eq('hospital_id', hId)
      .eq('user_id', uId)
      .gte('date', monthStart)
      .lte('date', monthEnd);

    if (availError) console.error(availError);

    const availabilityMap: MonthAvailability = {};
    (availData ?? []).forEach((row: any) => {
      const d = row.date as string;
      const p = row.period as AvailabilityPeriod;
      if (!availabilityMap[d]) availabilityMap[d] = [];
      if (!availabilityMap[d].includes(p)) {
        availabilityMap[d].push(p);
      }
    });
    setMonthAvailability(availabilityMap);

    // 2) Plantões do médico (Escala confirmada)
    const { data: shiftsData, error: shiftsError } = await supabase
      .from('shifts')
      .select('date, period')
      .eq('hospital_id', hId)
      .eq('doctor_user_id', uId)
      .gte('date', monthStart)
      .lte('date', monthEnd);

    if (shiftsError) console.error(shiftsError);

    const shiftsMap: MonthShifts = {};
    (shiftsData ?? []).forEach((row: any) => {
      const d = row.date as string;
      const period = row.period as ShiftRow['period'];
      if (!shiftsMap[d]) shiftsMap[d] = [];
      shiftsMap[d].push({ date: d, period });
    });
    setMonthShifts(shiftsMap);
  }

  function handleMonthChange(delta: number) {
    const newDate = new Date(year, month + delta, 1);
    const newYear = newDate.getFullYear();
    const newMonth = newDate.getMonth();
    setYear(newYear);
    setMonth(newMonth);
    if (hospitalId && userId) {
      loadMonthData(hospitalId, userId, newYear, newMonth);
    }
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
        setErrorMsg('Não foi possível encontrar seu hospital.');
        setLoading(false);
        return;
      }

      // Correção: Trata o array que vem do Supabase (hospitals pode vir como lista)
      const rawM = membership as any;
      const hospData = rawM.hospitals;
      const realName = Array.isArray(hospData) ? hospData[0]?.name : hospData?.name;

      setHospitalId(rawM.hospital_id);
      setHospitalName(realName ?? 'Hospital');

      await loadMonthData(rawM.hospital_id, user.id, year, month);
      setLoading(false);
    }
    init();
  }, [router]); 

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-600">Carregando...</div>;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/medico')} className="text-xl">🏠</button>
          <div className="text-center">
            <p className="text-[10px] uppercase text-slate-500">{hospitalName}</p>
            <h1 className="text-sm font-bold">Calendário</h1>
          </div>
          <button onClick={() => router.push('/medico/disponibilidade')} className="text-xs border px-2 py-1 rounded">Disp.</button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* LEGENDINHA */}
        <div className="text-[10px] text-slate-500 flex justify-center gap-4">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Disp.</div>
          <div className="flex items-center gap-1"><span className="text-[9px] font-bold px-1 rounded border bg-blue-100 text-blue-700 border-blue-200">T</span> Plantão</div>
        </div>

        <section className="bg-white border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => handleMonthChange(-1)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100">◀</button>
            <h2 className="text-sm font-semibold capitalize">{monthLabel}</h2>
            <button onClick={() => handleMonthChange(1)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100">▶</button>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] font-medium text-slate-400 mb-2">
            <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthMatrix.map((week, wi) =>
              week.map((day, di) => {
                if (day === null) return <div key={`e-${wi}-${di}`} className="h-16" />;

                const iso = toLocalISO(year, month, day);
                const hasAvailability = !!monthAvailability[iso];
                const shifts = monthShifts[iso] ?? [];
                const hasShifts = shifts.length > 0;
                const isToday = iso === toLocalISO(today.getFullYear(), today.getMonth(), today.getDate());

                let bg = 'bg-slate-50';
                let border = 'border-transparent';
                
                // Destaque sutil se tiver algo
                if (hasShifts) { bg = 'bg-sky-50'; border = 'border-sky-200'; }
                else if (hasAvailability) { bg = 'bg-emerald-50'; border = 'border-emerald-200'; }

                return (
                  <button
                    key={`${wi}-${di}`}
                    onClick={() => router.push(`/medico/disponibilidade?date=${iso}`)}
                    className={`h-16 rounded-lg border flex flex-col items-center justify-start pt-1 relative ${bg} ${border} ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                  >
                    <span className={`text-xs font-medium ${hasShifts ? 'text-sky-700' : hasAvailability ? 'text-emerald-700' : 'text-slate-600'}`}>{day}</span>
                    
                    {/* Indicadores */}
                    <div className="flex gap-1 mt-1 flex-wrap justify-center px-0.5">
                        {/* Bolinha verde para disponibilidade (se não tiver plantão, para limpar visual, ou mostra ambos se preferir) */}
                        {hasAvailability && !hasShifts && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1"></div>}
                        
                        {/* Badges para os turnos */}
                        {shifts.map((s, i) => {
                            const badge = getPeriodBadge(s.period);
                            return (
                                <span key={i} className={`text-[9px] leading-none font-bold px-0.5 py-0.5 rounded border ${badge.color} min-w-[14px]`}>
                                    {badge.label}
                                </span>
                            );
                        })}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}