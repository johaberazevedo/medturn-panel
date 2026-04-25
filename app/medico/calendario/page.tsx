'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { toast, Toaster } from 'sonner';

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
  reason: string | null;
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

  if (shift.date < today) return true;
  if (shift.date > today) return false;

  if (shift.period === '24h') return false;

  const minutes = minutesNowLocal(now);
  const cutoff: Record<'manha' | 'tarde' | 'noite', number> = {
    manha: 9 * 60,
    tarde: 14 * 60,
    noite: 20 * 60,
  };

  return minutes >= cutoff[shift.period];
}

function isPendingStatus(status: string) {
  return status === 'pendente' || status === 'pending';
}

function isDirectOfferPending(op: SwapOpportunity) {
  return op.reason === '__direct_offer__';
}

function isDirectOfferAccepted(op: SwapOpportunity) {
  return op.reason === '__direct_offer__accepted';
}

function isAvailabilityAccepted(op: SwapOpportunity) {
  return op.reason === '__offer_via_disponibilidade__';
}

function isMarketplaceOpen(op: SwapOpportunity) {
  return (
    isPendingStatus(op.status) &&
    !op.target_user_id &&
    op.reason !== '__offer_via_disponibilidade__'
  );
}

function isMarketplaceAccepted(op: SwapOpportunity) {
  return (
    isPendingStatus(op.status) &&
    !!op.target_user_id &&
    op.reason !== '__direct_offer__' &&
    op.reason !== '__direct_offer__accepted' &&
    op.reason !== '__offer_via_disponibilidade__'
  );
}

function isAwaitingCoordination(op: SwapOpportunity) {
  return (
    isPendingStatus(op.status) &&
    !!op.target_user_id &&
    (
      isMarketplaceAccepted(op) ||
      isDirectOfferAccepted(op) ||
      isAvailabilityAccepted(op)
    )
  );
}

function isDirectedToMePending(op: SwapOpportunity, userId: string | null) {
  return !!userId && isDirectOfferPending(op) && op.target_user_id === userId;
}

function getMyShiftSwapStatus(
  shiftId: number,
  mySwapRequests: {
    id: number;
    shift_id: number | null;
    status: string;
    target_user_id: string | null;
    reason: string | null;
  }[]
) {
  const req = mySwapRequests.find(r => r.shift_id === shiftId);
  if (!req) return null;

  const marketplaceAccepted =
  isPendingStatus(req.status) &&
  !!req.target_user_id &&
  req.reason !== '__direct_offer__' &&
  req.reason !== '__direct_offer__accepted' &&
  req.reason !== '__offer_via_disponibilidade__';

const awaitingCoordination =
  isPendingStatus(req.status) &&
  !!req.target_user_id &&
  (
    marketplaceAccepted ||
    req.reason === '__direct_offer__accepted' ||
    req.reason === '__offer_via_disponibilidade__'
  );

  if (awaitingCoordination) {
    return {
      requestId: req.id,
      type: 'awaiting_coordination' as const,
      label: 'Oferta aceita. Aguardando coordenação',
      canCancel: false,
    };
  }

  if (req.reason === '__direct_offer__') {
    return {
      requestId: req.id,
      type: 'direct_offer_pending' as const,
      label: 'Oferta direcionada pendente',
      canCancel: true,
    };
  }

  return {
    requestId: req.id,
    type: 'marketplace_open' as const,
    label: 'Anunciado',
    canCancel: true,
  };
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

  const [passOptionsOpen, setPassOptionsOpen] = useState(false);
  const [passShiftId, setPassShiftId] = useState<number | null>(null);

const [directOfferOpen, setDirectOfferOpen] = useState(false);

const [doctorOptions, setDoctorOptions] = useState<{ id: string; name: string }[]>([]);

const [loadingDoctors, setLoadingDoctors] = useState(false);

const [mySwapRequests, setMySwapRequests] = useState<

  {

    id: number;

    shift_id: number | null;

    date: string;

    period: string;

    status: string;

    target_user_id: string | null;

    reason: string | null;

    hospital_id: string;

  }[]

>([]);

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
  .select('id, created_at, status, target_user_id, reason, hospital_id, requester:requester_user_id(full_name), shift:from_shift_id(date, period)')
  .in('hospital_id', hIds)
  .neq('requester_user_id', uId)
  .eq('status', 'pendente')
  .or(`target_user_id.is.null,target_user_id.eq.${uId}`);

const { data: mySwapData } = await supabase
  .from('shift_swap_requests')
  .select('id, status, target_user_id, reason, hospital_id, shift:from_shift_id(id, date, period)')
  .in('hospital_id', hIds)
  .eq('requester_user_id', uId)
  .eq('status', 'pendente');

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
        reason: item.reason ?? null,
        requester: Array.isArray(item.requester) ? item.requester[0] : item.requester,
      });
    });
    setMonthOpportunities(oppMap);

