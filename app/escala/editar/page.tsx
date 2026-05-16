'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';

type DoctorOption = {
  id: string;
  name: string;
  email: string | null;
};

// Estrutura para o Slot da escala
type ShiftSlot = {
  shiftId: number | null;
  userId: string;
  isChief: boolean;
  badge: string;
};

type ShiftRow = {
  id: number;
  period: 'manha' | 'tarde' | 'noite' | '24h';
  doctor_user_id: string | null;
  is_chief: boolean;
  badge: string | null;
};

type AvailabilityRow = {
  user_id: string;
  period: 'manha' | 'tarde' | 'noite';
};

const PERIODS: {
  key: 'manha' | 'tarde' | 'noite' | '24h';
  label: string;
  maxDoctors: number;
}[] = [
  { key: 'manha', label: 'Manhã', maxDoctors: 8 },
  { key: 'tarde', label: 'Tarde', maxDoctors: 8 },
  { key: 'noite', label: 'Noite', maxDoctors: 4 },
  { key: '24h', label: '24h', maxDoctors: 8 },
];

function EditarPlantaoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dateParam = searchParams.get('date');

  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('Hospital');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // PATCH: controla se o input do badge está “aberto” por linha
  const [badgeOpen, setBadgeOpen] = useState<Record<string, boolean>>({});

  const [doctors, setDoctors] = useState<DoctorOption[]>([]);

  // Slots de cada período
  const [manhaDoctors, setManhaDoctors] = useState<ShiftSlot[]>([
    { shiftId: null, userId: '', isChief: false, badge: '' },
  ]);
  const [tardeDoctors, setTardeDoctors] = useState<ShiftSlot[]>([
    { shiftId: null, userId: '', isChief: false, badge: '' },
  ]);
  const [noiteDoctors, setNoiteDoctors] = useState<ShiftSlot[]>([
    { shiftId: null, userId: '', isChief: false, badge: '' },
  ]);
  const [fullDayDoctors, setFullDayDoctors] = useState<ShiftSlot[]>([
    { shiftId: null, userId: '', isChief: false, badge: '' },
  ]);

  const [copyTargetDate, setCopyTargetDate] = useState<string>('');
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);

  const sortedDoctors = useMemo(() => {
    return [...doctors].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );
  }, [doctors]);

  if (!dateParam) {
    return <div>Data inválida.</div>;
  }

  const [yearStr, monthStr, dayStr] = dateParam.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const date = new Date(year, month, day);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(date.getTime())
  ) {
    return <div>Data inválida.</div>;
  }

  const formattedDate = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  async function loadHospitalFromStorage(userId: string) {
  if (typeof window === 'undefined') return null;

  const hospitalFromUrl = searchParams.get('hospitalId');

  const scopedKey = `activeHospitalId:${userId}`;
  const scopedHospitalId = window.localStorage.getItem(scopedKey);

  // Prioridade:
  // 1. hospitalId vindo da URL
  // 2. hospital salvo por usuário
  // 3. fallback antigo, só para compatibilidade
  const storedHospitalId =
    hospitalFromUrl ||
    scopedHospitalId ||
    window.localStorage.getItem('activeHospitalId');

  if (!storedHospitalId) {
    router.push('/selecionar-hospital');
    return null;
  }

  // Confirma que o usuário pertence a esse hospital
  const { data: membership, error: membershipError } = await supabase
    .from('hospital_users')
    .select('hospital_id')
    .eq('user_id', userId)
    .eq('hospital_id', storedHospitalId)
    .maybeSingle();

  if (membershipError || !membership) {
    setErrorMsg('Você não tem vínculo com o hospital selecionado.');
    router.replace('/selecionar-hospital');
    return null;
  }

  const { data: hosp, error: hospError } = await supabase
    .from('hospitals')
    .select('id, name')
    .eq('id', storedHospitalId)
    .maybeSingle();

  if (hospError || !hosp) {
    setErrorMsg('Não foi possível identificar o hospital selecionado.');
    return null;
  }

  // Mantém o hospital ativo salvo no padrão correto
  window.localStorage.setItem(scopedKey, hosp.id);
  window.localStorage.setItem('activeHospitalId', hosp.id);

  setHospitalId(hosp.id);
  setHospitalName(hosp.name ?? 'Hospital');

  return hosp.id as string;
}

  async function loadDoctors(hospital_id: string) {
    const { data: rows, error } = await supabase
      .from('hospital_users')
      .select('user_id, users(full_name, email)')
      .eq('hospital_id', hospital_id)
      .order('created_at', { ascending: true });

    if (error) {
      setErrorMsg('Erro ao carregar médicos do hospital.');
      setDoctors([]);
      return;
    }

    const mapped: DoctorOption[] = (rows ?? []).map((row: any) => {
      const userObj = Array.isArray(row.users) ? row.users[0] : row.users;
      return {
        id: row.user_id,
        name: userObj?.full_name ?? userObj?.email ?? 'Médico sem nome',
        email: userObj?.email ?? null,
      };
    });

    setDoctors(mapped);
  }

  async function loadShiftsForDay(hospital_id: string) {
    const { data, error } = await supabase
      .from('shifts')
      .select('id, period, doctor_user_id, is_chief, badge')
      .eq('hospital_id', hospital_id)
      .eq('date', dateParam);

    if (error) {
      setErrorMsg('Erro ao carregar plantões do dia.');
      return;
    }

    const rows = (data ?? []) as ShiftRow[];

    const mapToState = (periodKey: string): ShiftSlot[] => {
      const filtered = rows.filter((r) => r.period === periodKey);
      if (filtered.length === 0) {
        return [{ shiftId: null, userId: '', isChief: false, badge: '' }];
      }

      return filtered.map((r) => ({
        shiftId: r.id,
        userId: r.doctor_user_id ?? '',
        isChief: r.is_chief ?? false,
        badge: r.badge ?? '',
      }));
    };

    setManhaDoctors(mapToState('manha'));
    setTardeDoctors(mapToState('tarde'));
    setNoiteDoctors(mapToState('noite'));
    setFullDayDoctors(mapToState('24h'));
  }

  async function loadAvailabilityForDay(hospital_id: string) {
    const { data, error } = await supabase
      .from('availability')
      .select('user_id, period')
      .eq('hospital_id', hospital_id)
      .eq('date', dateParam);

    if (!error && data) {
      setAvailability(data as AvailabilityRow[]);
    } else {
      setAvailability([]);
    }
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

      const hospital_id = await loadHospitalFromStorage(user.id);
      if (!hospital_id) return;

      // 🔒 BLOQUEIO: só admin pode editar escala
const { data: membership, error: memErr } = await supabase
  .from('hospital_users')
  .select('role, is_admin')
  .eq('user_id', user.id)
  .eq('hospital_id', hospital_id)
  .maybeSingle();

if (memErr) {
  console.error('Erro ao checar role:', memErr);
  router.replace(`/escala?date=${dateParam}&hospitalId=${hospital_id}`);
  return;
}

const isAllowed =
  membership?.is_admin === true ||
  membership?.role === 'admin';

if (!isAllowed) {
  if (membership?.role === 'coordenador') {
    router.replace('/coordenador/escala');
  } else {
    router.replace(`/escala?date=${dateParam}&hospitalId=${hospital_id}`);
  }

  return;
}

// 🔓 Só chega aqui se for admin
await loadDoctors(hospital_id);
await loadShiftsForDay(hospital_id);
await loadAvailabilityForDay(hospital_id);
    }

    init();
  }, [dateParam, router]);

  function handleDoctorChange(
    period: 'manha' | 'tarde' | 'noite' | '24h',
    index: number,
    newUserId: string
  ) {
    const update = (arr: ShiftSlot[], setArr: (v: ShiftSlot[]) => void) => {
      const copy = [...arr];
      copy[index] = { ...copy[index], userId: newUserId };
      setArr(copy);
    };

    switch (period) {
      case 'manha':
        update(manhaDoctors, setManhaDoctors);
        break;
      case 'tarde':
        update(tardeDoctors, setTardeDoctors);
        break;
      case 'noite':
        update(noiteDoctors, setNoiteDoctors);
        break;
      case '24h':
        update(fullDayDoctors, setFullDayDoctors);
        break;
    }
  }

  function handleToggleChief(
    period: 'manha' | 'tarde' | 'noite' | '24h',
    index: number,
    isChecked: boolean
  ) {
    const update = (arr: ShiftSlot[], setArr: (v: ShiftSlot[]) => void) => {
      const copy = [...arr];
      copy[index] = { ...copy[index], isChief: isChecked };
      setArr(copy);
    };

    switch (period) {
      case 'manha':
        update(manhaDoctors, setManhaDoctors);
        break;
      case 'tarde':
        update(tardeDoctors, setTardeDoctors);
        break;
      case 'noite':
        update(noiteDoctors, setNoiteDoctors);
        break;
      case '24h':
        update(fullDayDoctors, setFullDayDoctors);
        break;
    }
  }

  function handleBadgeChange(
    period: 'manha' | 'tarde' | 'noite' | '24h',
    index: number,
    text: string
  ) {
    const cleanText = text
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4);

    const update = (arr: ShiftSlot[], setArr: (v: ShiftSlot[]) => void) => {
      const copy = [...arr];
      copy[index] = { ...copy[index], badge: cleanText };
      setArr(copy);
    };

    switch (period) {
      case 'manha':
        update(manhaDoctors, setManhaDoctors);
        break;
      case 'tarde':
        update(tardeDoctors, setTardeDoctors);
        break;
      case 'noite':
        update(noiteDoctors, setNoiteDoctors);
        break;
      case '24h':
        update(fullDayDoctors, setFullDayDoctors);
        break;
    }
  }

  function badgeKey(period: 'manha' | 'tarde' | 'noite' | '24h', index: number) {
    return `${period}-${index}`;
  }

  function openBadge(period: 'manha' | 'tarde' | 'noite' | '24h', index: number) {
    const k = badgeKey(period, index);
    setBadgeOpen((prev) => ({ ...prev, [k]: true }));
  }

  function closeBadgeIfEmpty(
    period: 'manha' | 'tarde' | 'noite' | '24h',
    index: number,
    currentBadge: string
  ) {
    const k = badgeKey(period, index);
    if ((currentBadge ?? '').trim().length === 0) {
      setBadgeOpen((prev) => ({ ...prev, [k]: false }));
    }
  }

  function handleAddDoctor(period: 'manha' | 'tarde' | 'noite' | '24h') {
    const addTo = (
      arr: ShiftSlot[],
      setArr: (v: ShiftSlot[]) => void,
      max: number
    ) => {
      if (arr.length >= max) return;
      setArr([...arr, { shiftId: null, userId: '', isChief: false, badge: '' }]);
    };

    const config = PERIODS.find((p) => p.key === period);
    if (!config) return;

    switch (period) {
      case 'manha':
        addTo(manhaDoctors, setManhaDoctors, config.maxDoctors);
        break;
      case 'tarde':
        addTo(tardeDoctors, setTardeDoctors, config.maxDoctors);
        break;
      case 'noite':
        addTo(noiteDoctors, setNoiteDoctors, config.maxDoctors);
        break;
      case '24h':
        addTo(fullDayDoctors, setFullDayDoctors, config.maxDoctors);
        break;
    }
  }

  function handleRemoveDoctor(
    period: 'manha' | 'tarde' | 'noite' | '24h',
    index: number
  ) {
    const removeFrom = (arr: ShiftSlot[], setArr: (v: ShiftSlot[]) => void) => {
      const copy = [...arr];
      copy.splice(index, 1);
      if (copy.length === 0) {
        copy.push({ shiftId: null, userId: '', isChief: false, badge: '' });
      }
      setArr(copy);
    };

    switch (period) {
      case 'manha':
        removeFrom(manhaDoctors, setManhaDoctors);
        break;
      case 'tarde':
        removeFrom(tardeDoctors, setTardeDoctors);
        break;
      case 'noite':
        removeFrom(noiteDoctors, setNoiteDoctors);
        break;
      case '24h':
        removeFrom(fullDayDoctors, setFullDayDoctors);
        break;
    }
  }

  function handleClearAll() {
    if (!hospitalId) return;

    setManhaDoctors([{ shiftId: null, userId: '', isChief: false, badge: '' }]);
    setTardeDoctors([{ shiftId: null, userId: '', isChief: false, badge: '' }]);
    setNoiteDoctors([{ shiftId: null, userId: '', isChief: false, badge: '' }]);
    setFullDayDoctors([{ shiftId: null, userId: '', isChief: false, badge: '' }]);
  }

  // --- NOVAS FUNÇÕES DE SYNC E COPY ---

  function toDbBadge(badge: string): string | null {
    const v = (badge ?? '').trim();
    return v.length > 0 ? v.slice(0, 4).toUpperCase() : null;
  }

  function buildDesiredRows(dateStr: string) {
    if (!hospitalId) return [];

    const desired: Array<{
      shiftId: number | null;
      hospital_id: string;
      date: string;
      period: 'manha' | 'tarde' | 'noite' | '24h';
      doctor_user_id: string;
      is_chief: boolean;
      badge: string | null;
    }> = [];

    const push = (arr: ShiftSlot[], period: 'manha' | 'tarde' | 'noite' | '24h') => {
      for (const slot of arr) {
        const uid = (slot.userId ?? '').trim();
        if (!uid) continue;

        desired.push({
          shiftId: slot.shiftId ?? null,
          hospital_id: hospitalId,
          date: dateStr,
          period,
          doctor_user_id: uid,
          is_chief: !!slot.isChief,
          badge: toDbBadge(slot.badge),
        });
      }
    };

    push(manhaDoctors, 'manha');
    push(tardeDoctors, 'tarde');
    push(noiteDoctors, 'noite');
    push(fullDayDoctors, '24h');

    return desired;
  }

  async function syncShiftsForDay(dateStr: string) {
    if (!hospitalId) return;

    // 1) Carrega o que existe no banco (dia/hospital)
    const { data: existing, error: loadErr } = await supabase
      .from('shifts')
      .select('id, period, doctor_user_id, is_chief, badge')
      .eq('hospital_id', hospitalId)
      .eq('date', dateStr);

    if (loadErr) throw loadErr;

    const existingRows = (existing ?? []) as ShiftRow[];

    // 2) Monta o “desejado” a partir do estado
    const desired = buildDesiredRows(dateStr);

    // 3) Atualiza o que tem shiftId e insere o que não tem
    const desiredIds = new Set<number>();

    for (const row of desired) {
      if (row.shiftId) {
        desiredIds.add(row.shiftId);

        const { error: updErr } = await supabase
          .from('shifts')
          .update({
            period: row.period,
            doctor_user_id: row.doctor_user_id,
            is_chief: row.is_chief,
            badge: row.badge,
          })
          .eq('id', row.shiftId)
          .eq('hospital_id', hospitalId);

        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from('shifts').insert([
          {
            hospital_id: row.hospital_id,
            date: row.date,
            period: row.period,
            doctor_user_id: row.doctor_user_id,
            is_chief: row.is_chief,
            badge: row.badge,
          },
        ]);

        if (insErr) throw insErr;
      }
    }

    // 4) Deleta o que existe no banco mas não está mais no estado (remoções reais)
    const toDeleteIds: number[] = [];
    for (const r of existingRows) {
      if (!desiredIds.has(r.id)) {
        toDeleteIds.push(r.id);
      }
    }

    if (toDeleteIds.length > 0) {
      const { error: delErr } = await supabase
        .from('shifts')
        .delete()
        .eq('hospital_id', hospitalId)
        .in('id', toDeleteIds);

      if (delErr) throw delErr;
    }
  }

  async function copyShiftsToDate(targetDate: string) {
    if (!hospitalId) return;

    // 1) Carrega o que existe no destino
    const { data: existing, error: loadErr } = await supabase
      .from('shifts')
      .select('id, period, doctor_user_id, is_chief, badge')
      .eq('hospital_id', hospitalId)
      .eq('date', targetDate);

    if (loadErr) throw loadErr;

    const existingRows = (existing ?? []) as ShiftRow[];

    // 2) “Desired” baseado no estado atual, mas SEM shiftId
    const desired = buildDesiredRows(targetDate).map((r) => ({ ...r, shiftId: null }));

    // 3) Estratégia simples e segura pro copy:
    // - Atualiza/insere baseado em (period + doctor_user_id) como “chave lógica”
    // - Remove do destino o que não existe mais no desired
    const key = (r: { period: string; doctor_user_id: string }) =>
      `${r.period}::${r.doctor_user_id}`;

    const existingByKey = new Map<string, ShiftRow>();
    for (const r of existingRows) {
      existingByKey.set(
        key({ period: r.period, doctor_user_id: r.doctor_user_id ?? '' }),
        r
      );
    }

    const desiredKeys = new Set<string>();

    for (const r of desired) {
      const k = key({ period: r.period, doctor_user_id: r.doctor_user_id });
      desiredKeys.add(k);

      const match = existingByKey.get(k);

      if (match) {
        const { error: updErr } = await supabase
          .from('shifts')
          .update({
            is_chief: r.is_chief,
            badge: r.badge,
          })
          .eq('id', match.id)
          .eq('hospital_id', hospitalId);

        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from('shifts').insert([
          {
            hospital_id: hospitalId,
            date: targetDate,
            period: r.period,
            doctor_user_id: r.doctor_user_id,
            is_chief: r.is_chief,
            badge: r.badge,
          },
        ]);

        if (insErr) throw insErr;
      }
    }

    // remover do destino o que não está mais no desired
    const toDeleteIds: number[] = [];
    for (const r of existingRows) {
      const k = key({ period: r.period, doctor_user_id: r.doctor_user_id ?? '' });
      if (!desiredKeys.has(k)) toDeleteIds.push(r.id);
    }

    if (toDeleteIds.length > 0) {
      const { error: delErr } = await supabase
        .from('shifts')
        .delete()
        .eq('hospital_id', hospitalId)
        .in('id', toDeleteIds);

      if (delErr) throw delErr;
    }
  }

  async function handleSave() {
    if (!hospitalId) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      await syncShiftsForDay(dateParam!);

      // recarrega como você já fazia (bom porque re-hidrata shiftId e estado)
      router.replace(`/escala?date=${dateParam}&hospitalId=${hospitalId}`);
    } catch (err: any) {
      setErrorMsg(`Erro ao salvar: ${err?.message ?? 'desconhecido'}`);
      setSaving(false);
    }
  }

  async function handleCopyToDate() {
    if (!hospitalId) return;
    if (!copyTargetDate) {
      setErrorMsg('Informe a data de destino para copiar a escala.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      // Estratégia: copiar o “desejado” do dia atual para o destino
      await copyShiftsToDate(copyTargetDate);

      setSaving(false);
      alert('Copiado com sucesso!');
    } catch (err: any) {
      setErrorMsg(`Erro ao copiar: ${err?.message ?? 'desconhecido'}`);
      setSaving(false);
    }
  }

  function getAvailabilityStatus(
    userId: string,
    period: 'manha' | 'tarde' | 'noite' | '24h'
  ) {
    if (!userId) return null;
    if (period === '24h') {
      const periods = availability.filter((a) => a.user_id === userId).map((a) => a.period);
      if (periods.length === 0) return null;
      const hasManha = periods.includes('manha');
      const hasTarde = periods.includes('tarde');
      const hasNoite = periods.includes('noite');
      if (hasManha && hasTarde && hasNoite) {
        return {
          label: 'Disp. (M/T/N)',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      }
      return {
        label: 'Disp. parcial',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    const exists = availability.some((a) => a.user_id === userId && a.period === period);
    if (!exists) {
      return {
        label: 'Sem anúncio',
        className: 'bg-slate-50 text-slate-500 border-slate-200',
      };
    }
    return {
      label: 'Disponível',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  const periodStateMap: Record<string, { values: ShiftSlot[] }> = {
    manha: { values: manhaDoctors },
    tarde: { values: tardeDoctors },
    noite: { values: noiteDoctors },
    '24h': { values: fullDayDoctors },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="rounded-b-[28px] bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1500px] items-start px-6 py-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center">
            <img
              src="/medturn-logo-transparent.png"
              alt="MedTurn"
              className="h-20 w-20 object-contain"
            />
          </div>

          <div className="ml-5 flex flex-1 flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="pt-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#40C0A2]">
                MedTurn • Escala
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tighter text-slate-950">
                Editar plantões do dia
              </h1>

              <p className="mt-2 text-[11px] font-semibold text-slate-400">
                {hospitalName} • {formattedDate}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button
                onClick={() =>
  router.push(
    hospitalId
      ? `/escala?date=${dateParam}&hospitalId=${hospitalId}`
      : `/escala?date=${dateParam}`
  )
}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95"
              >
                Voltar para escala
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-6 py-6 space-y-5">
        {errorMsg && (
          <div className="rounded-[28px] border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
            Organização do plantão
          </p>

          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
            Médicos escalados por período
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Marque <strong>CH</strong> para indicar o chefe de plantão. Use o ícone de etiqueta
            para adicionar um badge curto quando necessário.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {PERIODS.map((p) => {
            const state = periodStateMap[p.key];

            return (
              <section
                key={p.key}
                className="flex flex-col rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Período
                    </p>

                    <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                      {p.label}
                    </h2>
                  </div>

                  <span className="rounded-2xl bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Máx. {p.maxDoctors}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {state.values.map((slot, index) => {
                    const status = getAvailabilityStatus(slot.userId, p.key as any);

                    return (
                      <div
                        key={`${p.key}-${index}`}
                        className="flex flex-col gap-2 rounded-3xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <select
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#40C0A2]"
                            value={slot.userId}
                            onChange={(e) =>
                              handleDoctorChange(p.key as any, index, e.target.value)
                            }
                          >
                            <option value="">Selecione um médico...</option>
                            {sortedDoctors.map((doc) => (
                              <option key={doc.id} value={doc.id}>
                                {doc.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                          {badgeOpen[badgeKey(p.key as any, index)] ? (
                            <label
                              title="Badge (até 4)"
                              className="flex items-center gap-1 rounded-2xl border border-slate-800 bg-slate-800 px-2 py-2 text-white transition"
                            >
                              <input
                                type="text"
                                inputMode="text"
                                maxLength={4}
                                value={slot.badge}
                                onChange={(e) =>
                                  handleBadgeChange(p.key as any, index, e.target.value)
                                }
                                onBlur={() =>
                                  closeBadgeIfEmpty(p.key as any, index, slot.badge)
                                }
                                autoFocus
                                className="w-10 bg-transparent text-center text-[9px] font-black uppercase tracking-wide outline-none"
                              />
                            </label>
                          ) : slot.badge?.trim() ? (
                            <button
                              type="button"
                              title="Editar badge"
                              onClick={() => openBadge(p.key as any, index)}
                              className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-[9px] font-black uppercase text-blue-700"
                            >
                              {slot.badge}
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="Adicionar badge"
                              onClick={() => openBadge(p.key as any, index)}
                              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-400"
                            >
                              <span className="text-[11px] font-black">🏷️</span>
                            </button>
                          )}

                          <label
                            title="Chefe de Plantão"
                            className={`flex cursor-pointer select-none items-center gap-1 rounded-2xl border px-3 py-2 transition ${
                              slot.isChief
                                ? 'border-slate-800 bg-slate-800 text-white'
                                : 'border-slate-200 bg-white text-slate-400 hover:border-slate-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={slot.isChief}
                              onChange={(e) =>
                                handleToggleChief(p.key as any, index, e.target.checked)
                              }
                            />

                            <span className="text-[9px] font-black">CH</span>
                          </label>

                          {status ? (
                            <span
                              className={`whitespace-nowrap rounded-2xl border px-2.5 py-2 text-[9px] font-bold ${status.className}`}
                              title={status.label}
                            >
                              {status.label === 'Disponível' ? 'Disp.' : status.label}
                            </span>
                          ) : (
                            <span className="select-none px-1 text-[9px] text-slate-300">
                              —
                            </span>
                          )}

                          {(state.values.length > 1 || slot.userId !== '') && (
                            <button
                              type="button"
                              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:text-red-500"
                              onClick={() => handleRemoveDoctor(p.key as any, index)}
                              title="Remover vaga / Limpar"
                            >
                              <span className="text-sm font-black">×</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddDoctor(p.key as any)}
                  className="mt-4 w-full rounded-2xl border border-dashed border-slate-300 bg-white py-3 text-xs font-black uppercase tracking-wider text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  + Adicionar vaga
                </button>
              </section>
            );
          })}
        </div>

        <div className="rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <button
              type="button"
              onClick={handleClearAll}
              disabled={saving}
              className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              Limpar dia
            </button>

            <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Copiar para:
                </span>

                <input
                  type="date"
                  value={copyTargetDate}
                  onChange={(e) => setCopyTargetDate(e.target.value)}
                  className="border-none bg-transparent p-0 text-xs font-semibold text-slate-700 outline-none"
                />

                <button
                  type="button"
                  onClick={handleCopyToDate}
                  disabled={saving}
                  className="border-l border-slate-200 pl-3 text-[10px] font-black uppercase text-[#1E7564] hover:text-[#102322] disabled:opacity-50"
                >
                  Copiar
                </button>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-2xl bg-slate-950 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-sm hover:bg-slate-800 active:scale-95 disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function EditarPlantaoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="rounded-[32px] border border-slate-100 bg-white px-6 py-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Carregando...</p>
          </div>
        </div>
      }
    >
      <EditarPlantaoContent />
    </Suspense>
  );
}