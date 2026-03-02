'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { toast, Toaster } from 'sonner';

// --- TIPAGENS ---
type AvailabilityPeriod = 'manha' | 'tarde' | 'noite';
type ViewMode = 'day' | '7d' | '30d';

interface HospitalOption {
  id: string;
  name: string;
}

type ColleagueAvailabilityRow = {
  user_id: string;
  period: AvailabilityPeriod;
  date: string; // ✅ novo
  users: { full_name: string | null } | null;
};

type ColleagueDay = {
  date: string;                 // YYYY-MM-DD
  periods: AvailabilityPeriod[]; // ex: ['manha','tarde']
};

type ColleagueGrouped = {
  user_id: string;
  full_name: string;
  days: ColleagueDay[]; // ✅ novo (mostra o dia)
};

function MedicoDisponibilidadeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('Hospital');
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState<string>('');

// ✅ NOVO: toggle de visão
const [viewMode, setViewMode] = useState<ViewMode>('30d');

const [periods, setPeriods] = useState<AvailabilityPeriod[]>([]);
const [dayShifts, setDayShifts] = useState<any[]>([]);

// ✅ NOVO: meus plantões no RANGE do toggle (day/7d/30d)
const [rangeShifts, setRangeShifts] = useState<any[]>([]);

  // Colegas e Modais
  const [colleagues, setColleagues] = useState<ColleagueGrouped[]>([]);
  const [loadingColleagues, setLoadingColleagues] = useState(false);
  const [chooseModalOpen, setChooseModalOpen] = useState(false);
  const [chooseTarget, setChooseTarget] = useState<{ targetUserId: string; targetName: string; period: AvailabilityPeriod } | null>(null);
  const [chooseShiftOptions, setChooseShiftOptions] = useState<any[]>([]);

  // --- FUNÇÕES DE CARREGAMENTO ---
function toISODate(d: Date) {
  return d.toISOString().split('T')[0];
}

function addDays(iso: string, days: number) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

function formatBRShort(iso: string) {
  // iso = YYYY-MM-DD
  const [y, m, d] = iso.split('-');
  return `${d}/${m}`;
}

function labelPeriod(p: AvailabilityPeriod) {
  return p === 'manha' ? 'Manhã' : p === 'tarde' ? 'Tarde' : 'Noite';
}
function getRange(date: string, mode: ViewMode) {
  if (mode === 'day') return { start: date, end: date };
  if (mode === '7d') return { start: date, end: addDays(date, 6) };
  return { start: date, end: addDays(date, 29) };
}

  const loadHospitalData = useCallback(async (hId: string, uId: string, date: string) => {
  // ✅ disponibilidade do próprio médico continua sendo APENAS do dia selecionado
  const { data: avail } = await supabase
    .from('availability')
    .select('period')
    .eq('hospital_id', hId)
    .eq('user_id', uId)
    .eq('date', date);

  setPeriods((avail ?? []).map((r: any) => r.period as AvailabilityPeriod));

  // ✅ meus plantões: NÃO mexer (fica só do dia selecionado)
  const { data: shifts } = await supabase
    .from('shifts')
    .select('id, period, date')
    .eq('hospital_id', hId)
    .eq('doctor_user_id', uId)
    .eq('date', date)
    .order('date', { ascending: true });

  setDayShifts(shifts ?? []);
}, []);

  const loadColleaguesAvailability = useCallback(async (hId: string, uId: string, date: string, mode: ViewMode) => {
  setLoadingColleagues(true);

  try {
    const { start, end } = getRange(date, mode);

    const { data, error } = await supabase
      .from('availability')
      .select('user_id, period, users(full_name), date')
      .eq('hospital_id', hId)
      .gte('date', start)
      .lte('date', end)
      .neq('user_id', uId);

    if (error) throw error;

    const rows = (data ?? []).map((r: any) => ({
  user_id: r.user_id as string,
  period: r.period as AvailabilityPeriod,
  date: r.date as string, // ✅ agora usamos
  users: Array.isArray(r.users) ? r.users[0] : r.users,
})) as ColleagueAvailabilityRow[];

// ✅ agregação por colega + por DIA
const byUser = new Map<string, { full_name: string; byDate: Map<string, Set<AvailabilityPeriod>> }>();

for (const r of rows) {
  const name = (r.users?.full_name ?? 'Médico').trim() || 'Médico';

  if (!byUser.has(r.user_id)) {
    byUser.set(r.user_id, { full_name: name, byDate: new Map() });
  }

  const entry = byUser.get(r.user_id)!;

  if (!entry.byDate.has(r.date)) entry.byDate.set(r.date, new Set());
  entry.byDate.get(r.date)!.add(r.period);
}

const grouped: ColleagueGrouped[] = Array.from(byUser.entries()).map(([user_id, entry]) => {
  const days: ColleagueDay[] = Array.from(entry.byDate.entries())
    .map(([date, set]) => ({ date, periods: Array.from(set.values()) }))
    .sort((a, b) => a.date.localeCompare(b.date)); // YYYY-MM-DD ordena ok

  return { user_id, full_name: entry.full_name, days };
}).sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR', { sensitivity: 'base' }));

setColleagues(grouped);
  } catch (e) {
    console.error('Falha ao carregar colegas:', e);
    setColleagues([]);
  } finally {
    setLoadingColleagues(false);
  }
}, []);