const myOwnRequests = (mySwapData ?? []).map((item: any) => {
  const shift = Array.isArray(item.shift) ? item.shift[0] : item.shift;

  return {
    id: item.id,
    shift_id: shift?.id ?? null,
    date: shift?.date ?? '',
    period: shift?.period ?? '',
    status: item.status,
    target_user_id: item.target_user_id,
    reason: item.reason ?? null,
    hospital_id: item.hospital_id as string,
  };
});

setMySwapRequests(myOwnRequests);
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

    setPassOptionsOpen(false);
    setDirectOfferOpen(false);
    setPassShiftId(null);
    setDoctorOptions([]);

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
    setSelectedDateTeam([]);
    setActiveDayHospitalId(null);
    setDayHospitals(hospitals);

    setPassOptionsOpen(false);
    setDirectOfferOpen(false);
    setPassShiftId(null);
    setDoctorOptions([]);
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
      const hObj = hospitals.find(h => h.id === row.hospital_id);

      found.push({ 
        id: row.hospital_id, 
        name: hospitalNameById[row.hospital_id] ?? 'Hospital',
        color: hObj?.color ?? '#22c55e',
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

  function openPassOptions(shiftId: number) {
  const shift =
    Object.values(monthShifts)
      .flatMap(groups => groups.flatMap(group => group.shifts))
      .find(s => s.id === shiftId);

  if (shift && isExpiredShift({ date: shift.date, period: shift.period })) {
    toast.error('Esse plantão já foi encerrado e não pode mais ser anunciado.');
    return;
  }

  setPassShiftId(shiftId);
  setPassOptionsOpen(true);
}

  // --- AÇÃO: ACEITAR PLANTÃO (Blindada) ---
  async function handleManifestarInteresse(swapId: number) {
  if (!userId) return;

  const opGroup =
    selectedDate && activeDayHospitalId
      ? (monthOpportunities[selectedDate] ?? []).find(g => g.hospital_id === activeDayHospitalId)
      : null;

  const currentOpportunity = opGroup?.opps.find(op => op.id === swapId);

  const isDirectOffer =
  currentOpportunity ? isDirectedToMePending(currentOpportunity, userId) : false;

const periodLabelMap: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  '24h': '24h',
};

const shiftPeriod = currentOpportunity?.period
  ? (periodLabelMap[currentOpportunity.period] ?? currentOpportunity.period)
  : 'Plantão';

const shiftDate = currentOpportunity?.date
  ? new Date(currentOpportunity.date + 'T12:00:00').toLocaleDateString('pt-BR')
  : '';

const hospitalName =
  activeDayHospitalId
    ? (hospitalNameById[activeDayHospitalId] ?? 'Hospital')
    : 'Hospital';

const confirmMessage = isDirectOffer
  ? `Esse plantão de ${shiftPeriod}${shiftDate ? `, em ${shiftDate}` : ''}, no ${hospitalName}, foi oferecido diretamente para você. Deseja aceitar?`
  : `Deseja aceitar o plantão de ${shiftPeriod}${shiftDate ? `, em ${shiftDate}` : ''}, no ${hospitalName}?`;

const confirmed = window.confirm(confirmMessage);
  if (!confirmed) return;

  setProcessingId(swapId);

  try {
    if (isDirectOffer) {
  const { data, error } = await supabase
    .from('shift_swap_requests')
    .update({
      reason: '__direct_offer__accepted',
      status: 'pendente',
    })
    .eq('id', swapId)
    .eq('status', 'pendente')
    .eq('target_user_id', userId)
    .eq('reason', '__direct_offer__')
    .select('id')
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    toast.error('Essa oferta direcionada não está mais disponível para você.');
    return;
  }

  toast.success('Oferta aceita! Agora falta a coordenação confirmar.');
} else {
  const { error } = await supabase.rpc('claim_shift_swap', {
    swap_id: swapId,
    candidate_id: userId,
  });

  if (error) {
    const msg = error.message ?? '';

    if (msg.includes('não está mais disponível')) {
      toast.error('Putz! Outro médico acabou de pegar esse plantão.');
    } else if (msg.includes('própria troca')) {
      toast.error('Você não pode aceitar uma troca que você mesmo criou.');
    } else {
      toast.error('Erro ao processar: ' + msg);
    }

    throw error;
  }

  toast.success('Interesse registrado! Aguardando aprovação da coordenação.');
}

    if (hospitals.length) {
      await loadMonthData(hospitals.map(h => h.id), userId, year, month);
    }

    setSelectedDate(null);
  } catch (err) {
    console.error(err);
  } finally {
    setProcessingId(null);
  }
}

  // --- NOVA AÇÃO: PASSAR PLANTÃO ---
  async function handlePassarPlantao(shiftId: number) {
    if (!userId || !activeDayHospitalId) return;

    setProcessingId(shiftId);

    try {
      const { error } = await supabase
        .from('shift_swap_requests')
        .insert({
          hospital_id: activeDayHospitalId,
          requester_user_id: userId,
          from_shift_id: shiftId,
          status: 'pendente',
        });

      if (error) throw error;

      toast.success('Plantão anunciado com sucesso!');
      setPassOptionsOpen(false);
      setPassShiftId(null);

      if (hospitals.length) {
        await loadMonthData(hospitals.map(h => h.id), userId, year, month);
      }

      if (selectedDate && activeDayHospitalId) {
        await loadDayTeam(activeDayHospitalId, selectedDate);
      }

      setSelectedDate(null);
      setActiveDayHospitalId(null);
      setSelectedDateTeam([]);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao anunciar troca. Verifique se já não existe um pedido.');
    } finally {
      setProcessingId(null);
    }
  }

  async function loadEligibleDoctorsForDirectedOffer() {
    if (!activeDayHospitalId || !userId) return;

    setLoadingDoctors(true);

    try {
      const currentShift = selectedDateTeam.find((s) => s.id === passShiftId);

if (!currentShift) {
  toast.error('Não foi possível identificar o plantão selecionado.');
  return;
}

const occupiedIds = new Set(
  (selectedDateTeam ?? [])
    .filter((s) => s.period === currentShift.period)
    .map((s) => s.doctor_user_id)
    .filter(Boolean)
);

      const { data, error } = await supabase
        .from('hospital_users')
        .select('user_id, role, users(full_name)')
        .eq('hospital_id', activeDayHospitalId)
        .eq('role', 'doctor');

      if (error) throw error;

      const formatted = (data ?? [])
        .map((row: any) => {
          const user = Array.isArray(row.users) ? row.users[0] : row.users;
          return {
            id: row.user_id as string,
            name: (user?.full_name ?? '').trim() || 'Médico sem nome',
          };
        })
        .filter((row) => row.id !== userId)
        .filter((row) => !occupiedIds.has(row.id))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

      setDoctorOptions(formatted);
      setPassOptionsOpen(false);
      setDirectOfferOpen(true);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar médicos elegíveis.');
    } finally {
      setLoadingDoctors(false);
    }
  }

  async function handleCreateDirectedOffer(targetUserId: string) {
    if (!userId || !activeDayHospitalId || !passShiftId) return;

    setProcessingId(passShiftId);

    try {
      const { error } = await supabase
        .from('shift_swap_requests')
        .insert({
          hospital_id: activeDayHospitalId,
          requester_user_id: userId,
          from_shift_id: passShiftId,
          status: 'pendente',
          target_user_id: targetUserId,
          reason: '__direct_offer__',
        });

      if (error) throw error;

      toast.success('Oferta direcionada enviada!');
      setDirectOfferOpen(false);
      setPassOptionsOpen(false);
      setPassShiftId(null);

      if (hospitals.length) {
        await loadMonthData(hospitals.map(h => h.id), userId, year, month);
      }

      if (selectedDate && activeDayHospitalId) {
        await loadDayTeam(activeDayHospitalId, selectedDate);
      }

      setSelectedDate(null);
      setActiveDayHospitalId(null);
      setSelectedDateTeam([]);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? 'Erro ao enviar oferta direcionada.');
    } finally {
      setProcessingId(null);
    }
  }
