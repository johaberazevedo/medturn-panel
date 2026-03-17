'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// --- TIPAGENS ---
type AvailabilityPeriod = 'manha' | 'tarde' | 'noite';

type ShiftRow = {
  id: number; // ID do plantão (necessário para passar plantão)
  date: string;
  period: 'manha' | 'tarde' | 'noite' | '24h';
  badge: string | null; // PATCH
};

// Nova tipagem completa para a equipe do dia
type FullShiftData = {
  id: number;
  date: string;
  period: 'manha' | 'tarde' | 'noite' | '24h';
  doctor_user_id: string;
  is_chief: boolean;
  badge: string | null; // PATCH
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

type MonthAvailability = Record<string, { hospital_id: string; period: AvailabilityPeriod }[]>;

type MonthShifts = Record<string, { hospital_id: string; shifts: ShiftRow[] }[]>;

type MonthOpportunities = Record<string, { hospital_id: string; opps: SwapOpportunity[] }[]>;

type HospitalMini = { id: string; name: string; color: string | null };

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
    case 'manha': return { label: 'M' };
    case 'tarde': return { label: 'T' };
    case 'noite': return { label: 'N' };
    case '24h': return { label: '24' };
    default: return { label: '?' };
  }
}

// --- helpers de cor (hex -> rgba) ---
function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getHospitalColor(hid: string, map: Record<string, string>) {
  return map[hid] ?? '#64748b'; // slate-500 fallback
}

