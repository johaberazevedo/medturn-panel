'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type MembershipRow = {
  hospital_id: string;
  hospitals: {
    name: string | null;
  } | null;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
};

type DoctorOption = {
  user_id: string;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
};

type AvailabilityNotification = {
  hospital_id: string;
  user_id: string;
  date: string;
  period: 'manha' | 'tarde' | 'noite';
  created_at: string;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
};

type ShiftSwapNotification = {
  id: number;
  hospital_id: string;
  requester_user_id: string;
  from_shift_id: number;
  target_user_id: string | null;
  reason: string | null;
  status: string;
  created_at: string;
  requester?: {
    full_name: string | null;
    email: string | null;
  } | null;
  target?: {
    full_name: string | null;
    email: string | null;
  } | null;
  shift?: {
    date: string;
    period: 'manha' | 'tarde' | 'noite' | '24h';
    doctor_user_id: string | null;
    doctor?: {
      full_name: string | null;
      email: string | null;
    } | null;
  } | null;
};

type OtherHospitalAlert = {
  hospital_id: string;
  hospital_name: string;
  awaiting_confirmation_count: number;
};

type DailyShiftRow = {
  id: number;
  date: string;
  period: 'manha' | 'tarde' | 'noite' | '24h';
  doctor_user_id: string | null;
  is_chief: boolean;
  badge: string | null;
  doctor?: {
    full_name: string | null;
    email: string | null;
  } | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('Hospital');
  const [adminName, setAdminName] = useState<string>('Administrador');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<AvailabilityNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const [swapRequests, setSwapRequests] = useState<ShiftSwapNotification[]>([]);
  const [swapLoading, setSwapLoading] = useState(false);

  const [otherHospitalAlerts, setOtherHospitalAlerts] = useState<OtherHospitalAlert[]>([]);
const [otherAlertsLoading, setOtherAlertsLoading] = useState(false);

const [conflictCount, setConflictCount] = useState(0);
const [conflictTargetMonth, setConflictTargetMonth] = useState<number | null>(null);
const [conflictTargetYear, setConflictTargetYear] = useState<number | null>(null);

const [showDailyMessageModal, setShowDailyMessageModal] = useState(false);
const [dailyMessageDate, setDailyMessageDate] = useState(() => getTomorrowYMD());
const [dailyMessageLoading, setDailyMessageLoading] = useState(false);
const [dailyMessageText, setDailyMessageText] = useState('');

// 📣 Comunicação admin
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [sendMode, setSendMode] = useState<'all' | 'single'>('single');
  const [targetUserId, setTargetUserId] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // ✅ CORREÇÃO DE DATA: Garante que o fuso horário não altere o dia
function formatDateBR(dateStr: string, shortWeekday = true) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  
  if (Number.isNaN(d.getTime())) return dateStr;
  
  return d.toLocaleDateString('pt-BR', { 
    weekday: shortWeekday ? 'short' : 'long', 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
}

  function formatDateTimeBR(dateStr: string) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
    
  function periodLabel(p: 'manha' | 'tarde' | 'noite' | '24h') {
    switch (p) {
      case 'manha': return 'Manhã';
      case 'tarde': return 'Tarde';
      case 'noite': return 'Noite';
      case '24h': return '24h';
      default: return p;
    }
  }

  function periodChipClass(p: 'manha' | 'tarde' | 'noite') {
    if (p === 'manha') return 'bg-green-50 text-green-700 border-green-200';
    if (p === 'tarde') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-purple-50 text-purple-700 border-purple-200';
  }

  function statusLabel(status: string) {
    switch (status) {
      case 'approved': case 'aprovado': return 'Aprovado';
      case 'rejected': case 'rejeitado': case 'recusado': return 'Recusado';
      default: return 'Pendente';
    }
  }

    function statusChipClass(status: string) {
  switch (status) {
    case 'approved': case 'aprovado': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'rejected': case 'rejeitado': case 'recusado': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-amber-50 text-amber-700 border-amber-200';
  }
}

// 👇 COLE AQUI
function isDirectOfferPending(r: ShiftSwapNotification) {
  return r.reason === '__direct_offer__';
}

function isDirectOfferAccepted(r: ShiftSwapNotification) {
  return r.reason === '__direct_offer__accepted';
}

function isAvailabilityAccepted(r: ShiftSwapNotification) {
  return r.reason === '__offer_via_disponibilidade__';
}

function isPendingStatus(status: string) {
  return status === 'pendente' || status === 'pending';
}

function isMarketplaceOpen(r: ShiftSwapNotification) {
  return (
    isPendingStatus(r.status) &&
    !r.target_user_id &&
    r.reason !== '__offer_via_disponibilidade__'
  );
}

function isMarketplaceAccepted(r: ShiftSwapNotification) {
  return (
    isPendingStatus(r.status) &&
    !!r.target_user_id &&
    r.reason !== '__direct_offer__' &&
    r.reason !== '__direct_offer__accepted' &&
    r.reason !== '__offer_via_disponibilidade__'
  );
}

function isAwaitingCoordination(r: ShiftSwapNotification) {
  return (
    isPendingStatus(r.status) &&
    !!r.target_user_id &&
    (
      isMarketplaceAccepted(r) ||
      isDirectOfferAccepted(r) ||
      isAvailabilityAccepted(r)
    )
  );
}

function visualStatusLabel(r: ShiftSwapNotification) {
  if (isDirectOfferPending(r)) return 'Oferta direcionada';
  if (isAwaitingCoordination(r)) return 'Em processo';
  return statusLabel(r.status);
}

function visualStatusChipClass(r: ShiftSwapNotification) {
  if (isDirectOfferPending(r)) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (isAwaitingCoordination(r)) return 'bg-sky-50 text-sky-700 border-sky-200';
  return statusChipClass(r.status);
}

function getTomorrowYMD() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(
    tomorrow.getDate()
  ).padStart(2, '0')}`;
}

function getDoctorDisplayName(row: DailyShiftRow) {
  return row.doctor?.full_name ?? row.doctor?.email ?? 'Médico não informado';
}

function isShiftChief(row: DailyShiftRow) {
  if (row.is_chief === true) return true;

  const badge = row.badge?.toLowerCase().trim() ?? '';

  return (
    badge.includes('chefe') ||
    badge.includes('coord') ||
    badge.includes('coordenador') ||
    badge === 'ch'
  );
}

function buildDailyShiftMessage(rows: DailyShiftRow[], date: string, hospital: string) {
  const grouped: Record<'manha' | 'tarde' | 'noite' | '24h', DailyShiftRow[]> = {
    manha: [],
    tarde: [],
    noite: [],
    '24h': [],
  };

  for (const row of rows) {
    grouped[row.period]?.push(row);
  }

  const sortChiefFirst = (items: DailyShiftRow[]) => {
    return [...items].sort((a, b) => {
      const aChief = isShiftChief(a);
      const bChief = isShiftChief(b);

      if (aChief && !bChief) return -1;
      if (!aChief && bChief) return 1;

      return getDoctorDisplayName(a).localeCompare(getDoctorDisplayName(b), 'pt-BR', {
        sensitivity: 'base',
      });
    });
  };

  const doctorLine = (item: DailyShiftRow) => {
    const name = getDoctorDisplayName(item);
    const labels: string[] = [];

    if (isShiftChief(item)) {
      labels.push('Chefe de plantão');
    }

    const badge = item.badge?.trim();

    if (badge) {
      labels.push(badge.toUpperCase());
    }

    if (labels.length === 0) {
      return `• ${name}`;
    }

    return `• ${name} - ${labels.join(' - ')}`;
  };

  const section = (title: string, items: DailyShiftRow[]) => {
    if (items.length === 0) {
      return `${title}\n• Sem plantonista cadastrado`;
    }

    const sortedItems = sortChiefFirst(items);

    return `${title}\n${sortedItems.map(doctorLine).join('\n')}`;
  };

return [
  `${formatDateBR(date, false).replace(/^./, (c) => c.toUpperCase())}:`,
  `🏥 ${hospital}`,
  '',
  section('*Manhã*', grouped.manha),
  '',
  section('*Tarde*', grouped.tarde),
  '',
  section('*Noite*', grouped.noite),
  grouped['24h'].length > 0 ? '' : null,
  grouped['24h'].length > 0 ? section('*24h*', grouped['24h']) : null,
  '',
  'Em caso de inconsistências, favor comunicar a coordenação.',
]
  .filter(Boolean)
  .join('\n');
}

const loadDoctors = useCallback(async (hId: string) => {
  const { data, error } = await supabase
    .from('hospital_users')
    .select('user_id, role, users(full_name, email)')
    .eq('hospital_id', hId)
    .in('role', ['doctor', 'admin']);

  if (error) {
    console.error('Erro ao carregar destinatários:', error);
    return;
  }

  if (data) {
    const formatted = data.map((item: any) => ({
      user_id: item.user_id,
      users: Array.isArray(item.users) ? item.users[0] : item.users,
    }));

    const unique = Array.from(
      new Map(formatted.map((item) => [item.user_id, item])).values()
    );

    setDoctorOptions(unique as DoctorOption[]);
  }
}, []);

  const loadOtherHospitalAlerts = useCallback(
    async (currentHospitalId: string, currentUserId: string) => {
      setOtherAlertsLoading(true);

      try {
        const { data: memberships, error: membershipsError } = await supabase
          .from('hospital_users')
          .select('hospital_id, role, is_admin, hospitals(name)')
          .eq('user_id', currentUserId);

        if (membershipsError) {
          console.error('Erro ao carregar hospitais do admin:', membershipsError);
          return;
        }

        const adminHospitals = (memberships ?? []).filter((m: any) => {
          const isAllowed =
            m?.is_admin === true ||
            m?.role === 'admin' ||
            m?.role === 'coordenador';

          return isAllowed && m.hospital_id !== currentHospitalId;
        });

        if (adminHospitals.length === 0) {
          setOtherHospitalAlerts([]);
          return;
        }

        const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const dateLimit = thirtyDaysAgo.toISOString().split('T')[0];

        const alerts: OtherHospitalAlert[] = [];

        for (const hosp of adminHospitals) {
  const otherHospitalId = hosp.hospital_id;

  const hospitalRel = hosp.hospitals as
    | { name: string | null }
    | { name: string | null }[]
    | null
    | undefined;

  const otherHospitalName = Array.isArray(hospitalRel)
    ? hospitalRel[0]?.name
    : hospitalRel?.name;

  const { data: awaitingRows, error: awaitingError } = await supabase
  .from('shift_swap_requests')
  .select(`
    id,
    status,
    reason,
    target_user_id,
    shift:from_shift_id!inner(date)
  `)
  .eq('hospital_id', otherHospitalId)
  .eq('status', 'pendente')
  .not('target_user_id', 'is', null)
  .gte('shift.date', dateLimit);

if (awaitingError) {
  console.error('Erro ao contar trocas aguardando confirmação:', awaitingError);
  continue;
}

const awaitingConfirmationCount = (awaitingRows ?? []).filter((row: any) => {
  const marketplaceAccepted =
  row.status === 'pendente' &&
  !!row.target_user_id &&
  row.reason !== '__direct_offer__' &&
  row.reason !== '__direct_offer__accepted' &&
  row.reason !== '__offer_via_disponibilidade__';

return (
  marketplaceAccepted ||
  row.reason === '__direct_offer__accepted' ||
  row.reason === '__offer_via_disponibilidade__'
);
}).length;

const c = awaitingConfirmationCount;

if (c > 0) {
  alerts.push({
    hospital_id: otherHospitalId,
    hospital_name: otherHospitalName ?? 'Hospital',
    awaiting_confirmation_count: c,
  });
}
}

alerts.sort((a, b) => {
  if (a.awaiting_confirmation_count !== b.awaiting_confirmation_count) {
    return b.awaiting_confirmation_count - a.awaiting_confirmation_count;
  }
  return a.hospital_name.localeCompare(b.hospital_name, 'pt-BR', {
    sensitivity: 'base',
  });
});

        setOtherHospitalAlerts(alerts);
      } catch (e) {
        console.error('Erro ao carregar alertas de outros hospitais:', e);
      } finally {
        setOtherAlertsLoading(false);
      }
    },
    []
  );

const loadConflictCount = useCallback(async (currentUserId: string) => {
  try {
    const { data: memberships, error: membershipsError } = await supabase
      .from('hospital_users')
      .select('hospital_id, role, is_admin')
      .eq('user_id', currentUserId);

    if (membershipsError) {
      console.error('Erro ao carregar hospitais para conflitos:', membershipsError);
      setConflictCount(0);
      setConflictTargetMonth(null);
      setConflictTargetYear(null);
      return;
    }

    const adminHospitalIds = (memberships ?? [])
      .filter((m: any) => {
        return m?.is_admin === true || m?.role === 'admin' || m?.role === 'coordenador';
      })
      .map((m: any) => m.hospital_id);

    if (adminHospitalIds.length === 0) {
      setConflictCount(0);
      setConflictTargetMonth(null);
      setConflictTargetYear(null);
      return;
    }

    const today = new Date();
    const nextMonthYear = today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear();
    const nextMonth = today.getMonth() === 11 ? 1 : today.getMonth() + 2;

    const startDate = `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const nextNextMonthDate =
      nextMonth === 12
        ? new Date(nextMonthYear + 1, 0, 1)
        : new Date(nextMonthYear, nextMonth, 1);

    const endDate = `${nextNextMonthDate.getFullYear()}-${String(nextNextMonthDate.getMonth() + 1).padStart(2, '0')}-01`;

    const { data: shiftRows, error: shiftError } = await supabase
      .from('shifts')
      .select(`
        hospital_id,
        date,
        period,
        doctor_user_id
      `)
      .in('hospital_id', adminHospitalIds)
      .gte('date', startDate)
      .lt('date', endDate)
      .not('doctor_user_id', 'is', null)
      .in('period', ['manha', 'tarde', 'noite']);

    if (shiftError) {
      console.error('Erro ao carregar shifts para conflitos:', shiftError);
      setConflictCount(0);
      setConflictTargetMonth(null);
      setConflictTargetYear(null);
      return;
    }

    const grouped = new Map<string, Set<string>>();

    for (const row of shiftRows ?? []) {
      const doctorId = (row as any).doctor_user_id;
      const date = (row as any).date;
      const period = (row as any).period;
      const hospitalId = (row as any).hospital_id;

      if (!doctorId || !date || !period || !hospitalId) continue;

      const key = `${doctorId}__${date}__${period}`;

      if (!grouped.has(key)) {
        grouped.set(key, new Set<string>());
      }

      grouped.get(key)!.add(hospitalId);
    }

    let totalConflicts = 0;

    for (const [, hospitalSet] of grouped) {
      if (hospitalSet.size > 1) {
        totalConflicts += 1;
      }
    }

    setConflictCount(totalConflicts);

    if (totalConflicts > 0) {
      setConflictTargetMonth(nextMonth);
      setConflictTargetYear(nextMonthYear);
    } else {
      setConflictTargetMonth(null);
      setConflictTargetYear(null);
    }
  } catch (e) {
    console.error('Erro ao calcular conflitos do próximo mês:', e);
    setConflictCount(0);
    setConflictTargetMonth(null);
    setConflictTargetYear(null);
  }
}, []);

  const loadAvailabilityData = useCallback(async (hId: string) => {
  setNotifLoading(true);
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString();

    const { data, error } = await supabase
      .from('availability')
      .select('hospital_id, user_id, date, period, created_at, users(full_name, email)')
      .eq('hospital_id', hId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error) {
      const formattedData = (data ?? []).map((item: any) => ({
        ...item,
        users: Array.isArray(item.users) ? item.users[0] : item.users,
      }));
      setNotifications(formattedData as AvailabilityNotification[]);
    }
  } catch (e) {
    console.error(e);
  } finally {
    setNotifLoading(false);
  }
}, []);