async function handleCancelSwapRequest(requestId: number) {
  if (!userId) return;

  const confirmed = window.confirm(
    'Deseja cancelar este anúncio de plantão? Ele deixará de aparecer para outros médicos.'
  );

  if (!confirmed) return;

  setProcessingId(requestId);

  try {
    const { data, error } = await supabase
      .from('shift_swap_requests')
      .update({
        status: 'cancelado',
      })
      .eq('id', requestId)
      .eq('requester_user_id', userId)
      .eq('status', 'pendente')
      .select('id')
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      toast.error('Esse anúncio não pode mais ser cancelado por aqui.');
      return;
    }

    toast.success('Anúncio cancelado com sucesso.');

    if (hospitals.length) {
      await loadMonthData(hospitals.map(h => h.id), userId, year, month);
    }

    if (selectedDate && activeDayHospitalId) {
      await loadDayTeam(activeDayHospitalId, selectedDate);
    }
  } catch (err: any) {
    console.error(err);
    toast.error(err?.message ?? 'Erro ao cancelar anúncio.');
  } finally {
    setProcessingId(null);
  }
}

  // --- INICIALIZAÇÃO ---
  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
        Carregando...
      </div>
    );
  }

  // --- RENDERIZAR DETALHES DO DIA (MODAL) ---
  const renderDayDetails = () => {
    if (!selectedDate) return null;
    
    if (!activeDayHospitalId) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden border border-slate-200">
            <div className="bg-white border-b border-slate-100 px-5 py-4 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Escolha o hospital</h3>
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setActiveDayHospitalId(null);
                  setSelectedDateTeam([]);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition"
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
                    onClick={() => {
                      setActiveDayHospitalId(h.id);
                      loadDayTeam(h.id, selectedDate);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-left hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{h.name}</p>
                        <p className="text-[11px] text-slate-500">Ver detalhes do dia</p>
                      </div>
                      <span className="text-slate-400 text-sm">›</span>
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
    const dateLabel = new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const oppGroup =
      (monthOpportunities[selectedDate] ?? []).find(g => g.hospital_id === activeDayHospitalId);
    const opportunities = oppGroup?.opps ?? [];

    const shiftGroup =
      (monthShifts[selectedDate] ?? []).find(g => g.hospital_id === activeDayHospitalId);
    const myShifts = shiftGroup?.shifts ?? [];
    
    // Agrupamento da equipe por período
    const teamByPeriod: Record<string, FullShiftData[]> = {
      manha: [], tarde: [], noite: [], '24h': [],
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
      { key: '24h', label: '24h', color: 'bg-orange-50 text-orange-800 border-orange-100' },
    ];

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[88vh] border border-slate-200">
          <div className="bg-white border-b border-slate-100 px-5 py-4 flex justify-between items-center shrink-0">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 capitalize truncate">{dateLabel}</h3>
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 truncate mt-1">
                {hospitalNameById[activeDayHospitalId] ?? 'Hospital'}
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedDate(null);
                setActiveDayHospitalId(null);
                setSelectedDateTeam([]);
              }}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-5 overflow-y-auto overscroll-contain">
            {opportunities.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-2">
                  Trocas disponíveis
                </p>

                <div className="space-y-2">
                  {opportunities.map((op) => {
  const directedToMePending = isDirectedToMePending(op, userId);
  const awaitingCoordinationForMe =
    isAwaitingCoordination(op) && op.target_user_id === userId;

  const takenByOther =
    isAwaitingCoordination(op) &&
    !!userId &&
    op.target_user_id !== userId;

  const canAcceptMarketplace = isMarketplaceOpen(op);
  const canAcceptDirected = directedToMePending;
                    return (
                      <div
                        key={op.id}
                        className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm"
                      >
                        <div className="flex justify-between items-start gap-3">
  <div className="min-w-0 flex-1">
    <p className="text-xs text-slate-500">
      Solicitante:{' '}
      <span className="font-medium text-slate-800">
        {op.requester?.full_name ?? 'Colega'}
      </span>
    </p>

    <div className="mt-2 flex items-center gap-2 flex-wrap">
      <div className="inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-700">
        {op.period}
      </div>

      {directedToMePending && (
        <div className="inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
          Oferecido para você
        </div>
      )}

      {awaitingCoordinationForMe && (
        <div className="inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
          Aguardando confirmação
        </div>
      )}

      {takenByOther && (
        <div className="inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
          Já em processo
        </div>
      )}
    </div>

    {awaitingCoordinationForMe && (
      <p className="mt-2 text-[11px] leading-relaxed text-amber-800">
        Você aceitou este plantão. Agora falta a coordenação confirmar.
      </p>
    )}

    {takenByOther && (
      <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
        Outro médico já aceitou este plantão e ele está aguardando confirmação da coordenação.
      </p>
    )}
  </div>

  {awaitingCoordinationForMe ? (
    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-xl font-bold text-center leading-tight shrink-0">
      Aguardando
    </span>
  ) : takenByOther ? (
    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-xl font-bold text-center leading-tight shrink-0">
      Em processo
    </span>
  ) : (canAcceptDirected || canAcceptMarketplace) ? (
    <button
      onClick={() => handleManifestarInteresse(op.id)}
      disabled={!!processingId}
      className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl hover:bg-slate-800 transition disabled:opacity-50 shrink-0"
    >
      {processingId === op.id ? '...' : (canAcceptDirected ? 'Aceitar oferta' : 'Aceitar')}
    </button>
  ) : null}
</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-2 flex justify-between items-center">
                <span>Equipe escalada</span>
                {loadingDayDetails && <span className="text-[9px] font-normal lowercase">carregando...</span>}
              </p>

              {periodsConfig.map((pConf) => {
                const shiftsInPeriod = teamByPeriod[pConf.key] || [];
                if (shiftsInPeriod.length === 0) return null;

                return (
                  <div key={pConf.key} className="mb-3 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    <div className={`text-[10px] font-bold px-3 py-2 uppercase tracking-wide border-b ${pConf.color}`}>
                      {pConf.label}
                    </div>

                    <div className="p-2 flex flex-col gap-1.5">
                      {shiftsInPeriod.map((s) => {
                        const isMe = s.doctor_user_id === userId;
const badgeText = (s.badge ?? '').trim().slice(0, 4).toUpperCase();

const mySwapStatus = isMe
  ? getMyShiftSwapStatus(s.id, mySwapRequests)
  : null;

const shiftEnded = isExpiredShift({
  date: s.date,
  period: s.period,
});

                        return (
                          <div
                            key={s.id}
                            className={`flex items-center justify-between p-2 rounded-xl ${
                              isMe ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className={`text-xs truncate ${isMe ? 'font-bold text-blue-900' : 'text-slate-700'}`}>
                                {s.users?.full_name ?? 'Sem nome'} {isMe && '(Você)'}
                              </span>

                              {badgeText.length > 0 && (
                                <span
                                  className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 rounded-md py-0.5 uppercase shrink-0"
                                  title="Badge"
                                >
                                  {badgeText}
                                </span>
                              )}

                              {s.is_chief && (
                                <span
                                  className="text-[9px] font-bold bg-slate-800 text-white px-1.5 rounded-md py-0.5 shrink-0"
                                  title="Chefe de Plantão"
                                >
                                  CH
                                </span>
                              )}
                            </div>

                            {isMe && mySwapStatus ? (
  <div className="shrink-0 flex flex-col items-end gap-1">
    <span
      className={`text-[10px] px-2.5 py-1 rounded-xl font-bold text-center leading-tight ${
        mySwapStatus.type === 'awaiting_coordination'
          ? 'bg-amber-100 text-amber-700'
          : mySwapStatus.type === 'direct_offer_pending'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-slate-100 text-slate-600'
      }`}
    >
      {mySwapStatus.label}
    </span>

    {mySwapStatus.canCancel && (
      <button
        onClick={() => handleCancelSwapRequest(mySwapStatus.requestId)}
        disabled={processingId === mySwapStatus.requestId}
        className="text-[10px] px-2.5 py-1 rounded-xl border border-red-200 text-red-600 bg-white hover:bg-red-50 transition disabled:opacity-60"
      >
        {processingId === mySwapStatus.requestId ? 'Cancelando...' : 'Cancelar anúncio'}
      </button>
    )}
  </div>
) : isMe ? (
  <button
    onClick={() => openPassOptions(s.id)}
    disabled={!!processingId || shiftEnded}
    className={`shrink-0 text-[10px] px-2.5 py-1 rounded-xl transition ${
      shiftEnded
        ? 'text-slate-400 border border-slate-200 bg-slate-100 cursor-not-allowed'
        : 'text-red-600 border border-red-200 bg-white hover:bg-red-50'
    } disabled:opacity-100`}
    title={shiftEnded ? 'Não é possível passar plantão encerrado' : 'Passar plantão'}
  >
    {processingId === s.id ? '...' : 'Passar'}
  </button>
) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {!loadingDayDetails && selectedDateTeam.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-4 bg-slate-50 rounded-2xl border border-slate-200">
                  Nenhum médico escalado ainda.
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              {hospitals.length > 1 && (
                <button
                  type="button"
                  onClick={handleConsultarOutrosHospitais}
                  className="w-full text-center text-xs border border-slate-200 rounded-2xl py-2.5 bg-white hover:bg-slate-50 text-slate-700 transition"
                >
                  Consultar outros hospitais
                </button>
              )}

              <button
                onClick={() => router.push(`/medico/disponibilidade?date=${selectedDate}&hospitalId=${activeDayHospitalId}`)}
                className="w-full text-center text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-2xl py-2.5 hover:bg-blue-100 transition"
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
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors />
      {renderDayDetails()}

      {passOptionsOpen && passShiftId && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden border border-slate-200">
            <div className="bg-white border-b border-slate-100 px-5 py-4 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.12em]">Passar plantão</p>
                <p className="text-sm font-semibold text-slate-900">Como deseja oferecer?</p>
              </div>
              <button
                onClick={() => {
                  setPassOptionsOpen(false);
                  setDirectOfferOpen(false);
                  setPassShiftId(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              <button
                onClick={() => handlePassarPlantao(passShiftId)}
                className="w-full bg-slate-900 text-white rounded-2xl p-4 text-left hover:bg-slate-800 transition"
              >
                <p className="text-sm font-bold">Anunciar para todos</p>
                <p className="text-[11px] text-slate-300">Abre para qualquer médico elegível</p>
              </button>

              <button
                onClick={loadEligibleDoctorsForDirectedOffer}
                disabled={loadingDoctors}
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-left hover:bg-slate-50 transition disabled:opacity-60"
              >
                <p className="text-sm font-bold text-slate-800">
                  {loadingDoctors ? 'Carregando...' : 'Oferecer para uma pessoa'}
                </p>
                <p className="text-[11px] text-slate-500">Escolhe um médico específico</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {directOfferOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden border border-slate-200">
            <div className="bg-white border-b border-slate-100 px-5 py-4 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.12em]">Oferta direcionada</p>
                <p className="text-sm font-semibold text-slate-900">Escolha o médico</p>
              </div>
              <button
                onClick={() => {
                  setDirectOfferOpen(false);
                  setPassShiftId(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-3 space-y-2 max-h-[65vh] sm:max-h-[60vh] overflow-y-auto overscroll-contain">
              {doctorOptions.length === 0 ? (
                <p className="text-xs text-slate-500 px-2 py-3">Nenhum médico elegível encontrado.</p>
              ) : (
                doctorOptions.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleCreateDirectedOffer(doc.id)}
                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-left hover:bg-slate-50 transition"
                  >
                    <p className="text-sm font-semibold text-slate-800">{doc.name}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-30">
        <div className="w-full max-w-md mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/medico')}
            className="h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition flex items-center justify-center"
          >
            🏠
          </button>

          <div className="text-center min-w-0 px-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-semibold">Todos os hospitais</p>
            <h1 className="text-sm font-semibold text-slate-900 truncate">Meus plantões</h1>
          </div>

          <button
            onClick={() => router.push('/medico/disponibilidade')}
            className="h-10 px-2.5 sm:px-3 rounded-full border border-slate-200 bg-white text-[11px] sm:text-xs font-medium text-slate-700 hover:bg-slate-50 transition shrink-0"
          >
            Disp.
          </button>
        </div>
      </header>

      <main className="w-full max-w-md mx-auto px-3 sm:px-4 py-4 sm:py-5 space-y-4">
        <div className="flex flex-wrap justify-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Disp.
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-medium text-sky-700">
            <span className="text-[9px] font-bold px-1 rounded border bg-blue-100 text-blue-700 border-blue-200">T</span>
            Meus plantões
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-[11px] font-medium text-orange-700">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            Oportunidade
          </div>
        </div>

        <section className="bg-white border border-slate-200 rounded-3xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => handleMonthChange(-1)}
              className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            >
              ◀
            </button>

            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-semibold">Calendário</p>
              <h2 className="text-sm font-semibold capitalize text-slate-900">{monthLabel}</h2>
            </div>

            <button
              onClick={() => handleMonthChange(1)}
              className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            >
              ▶
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 mb-3">
            <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {monthMatrix.map((week, wi) =>
              week.map((day, di) => {
                if (day === null) return <div key={`e-${wi}-${di}`} className="h-[64px] sm:h-[76px]" />;

                const iso = toLocalISO(year, month, day);
                const avRows = monthAvailability[iso] ?? [];
                const shiftGroups = monthShifts[iso] ?? [];
                const oppGroups = monthOpportunities[iso] ?? [];

                const hasAvailability = avRows.length > 0;
                const hasShifts = shiftGroups.some(g => g.shifts.length > 0);
                const hasOpp = oppGroups.some(g => g.opps.length > 0);
                const isToday = iso === toLocalISO(today.getFullYear(), today.getMonth(), today.getDate());

                let bg = 'bg-slate-50';
                let border = 'border-slate-200';

                if (hasShifts) {
                  bg = 'bg-sky-50';
                  border = 'border-sky-200';
                } else if (hasOpp) {
                  bg = 'bg-orange-50';
                  border = 'border-orange-200';
                } else if (hasAvailability) {
                  bg = 'bg-emerald-50';
                  border = 'border-emerald-200';
                }

                return (
                  <button
                    key={`${wi}-${di}`}
                    onClick={() => handleDayClick(iso)}
                    className={`h-[64px] sm:h-[76px] rounded-2xl border flex flex-col items-center justify-between py-2 px-1 relative transition hover:shadow-sm ${bg} ${border} ${isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                  >
                    <span
                      className={`text-xs font-semibold ${
                        hasShifts ? 'text-sky-700' :
                        hasOpp ? 'text-orange-700' :
                        hasAvailability ? 'text-emerald-700' :
                        'text-slate-600'
                      }`}
                    >
                      {day}
                    </span>

                    {(() => {
  const orderedDayShifts = shiftGroups
    .flatMap((g) =>
      g.shifts.map((s) => ({
        hid: g.hospital_id,
        period: s.period,
        badge: s.badge ?? null,
      }))
    )
    .sort((a, b) => {
      const order: Record<'manha' | 'tarde' | 'noite' | '24h', number> = {
        manha: 1,
        tarde: 2,
        noite: 3,
        '24h': 4,
      };
      return order[a.period] - order[b.period];
    })
    .slice(0, 3);

  const firstRow = orderedDayShifts.slice(0, 2);
  const thirdItem = orderedDayShifts[2];

  const renderChip = (
    x: { hid: string; period: 'manha' | 'tarde' | 'noite' | '24h'; badge: string | null },
    i: number
  ) => {
    const pBadge = getPeriodBadge(x.period);
    const hex = getHospitalColor(x.hid, hospitalColorById);

    const label =
      (x.badge ?? '').trim()
        ? (x.badge ?? '').trim().slice(0, 4).toUpperCase()
        : pBadge.label;

    return (
      <span
        key={`${x.hid}-${x.period}-${i}`}
        title={hospitalNameById[x.hid] ?? 'Hospital'}
        className="shrink-0 text-[6px] sm:text-[8px] leading-none font-bold px-[2px] py-[1px] rounded-md border min-w-[12px] sm:min-w-[14px] text-center"
        style={{
          backgroundColor: hexToRgba(hex, 0.14),
          borderColor: hexToRgba(hex, 0.35),
          color: hex,
        }}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-[22px] sm:min-h-[28px] flex flex-col items-center justify-center gap-[2px] px-0 overflow-hidden">
      <div className="flex items-center justify-center gap-[2px] sm:gap-1">
        {firstRow.map((x, i) => renderChip(x, i))}
      </div>

      {thirdItem && (
        <div className="flex items-center justify-center">
          {renderChip(thirdItem, 2)}
        </div>
      )}
    </div>
  );
})()}

                    <div className="flex items-center gap-1 h-2">
                      {hasOpp && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                      {hasAvailability && !hasShifts && !hasOpp && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {hospitals.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-3 sm:p-4 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-3">Hospitais</p>
            <div className="flex flex-wrap gap-2">
              {[...hospitals]
                .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }))
                .map((h) => {
                  const hex = getHospitalColor(h.id, hospitalColorById);
                  return (
                    <div
                      key={h.id}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border"
                        style={{
                          backgroundColor: hexToRgba(hex, 0.9),
                          borderColor: hexToRgba(hex, 0.4),
                        }}
                      />
                      <span className="text-[10px] sm:text-[11px] font-medium text-slate-700">{h.name}</span>
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