const loadMyRangeShifts = useCallback(async (hId: string, uId: string, date: string, mode: ViewMode) => {
  try {
    const { start, end } = getRange(date, mode);

    const { data, error } = await supabase
      .from('shifts')
      .select('id, period, date')
      .eq('hospital_id', hId)
      .eq('doctor_user_id', uId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true });

    if (error) throw error;

    setRangeShifts(data ?? []);
  } catch (e) {
    console.error('Falha ao carregar meus plantões (range):', e);
    setRangeShifts([]);
  }
}, []);

  // --- INITIALIZATION ---
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      const { data: memberships } = await supabase
        .from('hospital_users')
        .select('hospital_id, hospitals(name)')
        .eq('user_id', user.id);

      if (memberships && memberships.length > 0) {
        const formattedHospitals = memberships.map((m: any) => ({
          id: m.hospital_id,
          name: m.hospitals?.name || 'Hospital Sem Nome'
        }));
        setHospitals(formattedHospitals);

        const storedHosp = window.localStorage.getItem(`activeHospitalId:${user.id}`);
        const initialHosp = formattedHospitals.find(h => h.id === storedHosp) || formattedHospitals[0];

        setHospitalId(initialHosp.id);
        setHospitalName(initialHosp.name);

        const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
        setDateStr(initialDate);

        await loadHospitalData(initialHosp.id, user.id, initialDate);
await loadColleaguesAvailability(initialHosp.id, user.id, initialDate, viewMode);

// ✅ NOVO: carregar meus plantões do range do toggle
await loadMyRangeShifts(initialHosp.id, user.id, initialDate, viewMode);
      }
      setLoading(false);
    }
    init();
  }, [router, searchParams, loadHospitalData, loadColleaguesAvailability, loadMyRangeShifts]);

  useEffect(() => {
  if (loading) return; // ✅ evita duplicar no primeiro render
  if (hospitalId && userId && dateStr) {
    // ✅ meus plantões e minha disponibilidade: só do dia (sem toggle)
    loadHospitalData(hospitalId, userId, dateStr);
  }
}, [loading, hospitalId, dateStr, userId, loadHospitalData]);

