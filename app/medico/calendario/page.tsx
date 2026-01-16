'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// --- TIPAGENS ---
type AvailabilityPeriod = 'manha' | 'tarde' | 'noite';

type ShiftRow = {
  id: number; // ID do plantão (necessário para passar plantão)
  date: string;
  period: 'manha' | 'tarde' | 'noite' | '24h';
};

// Nova tipagem completa para a equipe do dia
type FullShiftData = {
  id: number;
  date: string;
  period: 'manha' | 'tarde' | 'noite' | '24h';
  doctor_user_id: string;
  is_chief: boolean;
  users: { full_name: string | null } | null;
};

type SwapOpportunity = {
  id: number;
  date: string;
  period: 'manha' | 'tarde' | 'noite' | '24h';
  status: string;
  target_user_id: string | null;
  requester: { full_name: string | null } | null;
};

type MonthAvailability = Record<string, AvailabilityPeriod[]>;
type MonthShifts = Record<string, ShiftRow[]>;
type MonthOpportunities = Record<string, SwapOpportunity[]>;

// --- HELPER DE MATRIZ ---
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

// --- HELPER VISUAL ---
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
  const [monthOpportunities, setMonthOpportunities] = useState<MonthOpportunities>({});
  
  // Estado para o Modal de Detalhes do Dia
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateTeam, setSelectedDateTeam] = useState<FullShiftData[]>([]); // Equipe completa do dia selecionado
  const [loadingDayDetails, setLoadingDayDetails] = useState(false); // Loading do modal

  const [processingId, setProcessingId] = useState<number | null>(null); // ID sendo processado (aceitar/passar)

  const monthMatrix = buildMonthMatrix(year, month);
  const monthLabel = new Date(year, month, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  function toLocalISO(y: number, m: number, d: number) {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }

  // --- CARREGAMENTO DE DADOS GERAIS (MÊS) ---
  async function loadMonthData(hId: string, uId: string, y: number, m: number) {
    const lastDay = new Date(y, m + 1, 0).getDate();
    const monthStart = toLocalISO(y, m, 1);
    const monthEnd = toLocalISO(y, m, lastDay);

    // 1) Disponibilidade
    const { data: availData } = await supabase
      .from('availability')
      .select('date, period')
      .eq('hospital_id', hId)
      .eq('user_id', uId)
      .gte('date', monthStart)
      .lte('date', monthEnd);

    const availabilityMap: MonthAvailability = {};
    (availData ?? []).forEach((row: any) => {
      const d = row.date as string;
      const p = row.period as AvailabilityPeriod;
      if (!availabilityMap[d]) availabilityMap[d] = [];
      if (!availabilityMap[d].includes(p)) availabilityMap[d].push(p);
    });
    setMonthAvailability(availabilityMap);

    // 2) Plantões Confirmados (Meus)
    const { data: shiftsData } = await supabase
      .from('shifts')
      .select('id, date, period') // Pegando ID também
      .eq('hospital_id', hId)
      .eq('doctor_user_id', uId)
      .gte('date', monthStart)
      .lte('date', monthEnd);

    const shiftsMap: MonthShifts = {};
    (shiftsData ?? []).forEach((row: any) => {
      const d = row.date as string;
      const period = row.period as ShiftRow['period'];
      if (!shiftsMap[d]) shiftsMap[d] = [];
      shiftsMap[d].push({ id: row.id, date: d, period });
    });
    setMonthShifts(shiftsMap);

    // 3) Oportunidades de Troca
    const { data: swapData } = await supabase
      .from('shift_swap_requests')
      .select('id, created_at, status, target_user_id, requester:requester_user_id(full_name), shift:from_shift_id(date, period)')
      .eq('hospital_id', hId)
      .neq('requester_user_id', uId)
      .eq('status', 'pendente')
      .or(`target_user_id.is.null,target_user_id.eq.${uId}`);
      
    const oppMap: MonthOpportunities = {};
    (swapData ?? []).forEach((item: any) => {
      const shift = Array.isArray(item.shift) ? item.shift[0] : item.shift;
      if (!shift) return;

      const d = shift.date;
      if (d < monthStart || d > monthEnd) return;

      if (!oppMap[d]) oppMap[d] = [];
      oppMap[d].push({
        id: item.id,
        date: d,
        period: shift.period,
        status: item.status,
        target_user_id: item.target_user_id,
        requester: Array.isArray(item.requester) ? item.requester[0] : item.requester,
      });
    });
    setMonthOpportunities(oppMap);
  }

  // --- CARREGAR DETALHES DO DIA (EQUIPE COMPLETA) ---
  async function loadDayTeam(date: string) {
    if (!hospitalId) return;
    setLoadingDayDetails(true);
    
    // Busca todos os plantões daquele dia no hospital
    const { data, error } = await supabase
      .from('shifts')
      .select('id, date, period, doctor_user_id, is_chief, users(full_name)')
      .eq('hospital_id', hospitalId)
      .eq('date', date)
      .order('period');

    if (!error && data) {
      const formatted = data.map((d: any) => ({
        ...d,
        users: Array.isArray(d.users) ? d.users[0] : d.users
      })) as FullShiftData[];
      
      setSelectedDateTeam(formatted);
    }
    setLoadingDayDetails(false);
  }

  // --- AO CLICAR NO DIA ---
  function handleDayClick(date: string) {
    setSelectedDate(date);
    loadDayTeam(date); // Carrega a equipe
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

  // --- AÇÃO: ACEITAR PLANTÃO ---
  async function handleManifestarInteresse(swapId: number) {
    if (!userId) return;
    setProcessingId(swapId);

    try {
      const { error } = await supabase
        .from('shift_swap_requests')
        .update({ target_user_id: userId })
        .eq('id', swapId);

      if (error) throw error;
      alert('Interesse registrado! Aguardando confirmação.');
      if (hospitalId) loadMonthData(hospitalId, userId, year, month);
      setSelectedDate(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao processar.');
    } finally {
      setProcessingId(null);
    }
  }

  // --- NOVA AÇÃO: PASSAR PLANTÃO ---
  async function handlePassarPlantao(shiftId: number) {
    if (!userId || !hospitalId) return;
    
    const confirm = window.confirm('Deseja anunciar este plantão para troca?');
    if (!confirm) return;

    setProcessingId(shiftId);

    try {
      const { error } = await supabase
        .from('shift_swap_requests')
        .insert({
          hospital_id: hospitalId,
          requester_user_id: userId,
          from_shift_id: shiftId,
          status: 'pendente'
          // target_user_id fica null (aberto para todos)
        });

      if (error) throw error;
      alert('Plantão anunciado com sucesso!');
      if (hospitalId) loadMonthData(hospitalId, userId, year, month);
      // Opcional: fechar modal ou recarregar detalhes
      setSelectedDate(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao anunciar troca. Verifique se já não existe um pedido.');
    } finally {
      setProcessingId(null);
    }
  }

  // --- INICIALIZAÇÃO ---
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
        setLoading(false);
        return;
      }

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

  // --- RENDERIZAR DETALHES DO DIA (MODAL) ---
  const renderDayDetails = () => {
    if (!selectedDate) return null;
    
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateLabel = new Date(y, m-1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    const opportunities = monthOpportunities[selectedDate] || [];
    const myShifts = monthShifts[selectedDate] || [];
    
    // Agrupamento da equipe por período
    const teamByPeriod: Record<string, FullShiftData[]> = {
      manha: [], tarde: [], noite: [], '24h': []
    };
    
    selectedDateTeam.forEach(s => {
      if (teamByPeriod[s.period]) teamByPeriod[s.period].push(s);
    });

    // Ordenação (Chefe primeiro)
    Object.keys(teamByPeriod).forEach(key => {
      teamByPeriod[key].sort((a, b) => {
        if (a.is_chief && !b.is_chief) return -1;
        if (!a.is_chief && b.is_chief) return 1;
        return 0;
      });
    });

    const periodsConfig = [
        { key: 'manha', label: 'Manhã', color: 'bg-green-50 text-green-800 border-green-100' },
        { key: 'tarde', label: 'Tarde', color: 'bg-blue-50 text-blue-800 border-blue-100' },
        { key: 'noite', label: 'Noite', color: 'bg-purple-50 text-purple-800 border-purple-100' },
        { key: '24h',   label: '24h',   color: 'bg-orange-50 text-orange-800 border-orange-100' },
    ];

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="bg-slate-50 border-b px-4 py-3 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-slate-800 capitalize">{dateLabel}</h3>
            <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
          </div>
          
          <div className="p-4 space-y-6 overflow-y-auto">
            
            {/* SEÇÃO 1: Trocas Disponíveis (Oportunidades) */}
            {opportunities.length > 0 && (
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Trocas Disponíveis</p>
                    {opportunities.map((op) => {
                        const iAmTarget = op.target_user_id === userId;
                        return (
                            <div key={op.id} className="bg-white border border-slate-200 rounded p-3 shadow-sm mb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-slate-500">Solicitante: <span className="font-medium text-slate-800">{op.requester?.full_name ?? 'Colega'}</span></p>
                                        <div className="mt-1 inline-block px-2 py-0.5 rounded text-xs font-bold uppercase bg-orange-100 text-orange-700">
                                            {op.period}
                                        </div>
                                    </div>
                                    
                                    {iAmTarget ? (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold text-center leading-tight">
                                            Aguardando<br/>Coordenação
                                        </span>
                                    ) : (
                                        <button 
                                            onClick={() => handleManifestarInteresse(op.id)}
                                            disabled={!!processingId}
                                            className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded hover:bg-slate-700 disabled:opacity-50"
                                        >
                                            {processingId === op.id ? '...' : 'Aceitar'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* SEÇÃO 2: Equipe Escalada (Escala do Dia) */}
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex justify-between items-center">
                   <span>Equipe Escalada</span>
                   {loadingDayDetails && <span className="text-[9px] font-normal lowercase">carregando...</span>}
                </p>

                {periodsConfig.map((pConf) => {
                    const shiftsInPeriod = teamByPeriod[pConf.key] || [];
                    if (shiftsInPeriod.length === 0) return null;

                    return (
                        <div key={pConf.key} className="mb-3 border rounded-lg overflow-hidden">
                            <div className={`text-[10px] font-bold px-2 py-1 uppercase tracking-wide border-b ${pConf.color}`}>
                                {pConf.label}
                            </div>
                            <div className="bg-white p-1 flex flex-col gap-1">
                                {shiftsInPeriod.map(s => {
                                    const isMe = s.doctor_user_id === userId;

                                    return (
                                        <div key={s.id} className={`flex items-center justify-between p-1.5 rounded ${isMe ? 'bg-blue-50 border border-blue-100' : 'bg-white'}`}>
                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                <span className={`text-xs truncate ${isMe ? 'font-bold text-blue-900' : 'text-slate-700'}`}>
                                                    {s.users?.full_name ?? 'Sem nome'} {isMe && '(Você)'}
                                                </span>
                                                {s.is_chief && (
                                                    <span className="text-[9px] font-bold bg-slate-800 text-white px-1 rounded py-0.5" title="Chefe de Plantão">
                                                        CH
                                                    </span>
                                                )}
                                            </div>

                                            {/* Botão Passar Plantão (Apenas se for meu e não estiver em processamento) */}
                                            {isMe && (
                                                <button
                                                    onClick={() => handlePassarPlantao(s.id)}
                                                    disabled={!!processingId}
                                                    className="shrink-0 text-[10px] text-red-600 border border-red-200 px-2 py-0.5 rounded hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    {processingId === s.id ? '...' : 'Passar'}
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}

                {!loadingDayDetails && selectedDateTeam.length === 0 && (
                     <p className="text-center text-xs text-slate-400 py-2">Nenhum médico escalado ainda.</p>
                )}
            </div>
            
            <div className="pt-2 border-t">
                <button 
                    onClick={() => router.push(`/medico/disponibilidade?date=${selectedDate}`)}
                    className="w-full text-center text-xs text-blue-600 hover:underline py-1"
                >
                    Gerenciar minha disponibilidade neste dia →
                </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {renderDayDetails()}

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
        <div className="text-[10px] text-slate-500 flex justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Disp.</div>
          <div className="flex items-center gap-1"><span className="text-[9px] font-bold px-1 rounded border bg-blue-100 text-blue-700 border-blue-200">T</span> Meu Plantão</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Oportunidade</div>
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
                const opportunities = monthOpportunities[iso] ?? [];
                
                const hasShifts = shifts.length > 0;
                const hasOpp = opportunities.length > 0;
                const isToday = iso === toLocalISO(today.getFullYear(), today.getMonth(), today.getDate());

                let bg = 'bg-slate-50';
                let border = 'border-transparent';
                
                // Prioridade Visual
                if (hasShifts) { bg = 'bg-sky-50'; border = 'border-sky-200'; }
                else if (hasOpp) { bg = 'bg-orange-50'; border = 'border-orange-200'; }
                else if (hasAvailability) { bg = 'bg-emerald-50'; border = 'border-emerald-200'; }

                return (
                  <button
                    key={`${wi}-${di}`}
                    onClick={() => handleDayClick(iso)}
                    className={`h-16 rounded-lg border flex flex-col items-center justify-start pt-1 relative ${bg} ${border} ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                  >
                    <span className={`text-xs font-medium ${hasShifts ? 'text-sky-700' : hasOpp ? 'text-orange-700' : hasAvailability ? 'text-emerald-700' : 'text-slate-600'}`}>{day}</span>
                    
                    {/* Indicadores Visuais */}
                    <div className="flex gap-1 mt-1 flex-wrap justify-center px-0.5">
                        {/* Bolinha Laranja = Troca Disponível */}
                        {hasOpp && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1"></div>}

                        {/* Badges para MEUS turnos */}
                        {shifts.map((s, i) => {
                            const badge = getPeriodBadge(s.period);
                            return (
                                <span key={i} className={`text-[9px] leading-none font-bold px-0.5 py-0.5 rounded border ${badge.color} min-w-[14px]`}>
                                    {badge.label}
                                </span>
                            );
                        })}

                         {/* Bolinha verde = Disponibilidade */}
                         {hasAvailability && !hasShifts && !hasOpp && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1"></div>}
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