// ✅ Regra de expiração por período (fuso do celular)
function localYYYYMMDD(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function minutesNowLocal(d = new Date()) {
  return d.getHours() * 60 + d.getMinutes();
}

function isExpiredShift(shift: { date: string; period: 'manha' | 'tarde' | 'noite' | '24h' }) {
  const now = new Date();
  const today = localYYYYMMDD(now);

  if (shift.date < today) return true;   // dia anterior
  if (shift.date > today) return false;  // dia futuro

  // hoje
  if (shift.period === '24h') return false;

  const minutes = minutesNowLocal(now);
  const cutoff: Record<'manha' | 'tarde' | 'noite', number> = {
    manha: 9 * 60,
    tarde: 14 * 60,
    noite: 20 * 60,
  };

  return minutes >= cutoff[shift.period];
}

export default function MedicoCalendarioPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

const [hospitals, setHospitals] = useState<HospitalMini[]>([]);
const [hospitalNameById, setHospitalNameById] = useState<Record<string, string>>({});
const [hospitalColorById, setHospitalColorById] = useState<Record<string, string>>({});

// Modal “2 passos”
const [activeDayHospitalId, setActiveDayHospitalId] = useState<string | null>(null);
const [dayHospitals, setDayHospitals] = useState<HospitalMini[]>([]);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0–11

  const [monthAvailability, setMonthAvailability] = useState<MonthAvailability>({});
  const [monthShifts, setMonthShifts] = useState<MonthShifts>({});
  const [monthOpportunities, setMonthOpportunities] = useState<MonthOpportunities>({});
  
  // Estado para o Modal de Detalhes do Dia
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
const [selectedDateTeam, setSelectedDateTeam] = useState<FullShiftData[]>([]);
const [loadingDayDetails, setLoadingDayDetails] = useState(false);

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
  const loadMonthData = useCallback(async (hIds: string[], uId: string, y: number, m: number) => {
  if (!hIds.length) {
    setMonthAvailability({});
    setMonthShifts({});
    setMonthOpportunities({});
    return;
  }

  const lastDay = new Date(y, m + 1, 0).getDate();
  const monthStart = toLocalISO(y, m, 1);
  const monthEnd = toLocalISO(y, m, lastDay);

  // 1) Disponibilidade (todas)
  const { data: availData } = await supabase
    .from('availability')
.select('date, period, hospital_id')
.in('hospital_id', hIds)
.eq('user_id', uId)
.is('expires_at', null)
.gte('date', monthStart)
.lte('date', monthEnd);

  const availabilityMap: MonthAvailability = {};
  (availData ?? []).forEach((row: any) => {
    const d = row.date as string;
    if (!availabilityMap[d]) availabilityMap[d] = [];
    availabilityMap[d].push({
      hospital_id: row.hospital_id as string,
      period: row.period as AvailabilityPeriod,
    });
  });
  setMonthAvailability(availabilityMap);

  // 2) Meus plantões (todas)
  const { data: shiftsData } = await supabase
  .from('shifts')
  .select('id, date, period, badge, hospital_id') // PATCH
  .in('hospital_id', hIds)
  .eq('doctor_user_id', uId)
  .gte('date', monthStart)
  .lte('date', monthEnd);

  const shiftsMap: MonthShifts = {};
  (shiftsData ?? []).forEach((row: any) => {
    const d = row.date as string;
    const hid = row.hospital_id as string;
    const period = row.period as ShiftRow['period'];

    if (!shiftsMap[d]) shiftsMap[d] = [];

    let group = shiftsMap[d].find(g => g.hospital_id === hid);
    if (!group) {
      group = { hospital_id: hid, shifts: [] };
      shiftsMap[d].push(group);
    }

    group.shifts.push({ id: row.id, date: d, period, badge: row.badge ?? null }); // PATCH
  });
  setMonthShifts(shiftsMap);

  // 3) Oportunidades (todas)
  const { data: swapData } = await supabase
    .from('shift_swap_requests')
    .select('id, created_at, status, target_user_id, hospital_id, requester:requester_user_id(full_name), shift:from_shift_id(date, period)')
    .in('hospital_id', hIds)
    .neq('requester_user_id', uId)
    .eq('status', 'pendente')
    .or(`target_user_id.is.null,target_user_id.eq.${uId}`);

  const oppMap: MonthOpportunities = {};
    (swapData ?? []).forEach((item: any) => {
    const shift = Array.isArray(item.shift) ? item.shift[0] : item.shift;
    if (!shift) return;

    // ✅ expira por período (fuso do celular)
    if (shift?.date && shift?.period && isExpiredShift(shift)) return;

    const d = shift.date as string;
    if (d < monthStart || d > monthEnd) return;

    const hid = item.hospital_id as string;
    if (!oppMap[d]) oppMap[d] = [];

    let group = oppMap[d].find(g => g.hospital_id === hid);
    if (!group) {
      group = { hospital_id: hid, opps: [] };
      oppMap[d].push(group);
    }

    group.opps.push({
      id: item.id,
      date: d,
      period: shift.period,
      status: item.status,
      target_user_id: item.target_user_id,
      requester: Array.isArray(item.requester) ? item.requester[0] : item.requester,
    });
  });
    setMonthOpportunities(oppMap);
}, []);

  // --- CARREGAR DETALHES DO DIA (EQUIPE COMPLETA) ---
  const loadDayTeam = useCallback(async (hId: string, date: string) => {
  setLoadingDayDetails(true);

  const { data, error } = await supabase
    .from('shifts')
    .select('id, date, period, doctor_user_id, is_chief, badge, users(full_name)')
    .eq('hospital_id', hId)
    .eq('date', date)
    .order('period');

  if (!error && data) {
    const formatted = data.map((d: any) => ({
      ...d,
      users: Array.isArray(d.users) ? d.users[0] : d.users,
    })) as FullShiftData[];

    setSelectedDateTeam(formatted);
  } else {
    setSelectedDateTeam([]);
  }

  setLoadingDayDetails(false);
}, []);

  // --- AO CLICAR NO DIA ---
  function handleDayClick(date: string) {
  setSelectedDate(date);
  setSelectedDateTeam([]);
  setActiveDayHospitalId(null);

  const relevant = getHospitalsForDay(date);

  // 1️⃣ Se só existe 1 hospital no sistema → vai direto
  if (hospitals.length === 1) {
    const h = hospitals[0];
    setDayHospitals([h]);
    setActiveDayHospitalId(h.id);
    loadDayTeam(h.id, date);
    return;
  }

  // 2️⃣ Se o dia tem hospitais relevantes → usa eles
  if (relevant.length > 0) {
    setDayHospitals(relevant);

    if (relevant.length === 1) {
      setActiveDayHospitalId(relevant[0].id);
      loadDayTeam(relevant[0].id, date);
    }
    return;
  }

  // 3️⃣ Fallback: nenhum relevante → deixa escolher entre todos
  setDayHospitals(hospitals);
}

// ✅ NOVO: força abrir o seletor com TODOS os hospitais, no MESMO dia
function handleConsultarOutrosHospitais() {
  if (!selectedDate) return;
  setSelectedDateTeam([]);          // limpa equipe atual
  setActiveDayHospitalId(null);     // volta pro modal de escolha
  setDayHospitals(hospitals);       // mostra TODOS
}

function uniqById(list: HospitalMini[]) {
  const m = new Map<string, HospitalMini>();
  for (const h of list) m.set(h.id, h);
  return Array.from(m.values());
}

function getHospitalsForDay(date: string): HospitalMini[] {
  const found: HospitalMini[] = [];

  const shiftGroups = monthShifts[date] ?? [];
  for (const g of shiftGroups) {
    found.push({
  id: g.hospital_id,
  name: hospitalNameById[g.hospital_id] ?? 'Hospital',
  color: (hospitalColorById[g.hospital_id] ?? null),
});
  }

  const oppGroups = monthOpportunities[date] ?? [];
  for (const g of oppGroups) {
    found.push({
  id: g.hospital_id,
  name: hospitalNameById[g.hospital_id] ?? 'Hospital',
  color: (hospitalColorById[g.hospital_id] ?? null),
});
  }

  const av = monthAvailability[date] ?? [];
  for (const row of av) {
    // 1. Busca o hospital na lista completa para pegar a cor
    const hObj = hospitals.find(h => h.id === row.hospital_id);
    
    // 2. Adiciona com a cor (obrigatório agora)
    found.push({ 
      id: row.hospital_id, 
      name: hospitalNameById[row.hospital_id] ?? 'Hospital',
      color: hObj?.color ?? '#22c55e' 
    });
  }

  return uniqById(found);
}
  function handleMonthChange(delta: number) {
    const newDate = new Date(year, month + delta, 1);
    const newYear = newDate.getFullYear();
    const newMonth = newDate.getMonth();
    setYear(newYear);
    setMonth(newMonth);
    if (userId && hospitals.length) {
  loadMonthData(hospitals.map(h => h.id), userId, newYear, newMonth);
}
  }

  // --- AÇÃO: ACEITAR PLANTÃO (Blindada) ---
  async function handleManifestarInteresse(swapId: number) {
    if (!userId) return;
    setProcessingId(swapId);

    try {
      // SUBSTITUÍDO: Update direto -> RPC Segura
      const { error } = await supabase.rpc('claim_shift_swap', {
        swap_id: swapId,
        candidate_id: userId
      });

      if (error) {
        // Tratamento de mensagens amigáveis vindas do banco
        const msg = error.message;
        if (msg.includes('não está mais disponível')) {
          alert('Putz! Outro médico acabou de pegar esse plantão.');
        } else if (msg.includes('própria troca')) {
          alert('Você não pode aceitar uma troca que você mesmo criou.');
        } else {
          alert('Erro ao processar: ' + msg);
        }
        throw error;
      }

      alert('Interesse registrado! Aguardando aprovação da coordenação.');
      
      // Recarrega os dados para sumir com o botão ou mudar o status
      if (hospitals.length) {
        await loadMonthData(hospitals.map(h => h.id), userId, year, month);
      }
      
      // Opcional: Fecha o modal para forçar refresh visual
      setSelectedDate(null); 

    } catch (err) {
      console.error(err);
      // Não precisa de alert aqui se já tratamos no if(error)
    } finally {
      setProcessingId(null);
    }
  }

  // --- NOVA AÇÃO: PASSAR PLANTÃO ---
  async function handlePassarPlantao(shiftId: number) {
    if (!userId || !activeDayHospitalId) return;
    
    const confirm = window.confirm('Deseja anunciar este plantão para troca?');
    if (!confirm) return;

    setProcessingId(shiftId);

    try {
      const { error } = await supabase
        .from('shift_swap_requests')
        .insert({
          hospital_id: activeDayHospitalId,
          requester_user_id: userId,
          from_shift_id: shiftId,
          status: 'pendente'
          // target_user_id fica null (aberto para todos)
        });

      if (error) throw error;
      alert('Plantão anunciado com sucesso!');
      if (hospitals.length) loadMonthData(hospitals.map(h => h.id), userId, year, month);
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

      const { data: memberships, error: memErr } = await supabase
  .from('hospital_users')
  .select('hospital_id, created_at, hospitals: hospital_id ( id, name, color )')
  .eq('user_id', user.id)
  .order('created_at', { ascending: true });

if (memErr) {
  console.error(
    'Erro ao carregar vínculos:',
    memErr,
    (memErr as any)?.message,
    (memErr as any)?.details,
    (memErr as any)?.hint,
    (memErr as any)?.code
  );
  setLoading(false);
  return;
}
const list: HospitalMini[] = (memberships ?? []).map((m: any) => {
  const hosp = Array.isArray(m.hospitals) ? m.hospitals[0] : m.hospitals; // geralmente já vem objeto
  return {
    id: (hosp?.id ?? m.hospital_id) as string,
    name: (hosp?.name ?? 'Hospital') as string,
    color: (hosp?.color ?? null) as string | null,
  };
});

if (!list.length) {
  setLoading(false);
  return;
}

setHospitals(list);

// ✅ monta mapas a partir do list (já tem name e color do join)
const nameMap: Record<string, string> = {};
const colorMap: Record<string, string> = {};

for (const h of list) {
  nameMap[h.id] = h.name;
  if (h.color) colorMap[h.id] = h.color;
}

setHospitalNameById(nameMap);
setHospitalColorById(colorMap);

await loadMonthData(list.map(h => h.id), user.id, year, month);
setLoading(false);
    }
    init();
  }, [router, loadMonthData]); 