const loadSwapRequests = useCallback(async (hId: string) => {
  setSwapLoading(true);
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateLimit = thirtyDaysAgo.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('shift_swap_requests')
      .select(`
        id, hospital_id, requester_user_id, from_shift_id, target_user_id, reason, status, created_at,
        requester:requester_user_id(full_name, email),
        target:target_user_id(full_name, email),
        shift:from_shift_id!inner(date, period, doctor_user_id, doctor:doctor_user_id(full_name, email))
      `)
      .eq('hospital_id', hId)
      .eq('status', 'pendente')
      .gte('shift.date', dateLimit)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error) {
      const formattedSwaps = (data ?? []).map((item: any) => {
        let shiftObj = Array.isArray(item.shift) ? item.shift[0] : item.shift;
        if (shiftObj && Array.isArray(shiftObj.doctor)) {
          shiftObj = { ...shiftObj, doctor: shiftObj.doctor[0] };
        }

        return {
          ...item,
          requester: Array.isArray(item.requester) ? item.requester[0] : item.requester,
          target: Array.isArray(item.target) ? item.target[0] : item.target,
          shift: shiftObj,
        };
      });

      const sortedSwaps = formattedSwaps.sort((a, b) => {
  const aAwaiting = isAwaitingCoordination(a);
  const bAwaiting = isAwaitingCoordination(b);

  if (aAwaiting && !bAwaiting) return -1;
  if (!aAwaiting && bAwaiting) return 1;

  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
});

      setSwapRequests(sortedSwaps as ShiftSwapNotification[]);
    }
  } catch (e) {
    console.error(e);
  } finally {
    setSwapLoading(false);
  }
}, []);