useEffect(() => {
  if (loading) return;
  if (hospitalId && userId && dateStr) {
    loadColleaguesAvailability(hospitalId, userId, dateStr, viewMode);

    // ✅ NOVO: meus plantões no range pra poder oferecer em qualquer modo
    loadMyRangeShifts(hospitalId, userId, dateStr, viewMode);
  }
}, [loading, hospitalId, dateStr, userId, viewMode, loadColleaguesAvailability, loadMyRangeShifts]);

  // --- HANDLERS ---

  const handleHospitalChange = (id: string) => {
    const selected = hospitals.find(h => h.id === id);
    if (selected && userId) {
      setHospitalId(selected.id);
      setHospitalName(selected.name);
      window.localStorage.setItem(`activeHospitalId:${userId}`, selected.id);
      toast.info(`Hospital alterado para ${selected.name}`);
    }
  };

  async function handleTogglePeriod(p: AvailabilityPeriod) {
    if (!hospitalId || !userId || !dateStr) return;
    const isRemoving = periods.includes(p);
    const newPeriods = isRemoving ? periods.filter(x => x !== p) : [...periods, p];
    setPeriods(newPeriods);
    
    if (isRemoving) {
      toast.info(`Disponibilidade de ${p} removida`);
    } else {
      toast.success(`Disponibilidade de ${p} salva!`);
    }

    try {
      await supabase.from('availability').delete().eq('hospital_id', hospitalId).eq('user_id', userId).eq('date', dateStr);
      if (newPeriods.length > 0) {
        await supabase.from('availability').insert(newPeriods.map(period => ({ 
          hospital_id: hospitalId, 
          user_id: userId, 
          date: dateStr, 
          period 
        })));
      }
    } catch (error) {
      toast.error("Erro ao sincronizar com o servidor.");
    }
  }

  async function createTargetedSwapRequest(shiftId: number, targetUserId: string, targetName: string) {
    if (!hospitalId || !userId) return;
    try {
      const { error } = await supabase
  .from('shift_swap_requests')
  .insert({
    hospital_id: hospitalId,
    requester_user_id: userId,
    from_shift_id: shiftId,
    status: 'pendente',
    target_user_id: targetUserId,
    reason: '__offer_via_disponibilidade__', // ✅ marca origem
  });

      if (error) throw error;
      toast.success(`Oferta enviada para ${targetName}!`);
      toast.info('Agora falta a coordenação confirmar no painel.');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao enviar oferta.');
    }
  }

  function handleOfferToColleague(
  targetUserId: string,
  targetName: string,
  period: AvailabilityPeriod,
  colleagueDays: ColleagueDay[]
) {
  // ✅ dias em que o colega está disponível nesse período (dentro do range carregado)
  const eligibleDates = new Set(
    (colleagueDays ?? [])
      .filter(d => d.periods.includes(period))
      .map(d => d.date)
  );

  if (eligibleDates.size === 0) {
    toast.info('Esse colega não tem disponibilidade nesse período no intervalo selecionado.');
    return;
  }

  // ✅ meus plantões que batem DATA + PERÍODO
  const matching = (rangeShifts ?? []).filter(
    (s: any) => s.period === period && eligibleDates.has(s.date)
  );

  if (matching.length === 0) {
    toast.info('Você não tem plantão que case com essa disponibilidade (mesma data e período).');
    return;
  }

  if (matching.length === 1) {
    createTargetedSwapRequest(matching[0].id, targetUserId, targetName);
    return;
  }

  setChooseTarget({ targetUserId, targetName, period });
  setChooseShiftOptions(matching);
  setChooseModalOpen(true);
}

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Carregando...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors />
      
      {/* MODAL DE ESCOLHA DE PLANTÃO */}
      {chooseModalOpen && chooseTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-slate-50 border-b px-4 py-3 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase">Escolher plantão</p>
                <p className="text-sm font-bold text-slate-800">Oferecer para {chooseTarget.targetName}</p>
                <p className="text-[11px] text-slate-500 capitalize">Período: {chooseTarget.period}</p>
              </div>
              <button onClick={() => { setChooseModalOpen(false); setChooseTarget(null); }} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>
            <div className="p-4 space-y-2">
              {chooseShiftOptions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    createTargetedSwapRequest(s.id, chooseTarget.targetUserId, chooseTarget.targetName);
                    setChooseModalOpen(false);
                  }}
                  className="w-full text-left bg-white border rounded-xl p-4 hover:shadow-sm"
                >
                  <p className="text-sm font-bold text-slate-800">
  {formatBRShort(s.date)} • <span className="capitalize">{s.period}</span>
</p>
<p className="text-[11px] text-slate-500">ID #{s.id}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => router.push('/medico')} className="text-slate-400 hover:text-slate-600">◀ Voltar</button>
        <div className="text-center flex flex-col items-center">
          <h1 className="text-sm font-black uppercase text-slate-800 tracking-tighter">Disponibilidade</h1>
          {hospitals.length > 1 ? (
            <select 
              value={hospitalId || ''} 
              onChange={(e) => handleHospitalChange(e.target.value)}
              className="text-[10px] text-emerald-600 font-bold bg-transparent border-none focus:ring-0 p-0 cursor-pointer uppercase"
            >
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          ) : (
            <p className="text-[10px] text-emerald-600 font-bold uppercase">{hospitalName}</p>
          )}
        </div>
        <div className="w-10" /> 
      </header>

      <main className="max-w-md mx-auto px-6 py-8 space-y-8">
        {/* SEÇÃO 1: SELECIONE O DIA */}
        <section className="bg-white border rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
  <h2 className="text-sm font-bold text-slate-800">Selecione o Dia</h2>

  <input
    type="date"
    value={dateStr}
    onChange={e => setDateStr(e.target.value)}
    className="text-xs border-none font-bold text-emerald-600 focus:ring-0 cursor-pointer"
  />