useEffect(() => {
  if (!userId || hospitals.length === 0) return;

  const hospitalIds = hospitals.map(h => h.id);

  const refreshAll = async () => {
    await loadMonthData(hospitalIds, userId, year, month);

    if (selectedDate && activeDayHospitalId) {
      await loadDayTeam(activeDayHospitalId, selectedDate);
    }
  };

  const channel = supabase
    .channel(`medico-calendario-${userId}-${year}-${month}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shifts',
      },
      async () => {
        await refreshAll();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'availability',
      },
      async () => {
  await refreshAll();
}
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shift_swap_requests',
      },
      async () => {
        await refreshAll();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [
  userId,
  hospitals,
  year,
  month,
  selectedDate,
  activeDayHospitalId,
  loadMonthData,
  loadDayTeam,
]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-600">Carregando...</div>;

  // --- RENDERIZAR DETALHES DO DIA (MODAL) ---
  const renderDayDetails = () => {
    if (!selectedDate) return null;
    
if (!activeDayHospitalId) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="bg-slate-50 border-b px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Escolha o hospital</h3>
          <button
  onClick={() => {
    setSelectedDate(null);
    setActiveDayHospitalId(null);
    setSelectedDateTeam([]);
  }}
  className="text-slate-400 hover:text-slate-600 font-bold text-lg"
>
  ✕
</button>
        </div>

        <div className="p-4 space-y-2">
          {dayHospitals.length === 0 ? (
            <p className="text-xs text-slate-500">Nenhum hospital relevante neste dia.</p>
          ) : (
            dayHospitals.map(h => (
              <button
                key={h.id}
                onClick={() => { setActiveDayHospitalId(h.id); loadDayTeam(h.id, selectedDate); }}
                className="w-full bg-white border rounded-xl p-4 text-left hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{h.name}</p>
                    <p className="text-[11px] text-slate-500">Ver detalhes do dia</p>
                  </div>
                  <span className="text-xs">›</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateLabel = new Date(y, m-1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    const oppGroup =
  (monthOpportunities[selectedDate] ?? []).find(g => g.hospital_id === activeDayHospitalId);
const opportunities = oppGroup?.opps ?? [];

const shiftGroup =
  (monthShifts[selectedDate] ?? []).find(g => g.hospital_id === activeDayHospitalId);
const myShifts = shiftGroup?.shifts ?? [];
    
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
  <div className="min-w-0">
    <h3 className="font-bold text-slate-800 capitalize truncate">{dateLabel}</h3>
    <p className="text-[10px] uppercase text-slate-500 truncate">
      {hospitalNameById[activeDayHospitalId] ?? 'Hospital'}
    </p>
  </div>

  <button
    onClick={() => {
      setSelectedDate(null);
      setActiveDayHospitalId(null);
      setSelectedDateTeam([]);
    }}
    className="text-slate-400 hover:text-slate-600 font-bold text-lg"
  >
    ✕
  </button>
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
        {shiftsInPeriod.map((s) => {
          const isMe = s.doctor_user_id === userId;
          const badgeText = (s.badge ?? '').trim().slice(0, 4).toUpperCase();

          return (
            <div
              key={s.id}
              className={`flex items-center justify-between p-1.5 rounded ${
                isMe ? 'bg-blue-50 border border-blue-100' : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className={`text-xs truncate ${isMe ? 'font-bold text-blue-900' : 'text-slate-700'}`}>
                  {s.users?.full_name ?? 'Sem nome'} {isMe && '(Você)'}
                </span>

                {/* BADGE (só aparece se existir) */}
                {badgeText.length > 0 && (
                  <span
                    className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1 rounded py-0.5 uppercase shrink-0"
                    title="Badge"
                  >
                    {badgeText}
                  </span>
                )}

                {/* CH (mantido igual) */}
                {s.is_chief && (
                  <span
                    className="text-[9px] font-bold bg-slate-800 text-white px-1 rounded py-0.5 shrink-0"
                    title="Chefe de Plantão"
                  >
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
          );
        })}
      </div>
    </div>
  );
})}

                {!loadingDayDetails && selectedDateTeam.length === 0 && (
                     <p className="text-center text-xs text-slate-400 py-2">Nenhum médico escalado ainda.</p>
                )}
            </div>
            
            <div className="pt-2 border-t space-y-2">
  {/* ✅ NOVO: força escolher qualquer hospital */}
  {hospitals.length > 1 && (
    <button
      type="button"
      onClick={handleConsultarOutrosHospitais}
      className="w-full text-center text-xs border rounded-lg py-2 bg-white hover:bg-slate-50 text-slate-700"
    >
      Consultar outros hospitais
    </button>
  )}

  <button 
    onClick={() => router.push(`/medico/disponibilidade?date=${selectedDate}&hospitalId=${activeDayHospitalId}`)}
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
  <p className="text-[10px] uppercase text-slate-500">Todos os hospitais</p>
  <h1 className="text-sm font-bold">Meus plantões</h1>