const generateDailyShiftMessage = useCallback(
  async (date?: string) => {
    const targetDate = date ?? dailyMessageDate;

    if (!hospitalId) {
      alert('Hospital não identificado.');
      return;
    }

    if (!targetDate) {
      alert('Selecione uma data.');
      return;
    }

    setDailyMessageLoading(true);

    try {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          id,
          date,
          period,
          doctor_user_id,
          is_chief,
          badge,
          doctor:doctor_user_id(full_name, email)
        `)
        .eq('hospital_id', hospitalId)
        .eq('date', targetDate)
        .in('period', ['manha', 'tarde', 'noite', '24h'])
        .order('period', { ascending: true });

      if (error) {
        console.error('Erro ao carregar escala do dia:', error);
        alert('Não foi possível carregar a escala do dia.');
        return;
      }

      const formattedRows = (data ?? []).map((item: any) => ({
        ...item,
        doctor: Array.isArray(item.doctor) ? item.doctor[0] : item.doctor,
      }));

      const message = buildDailyShiftMessage(formattedRows as DailyShiftRow[], targetDate, hospitalName);
      setDailyMessageText(message);
    } catch (e) {
      console.error('Erro ao gerar mensagem diária:', e);
      alert('Erro ao gerar mensagem diária.');
    } finally {
      setDailyMessageLoading(false);
    }
  },
  [dailyMessageDate, hospitalId, hospitalName]
);

useEffect(() => {
  async function init() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    // 1) tenta pegar hospital já selecionado
    const storedHospitalId =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(`activeHospitalId:${user.id}`)
        : null;

    if (!storedHospitalId) {
      setLoading(false);
      router.push('/selecionar-hospital');
      return;
    }

    // 2) 🔒 BLOQUEIO: só admin/coordenador do hospital pode ver dashboard
    const { data: membership, error: memErr } = await supabase
      .from('hospital_users')
      .select('role, is_admin')
      .eq('user_id', user.id)
      .eq('hospital_id', storedHospitalId)
      .maybeSingle();

    if (memErr) {
      console.error('Erro ao checar role:', memErr);
      setLoading(false);
      router.replace('/medico');
      return;
    }

    const isAllowed =
      membership?.is_admin === true ||
      membership?.role === 'admin' ||
      membership?.role === 'coordenador';

    if (!isAllowed) {
      setLoading(false);
      router.replace('/medico');
      return;
    }

    // 3) carrega hospital pelo ID selecionado
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

    // 4) carrega nome do usuário logado
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    // 5) aplica
    setHospitalId(hosp.id);
    setHospitalName(hosp.name ?? 'Hospital');
    setAdminName(profile?.full_name ?? profile?.email ?? user.email ?? 'Administrador');

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`activeHospitalId:${user.id}`, hosp.id);
    }

            await Promise.all([
  loadAvailabilityData(hosp.id),
  loadSwapRequests(hosp.id),
  loadDoctors(hosp.id),
]);

setLoading(false);

void loadOtherHospitalAlerts(hosp.id, user.id);
void loadConflictCount(user.id);
  }
  init();
}, [
  router,
  loadAvailabilityData,
  loadSwapRequests,
  loadDoctors,
  loadOtherHospitalAlerts,
  loadConflictCount,
]);

  useEffect(() => {
  if (!hospitalId) return;

  const channel = supabase
    .channel(`dashboard-changes-${hospitalId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'availability',
        filter: `hospital_id=eq.${hospitalId}`,
      },
      () => {
        void loadAvailabilityData(hospitalId);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shift_swap_requests',
        filter: `hospital_id=eq.${hospitalId}`,
      },
      () => {
        void loadSwapRequests(hospitalId);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [hospitalId, loadAvailabilityData, loadSwapRequests]);

  async function copyDailyShiftMessage() {
    if (!dailyMessageText.trim()) {
      alert('Gere a mensagem primeiro.');
      return;
    }

    try {
      await navigator.clipboard.writeText(dailyMessageText);
      alert('Mensagem copiada!');
    } catch (e) {
      console.error('Erro ao copiar mensagem:', e);
      alert('Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.');
    }
  }

  async function sendAdminMessage() {
    if (!messageTitle.trim() || !messageBody.trim()) {
      alert('Preencha título e mensagem.');
      return;
    }

    if (sendMode === 'single' && !targetUserId) {
      alert('Selecione um médico.');
      return;
    }

    setSendingMessage(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch('/api/admin/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          hospitalId,
          title: messageTitle,
          message: messageBody,
          mode: sendMode,
          targetUserId: sendMode === 'single' ? targetUserId : undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? 'Erro ao enviar aviso.');
      }

            alert(`Sucesso! Enviado para ${json.sent} usuário(s).`);

      setMessageTitle('');
      setMessageBody('');
      setTargetUserId('');
      setSendMode('single');
      setShowMessageModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingMessage(false);
    }
  }

  async function openHospitalDashboard(targetHospitalId: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`activeHospitalId:${user.id}`, targetHospitalId);
      window.location.href = '/dashboard';
      return;
    }

    router.push('/dashboard');
  } catch (e) {
    console.error('Erro ao trocar hospital ativo:', e);
    alert('Não foi possível abrir o hospital selecionado.');
  }
}

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-600">Carregando painel...</p>
      </div>
    );
  }

  if (!hospitalId) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white border rounded-xl px-4 py-3 text-sm">
          Erro: Hospital não identificado.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase text-slate-500">Painel do hospital</p>
            <h1 className="text-xl font-semibold">{hospitalName}</h1>
            <p className="text-[11px] text-slate-500">Logado como: {adminName}</p>
          </div>
                   <div className="flex gap-2">
            <button
              onClick={() => setShowMessageModal(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Enviar aviso
            </button>

            <button 
              onClick={() => router.push('/escala')} 
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Ver escala mensal
            </button>

            {/* 🙈 CHECK-IN OCULTO POR ENQUANTO
            <button
              onClick={() => router.push('/checkin')}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Check-in
            </button>
            */}

            <button
  onClick={() => {
  if (conflictTargetMonth && conflictTargetYear) {
    router.push(`/conflitos?month=${conflictTargetMonth}&year=${conflictTargetYear}`);
    return;
  }

  router.push('/conflitos');
}}
  className={`text-xs px-3 py-1.5 rounded-lg border hover:bg-slate-50 flex items-center gap-2 ${
    conflictCount > 0
      ? 'border-amber-300 bg-amber-50 text-amber-800'
      : 'border-slate-300'
  }`}
>
  <span>Ver conflitos</span>
  {conflictCount > 0 && (
    <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
      {conflictCount}
    </span>
  )}
</button>

<button 
  onClick={() => router.push('/medicos')} 
  className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
>
  Gerenciar médicos
</button>

            <button
              onClick={() => router.push('/relatorio')}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Relatório de pagamento
            </button>

<button
  onClick={() => router.push('/dashboard/trocas-log')}
  className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
>
  Histórico de trocas
</button>

            <button
              onClick={() => router.push('/selecionar-hospital')}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Trocar hospital
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
  <button 
    onClick={() => router.push('/escala')} 
    className="bg-white border rounded-xl p-4 text-left hover:shadow-sm transition-shadow"
  >
    <h2 className="text-sm font-semibold mb-1">Escala mensal</h2>
    <p className="text-[11px] text-slate-500">Visualize e edite a escala de plantões.</p>
  </button>

  <button
    onClick={() => {
      setShowDailyMessageModal(true);
      void generateDailyShiftMessage(dailyMessageDate);
    }}
    className="bg-white border rounded-xl p-4 text-left hover:shadow-sm transition-shadow"
  >
    <h2 className="text-sm font-semibold mb-1">Mensagem do plantão</h2>
    <p className="text-[11px] text-slate-500">
      Gere a mensagem diária dos plantonistas por turno.
    </p>
  </button>

  <button
    onClick={() => router.push('/relatorio')}
    className="bg-white border rounded-xl p-4 text-left hover:shadow-sm transition-shadow"
  >
    <h2 className="text-sm font-semibold mb-1">Relatório de pagamento</h2>
    <p className="text-[11px] text-slate-500">Calcule turnos do mês e gerencie feriados.</p>
  </button>

  <button
    onClick={() => router.push('/dashboard/trocas-log')}
    className="bg-white border rounded-xl p-4 text-left hover:shadow-sm transition-shadow"
  >
    <h2 className="text-sm font-semibold mb-1">Histórico de trocas</h2>
    <p className="text-[11px] text-slate-500">
      Consulte trocas realizadas, pendentes e não realizadas por mês.
    </p>
  </button>
</div>

                  

            <div className="bg-white border rounded-xl p-4">
               <h2 className="text-sm font-semibold mb-2">Próximos passos</h2>
               <ul className="text-[11px] text-slate-600 list-disc ml-4 space-y-1">
                 <li>Use a página <strong>Escala mensal</strong> para organizar quem está em cada plantão.</li>
                 <li>Peça para os médicos manterem a <strong>disponibilidade atualizada</strong> no app.</li>
                 <li>Acompanhe o <strong>Relatório de pagamento</strong> para o fechamento do mês.</li>
                 <li>Use as <strong>notificações</strong> ao lado para montar a escala mais rápido.</li>
                 <li>Use a <strong>Mensagem do plantão</strong> para gerar o texto diário sem digitar nomes manualmente.</li>
               </ul>
            </div>
          </section>

          <section className="space-y-3">
  <div className="bg-white border rounded-xl p-4">
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-sm font-semibold">Disponibilidades e solicitações</h2>
      <button
        onClick={() => {
          void loadAvailabilityData(hospitalId!);
          void loadSwapRequests(hospitalId!);
        }}
        className="text-[10px] text-slate-500 hover:text-slate-800"
      >
        Atualizar
      </button>
    </div>

    <p className="text-[11px] text-slate-500 mb-1">Últimos anúncios de disponibilidade (30 dias).</p>
    {notifLoading && <p className="text-[11px] text-slate-500 mb-2">Carregando...</p>}

    {!notifLoading && notifications.length === 0 && (
      <p className="text-[11px] text-slate-400 mb-2">Nenhum anúncio recente.</p>
    )}

    {!notifLoading && notifications.length > 0 && (
      <ul className="space-y-2 max-h-64 overflow-auto pr-1 mb-4">
        {notifications.map((n) => (
          <li
            key={`${n.user_id}-${n.date}-${n.period}-${n.created_at}`}
            className="border rounded-lg px-2.5 py-2 text-[11px] flex flex-col gap-1 bg-slate-50"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium truncate">
                {n.users?.full_name ?? n.users?.email ?? 'Médico'}
              </span>
              <span className="text-[10px] text-slate-500">{formatDateTimeBR(n.created_at)}</span>
            </div>

            <div className="flex justify-between items-center mt-1">
              <span className="text-slate-600">
                Disp. para <strong>{formatDateBR(n.date)}</strong>
              </span>
            </div>

            <div className="flex justify-between items-center mt-1">
              <span className={'px-2 py-0.5 rounded-full border text-[10px] ' + periodChipClass(n.period)}>
                {periodLabel(n.period)}
              </span>
              <button
                onClick={() => router.push(`/escala/editar?date=${n.date}`)}
                className="text-[10px] text-slate-600 underline"
              >
                Ir para escala
              </button>
            </div>
          </li>
        ))}
      </ul>
    )}

    <h3 className="text-[11px] font-semibold text-slate-700 mt-2 mb-1">Solicitações de troca</h3>
    {swapLoading && <p className="text-[11px] text-slate-500">Carregando...</p>}
    {!swapLoading && swapRequests.length === 0 && (
      <p className="text-[11px] text-slate-400">Nenhuma solicitação pendente.</p>
    )}

    {!swapLoading && swapRequests.length > 0 && (
      <ul className="space-y-2 max-h-64 overflow-auto pr-1">
        {swapRequests.map((r) => (
          <li
            key={r.id}
            className={`border rounded-lg px-2.5 py-2 text-[11px] flex flex-col gap-1 bg-slate-50 transition-all ${
  isAwaitingCoordination(r)
    ? 'border-emerald-400 shadow-sm shadow-emerald-100'
    : isDirectOfferPending(r)
    ? 'border-blue-300 shadow-sm shadow-blue-50'
    : ''
}`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium truncate">{r.requester?.full_name ?? 'Médico'}</span>
              <span className={'px-2 py-0.5 rounded-full border text-[10px] ' + visualStatusChipClass(r)}>
  {visualStatusLabel(r)}
</span>
            </div>

            <div className="text-slate-600 mt-1">
  {isAwaitingCoordination(r) ? (
    <p>
      <span className="text-emerald-600 font-bold">
        ● {(r.target?.full_name ?? r.target?.email ?? 'Alguém').split(' ')[0]} aceitou
      </span>{' '}
      a troca de {(r.requester?.full_name ?? r.requester?.email ?? 'Médico').split(' ')[0]} —{' '}
      <span className="text-[10px] text-slate-500">clique para confirmar</span>
    </p>
  ) : isDirectOfferPending(r) ? (
    <p>
      <span className="text-blue-700 font-bold">
        ● Oferta direcionada enviada para {(r.target?.full_name ?? r.target?.email ?? 'Médico').split(' ')[0]}
      </span>{' '}
      <span className="text-[10px] text-slate-500">aguardando aceite do médico</span>
    </p>
  ) : (
    <p>
      Solicitação de cobertura:{' '}
      <strong>{r.requester?.full_name ?? r.requester?.email ?? 'Médico'}</strong>
    </p>
  )}

  <div className="text-[10px] text-slate-400 mt-1">
    📅 {formatDateBR(r.shift?.date ?? '')} • {periodLabel((r.shift?.period ?? 'manha') as any)}
  </div>
</div>

            <div className="flex justify-end mt-1">
              <button
                onClick={() => router.push(`/solicitacoes/${r.id}`)}
                className="text-[10px] text-slate-600 underline"
              >
                Ver detalhes
              </button>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>

  <div className="bg-white border rounded-xl p-4">
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-sm font-semibold">Pendências em outros hospitais</h2>
    </div>

    <p className="text-[11px] text-slate-500 mb-2">
      Mostra trocas já aceitas por outro médico e que ainda aguardam sua confirmação.
    </p>

    {otherAlertsLoading && (
      <p className="text-[11px] text-slate-500">Carregando...</p>
    )}

    {!otherAlertsLoading && otherHospitalAlerts.length === 0 && (
      <p className="text-[11px] text-slate-400">
        Nenhuma pendência encontrada nos outros hospitais.
      </p>
    )}

    {!otherAlertsLoading && otherHospitalAlerts.length > 0 && (
      <ul className="space-y-2">
        {otherHospitalAlerts.map((item) => (
          <li
            key={item.hospital_id}
            className="border border-emerald-300 rounded-lg px-3 py-2 text-[11px] bg-slate-50"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">{item.hospital_name}</p>
                <div className="mt-1 text-slate-600">
                  <p className="font-semibold text-emerald-700">
                    {item.awaiting_confirmation_count} aguardando confirmação
                  </p>
                </div>
              </div>

              <button
                onClick={() => openHospitalDashboard(item.hospital_id)}
                className="text-[10px] text-slate-600 underline whitespace-nowrap"
              >
                Abrir hospital
              </button>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
</section>
        </div>
           </main>

      {showDailyMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold">Mensagem do plantão</h2>
                <p className="text-[11px] text-slate-500">
                  Gere automaticamente a mensagem diária com os plantonistas separados por turno.
                </p>
              </div>

              <button
                onClick={() => setShowDailyMessageModal(false)}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-3 px-5 py-4">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                <input
                  type="date"
                  value={dailyMessageDate}
                  onChange={(e) => {
                    setDailyMessageDate(e.target.value);
                    void generateDailyShiftMessage(e.target.value);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />

                <button
                  onClick={() => generateDailyShiftMessage()}
                  disabled={dailyMessageLoading}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-60"
                >
                  {dailyMessageLoading ? 'Gerando...' : 'Gerar mensagem'}
                </button>
              </div>

              <textarea
                value={dailyMessageText}
                onChange={(e) => setDailyMessageText(e.target.value)}
                rows={14}
                placeholder="A mensagem gerada aparecerá aqui..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none"
              />

              <p className="text-[11px] text-slate-500">
                A mensagem é editável antes de copiar. Confira rapidamente e envie no grupo da equipe.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t px-5 py-4">
              <button
                onClick={() => setShowDailyMessageModal(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                onClick={copyDailyShiftMessage}
                disabled={!dailyMessageText.trim()}
                className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-white hover:bg-slate-800 disabled:opacity-60"
              >
                Copiar mensagem
              </button>
            </div>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold">Enviar aviso</h2>
                <p className="text-[11px] text-slate-500">
                  Envie um aviso para um usuário específico ou para todos os usuários do hospital.
                </p>
              </div>

              <button
                onClick={() => setShowMessageModal(false)}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-3 px-5 py-4">
              <input
                type="text"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="Título do aviso"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />

              <textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Mensagem"
                rows={5}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none"
              />

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
  <select
    value={sendMode}
    onChange={(e) => setSendMode(e.target.value as 'all' | 'single')}
    className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
  >
    <option value="single">Enviar para um usuário</option>
    <option value="all">Enviar para todos do hospital</option>
  </select>

  {sendMode === 'single' && (
    <select
      value={targetUserId}
      onChange={(e) => setTargetUserId(e.target.value)}
      className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
    >
      <option value="">Selecione um usuário</option>
      {doctorOptions.map((doc) => (
        <option key={doc.user_id} value={doc.user_id}>
          {doc.users?.full_name ?? doc.users?.email ?? doc.user_id}
        </option>
      ))}
    </select>
  )}
</div>
            </div>

            <div className="flex justify-end gap-2 border-t px-5 py-4">
              <button
                onClick={() => setShowMessageModal(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                onClick={sendAdminMessage}
                disabled={sendingMessage}
                className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {sendingMessage ? 'Enviando...' : 'Enviar aviso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}