</div>

          <div className="grid grid-cols-3 gap-3">
            {(['manha', 'tarde', 'noite'] as const).map(p => {
              const isActive = periods.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => handleTogglePeriod(p)}
                  className={`flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all duration-200 ${
                    isActive ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase">{p}</span>
                  <span className="text-lg mt-1">{p === 'manha' ? '☀️' : p === 'tarde' ? '🌤️' : '🌙'}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* SEÇÃO 2: MEUS PLANTÕES NO DIA (POSIÇÃO TROCADA) */}
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest ml-2">
  Meus Plantões no Dia
</h2>
          {dayShifts.length === 0 ? (
            <div className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center">
              <p className="text-xs text-slate-400 font-medium">Nenhum plantão escalado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayShifts.map(s => (
                <div key={s.id} className="bg-white border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="text-sm font-bold text-slate-800 capitalize">{s.period}</div>
                  <button onClick={() => router.push(`/medico/troca?shiftId=${s.id}`)} className="text-[10px] font-black bg-slate-900 text-white px-4 py-2 rounded-xl">TROCAR</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SEÇÃO 3: DISPONIBILIDADE DOS COLEGAS (POSIÇÃO TROCADA) */}
        <section className="space-y-3">
  <div className="flex items-center justify-between px-2">
    <div className="flex items-center gap-2">
      <h2 className="text-xs font-black uppercase text-slate-400 tracking-widest">
        Plantonistas disponíveis
      </h2>
      {loadingColleagues && <span className="text-[10px] text-slate-400">carregando...</span>}
    </div>

    <div className="flex gap-2">
      {([
        { key: 'day', label: 'Dia' },
        { key: '7d', label: '7 dias' },
        { key: '30d', label: '30 dias' },
      ] as const).map((opt) => {
        const active = viewMode === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => setViewMode(opt.key)}
            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
              active
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>

          {colleagues.length === 0 ? (
            <div className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center">
              <p className="text-xs text-slate-400 font-medium">Nenhuma disponibilidade publicada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {colleagues.map(c => (
                <div key={c.user_id} className="bg-white border rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{c.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase">Disponível</p>
                    </div>
                  </div>
                  {/* ✅ Linha que explica os dias (mostra até 3 dias, e depois "+N") */}
<div className="mt-2 text-[11px] text-slate-600">
  <span className="font-bold text-slate-700">Dias:</span>{' '}
  {(() => {
    const max = 3;
    const shown = c.days.slice(0, max);
    const rest = c.days.length - shown.length;

    return (
      <>
        {shown.map((d, idx) => (
          <span key={d.date} className="mr-2">
            <span className="font-bold">{formatBRShort(d.date)}</span>
            <span className="text-slate-500">
              {' '}• {d.periods.map(labelPeriod).join(', ')}
            </span>
            {idx < shown.length - 1 ? ' ' : ''}
          </span>
        ))}
        {rest > 0 && <span className="text-slate-400 font-bold">+{rest}</span>}
      </>
    );
  })()}
</div>

{/* ✅ Botões continuam (só faz sentido oferecer no modo DIA) */}
<div className="mt-3 grid grid-cols-3 gap-2">
  {(['manha', 'tarde', 'noite'] as const).map((p) => {
  // colega tem alguma data no range com esse período?
  const colleagueHas = (c.days ?? []).some((d) => d.periods.includes(p));

  // datas elegíveis (colega disponível nesse período)
  const eligibleDates = new Set(
    (c.days ?? [])
      .filter((d) => d.periods.includes(p))
      .map((d) => d.date)
  );

  // eu tenho plantão no range que bate data + período?
  const iHaveMatch = (rangeShifts ?? []).some(
    (s: any) => s.period === p && eligibleDates.has(s.date)
  );

  const disabled = !colleagueHas || !iHaveMatch;

  return (
    <button
      key={p}
      disabled={disabled}
      onClick={() => handleOfferToColleague(c.user_id, c.full_name, p, c.days)}
      className={`rounded-xl border px-2 py-3 text-[10px] font-black uppercase transition-all ${
        !colleagueHas
          ? 'bg-slate-50 text-slate-300 border-slate-100'
          : disabled
            ? 'bg-amber-50 text-amber-300 border-amber-100'
            : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-700 active:scale-[0.99]'
      }`}
      title={
        !colleagueHas
          ? 'Colega não está disponível nesse período no intervalo'
          : !iHaveMatch
            ? 'Você não tem plantão casando com essa disponibilidade (data + período)'
            : 'Oferecer meu plantão (vai direto pra pendente no admin)'
      }
    >
      {p}
      <div className="mt-1 text-[9px] font-bold opacity-80 normal-case">
        {!colleagueHas ? '—' : !iHaveMatch ? 'sem match' : 'oferecer'}
      </div>
    </button>
  );
})}
</div>

<p className="mt-3 text-[11px] text-slate-500">
  Após oferecer, <span className="font-bold">aguarde confirmação da coordenação</span>.
</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function MedicoDisponibilidadePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Carregando...</div>}>
      <MedicoDisponibilidadeContent />
    </Suspense>
  );
}