</div>
          <button onClick={() => router.push('/medico/disponibilidade')} className="text-xs border px-2 py-1 rounded">Disp.</button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* LEGENDINHA */}
        <div className="text-[10px] text-slate-500 flex justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Disp.</div>
          <div className="flex items-center gap-1"><span className="text-[9px] font-bold px-1 rounded border bg-blue-100 text-blue-700 border-blue-200">T</span> Meus plantões</div>
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
                const avRows = monthAvailability[iso] ?? [];
const shiftGroups = monthShifts[iso] ?? [];
const oppGroups = monthOpportunities[iso] ?? [];

const hasAvailability = avRows.length > 0;
const hasShifts = shiftGroups.some(g => g.shifts.length > 0);
const hasOpp = oppGroups.some(g => g.opps.length > 0);
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
                        {shiftGroups
  .flatMap((g) =>
    g.shifts.map((s) => ({
      hid: g.hospital_id,
      period: s.period,
      badge: s.badge ?? null, // PATCH
    }))
  )
  .slice(0, 3)
  .map((x, i) => {
    const pBadge = getPeriodBadge(x.period);
    const hex = getHospitalColor(x.hid, hospitalColorById);

    const label =
      (x.badge ?? '').trim()
        ? (x.badge ?? '').trim().slice(0, 4).toUpperCase()
        : pBadge.label;

    return (
      <span
        key={`${x.hid}-${i}`}
        title={hospitalNameById[x.hid] ?? 'Hospital'}
        className="text-[9px] leading-none font-bold px-0.5 py-0.5 rounded border min-w-[14px]"
        style={{
          backgroundColor: hexToRgba(hex, 0.14),
          borderColor: hexToRgba(hex, 0.35),
          color: hex,
        }}
      >
        {label}
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
{/* LEGENDA DE HOSPITAIS */}
{hospitals.length > 0 && (
  <div className="bg-white border rounded-2xl p-3 shadow-sm">
    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Legenda</p>
    <div className="flex flex-wrap gap-3">
      {[...hospitals]
  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }))
  .map((h) => {
        const hex = getHospitalColor(h.id, hospitalColorById);
        return (
          <div key={h.id} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full border"
              style={{
                backgroundColor: hexToRgba(hex, 0.9),
                borderColor: hexToRgba(hex, 0.4),
              }}
            />
            <span className="text-[11px] text-slate-700">{h.name}</span>
          </div>
        );
      })}
    </div>
  </div>
)}
      </main>
    </div>
  );
}