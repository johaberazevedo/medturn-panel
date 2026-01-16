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
  userId: string;
  isChief: boolean;
};

type ShiftRow = {
  id: number;
  period: 'manha' | 'tarde' | 'noite' | '24h';
  doctor_user_id: string | null;
  is_chief: boolean;
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
  { key: 'manha', label: 'Manhã', maxDoctors: 6 },
  { key: 'tarde', label: 'Tarde', maxDoctors: 6 },
  { key: 'noite', label: 'Noite', maxDoctors: 3 },
  { key: '24h', label: '24h', maxDoctors: 6 },
];

function EditarPlantaoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dateParam = searchParams.get('date');

  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('Hospital');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [doctors, setDoctors] = useState<DoctorOption[]>([]);

  // Slots de cada período
  const [manhaDoctors, setManhaDoctors] = useState<ShiftSlot[]>([{ userId: '', isChief: false }]);
  const [tardeDoctors, setTardeDoctors] = useState<ShiftSlot[]>([{ userId: '', isChief: false }]);
  const [noiteDoctors, setNoiteDoctors] = useState<ShiftSlot[]>([{ userId: '', isChief: false }]);
  const [fullDayDoctors, setFullDayDoctors] = useState<ShiftSlot[]>([{ userId: '', isChief: false }]);

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

  // Parse de data corrigido para evitar fuso horário
  const [yearStr, monthStr, dayStr] = dateParam.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const date = new Date(year, month, day);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(date.getTime())) {
    return <div>Data inválida.</div>;
  }

  const formattedDate = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  async function loadHospitalAndDoctors(userId: string) {
    const { data: membership } = await supabase
      .from('hospital_users')
      .select('hospital_id, hospitals(name)')
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership) {
      setErrorMsg('Nenhum hospital encontrado para este usuário.');
      return null;
    }

    const hospital_id = membership.hospital_id as string;
    setHospitalId(hospital_id);

    const hospData = membership.hospitals as any;
    const realName = Array.isArray(hospData) ? hospData[0]?.name : hospData?.name;
    setHospitalName(realName ?? 'Hospital');

    const { data: rows, error } = await supabase
      .from('hospital_users')
      .select('user_id, users(full_name, email)')
      .eq('hospital_id', hospital_id);

    if (error) {
      setErrorMsg('Erro ao carregar médicos do hospital.');
      return hospital_id;
    }

    const mapped: DoctorOption[] = (rows as any[]).map((row) => {
      const userObj = Array.isArray(row.users) ? row.users[0] : row.users;
      return {
        id: row.user_id,
        name: userObj?.full_name ?? userObj?.email ?? 'Médico sem nome',
        email: userObj?.email ?? null,
      };
    });

    mapped.sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );

    setDoctors(mapped);
    return hospital_id;
  }

  async function loadShiftsForDay(hospital_id: string) {
    const { data, error } = await supabase
      .from('shifts')
      .select('id, period, doctor_user_id, is_chief')
      .eq('hospital_id', hospital_id)
      .eq('date', dateParam);

    if (error) {
      setErrorMsg('Erro ao carregar plantões do dia.');
      return;
    }

    const rows = (data ?? []) as ShiftRow[];

    const mapToState = (periodKey: string): ShiftSlot[] => {
      const filtered = rows.filter((r) => r.period === periodKey);
      if (filtered.length === 0) return [{ userId: '', isChief: false }];
      return filtered.map(r => ({
        userId: r.doctor_user_id ?? '',
        isChief: r.is_chief ?? false
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const hospital_id = await loadHospitalAndDoctors(user.id);
      if (!hospital_id) return;

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
      case 'manha': update(manhaDoctors, setManhaDoctors); break;
      case 'tarde': update(tardeDoctors, setTardeDoctors); break;
      case 'noite': update(noiteDoctors, setNoiteDoctors); break;
      case '24h': update(fullDayDoctors, setFullDayDoctors); break;
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
      case 'manha': update(manhaDoctors, setManhaDoctors); break;
      case 'tarde': update(tardeDoctors, setTardeDoctors); break;
      case 'noite': update(noiteDoctors, setNoiteDoctors); break;
      case '24h': update(fullDayDoctors, setFullDayDoctors); break;
    }
  }

  function handleAddDoctor(period: 'manha' | 'tarde' | 'noite' | '24h') {
    const addTo = (arr: ShiftSlot[], setArr: (v: ShiftSlot[]) => void, max: number) => {
      if (arr.length >= max) return;
      setArr([...arr, { userId: '', isChief: false }]);
    };

    const config = PERIODS.find((p) => p.key === period);
    if (!config) return;

    switch (period) {
      case 'manha': addTo(manhaDoctors, setManhaDoctors, config.maxDoctors); break;
      case 'tarde': addTo(tardeDoctors, setTardeDoctors, config.maxDoctors); break;
      case 'noite': addTo(noiteDoctors, setNoiteDoctors, config.maxDoctors); break;
      case '24h': addTo(fullDayDoctors, setFullDayDoctors, config.maxDoctors); break;
    }
  }

  function handleRemoveDoctor(period: 'manha' | 'tarde' | 'noite' | '24h', index: number) {
    const removeFrom = (arr: ShiftSlot[], setArr: (v: ShiftSlot[]) => void) => {
      const copy = [...arr];
      copy.splice(index, 1);
      if (copy.length === 0) copy.push({ userId: '', isChief: false });
      setArr(copy);
    };

    switch (period) {
      case 'manha': removeFrom(manhaDoctors, setManhaDoctors); break;
      case 'tarde': removeFrom(tardeDoctors, setTardeDoctors); break;
      case 'noite': removeFrom(noiteDoctors, setNoiteDoctors); break;
      case '24h': removeFrom(fullDayDoctors, setFullDayDoctors); break;
    }
  }

  async function handleClearAll() {
    if (!hospitalId) return;
    setSaving(true);
    setErrorMsg(null);

    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('hospital_id', hospitalId)
      .eq('date', dateParam);

    if (error) {
      setErrorMsg('Erro ao limpar os plantões do dia.');
    } else {
      setManhaDoctors([{ userId: '', isChief: false }]);
      setTardeDoctors([{ userId: '', isChief: false }]);
      setNoiteDoctors([{ userId: '', isChief: false }]);
      setFullDayDoctors([{ userId: '', isChief: false }]);
    }
    setSaving(false);
  }

  async function handleSave() {
    if (!hospitalId) return;
    setSaving(true);
    setErrorMsg(null);

    const toInsert: any[] = [];

    const pushNonEmpty = (arr: ShiftSlot[], period: 'manha' | 'tarde' | 'noite' | '24h') => {
      for (const slot of arr) {
        if (slot.userId && slot.userId !== '') {
          toInsert.push({
            hospital_id: hospitalId,
            date: dateParam!,
            period,
            doctor_user_id: slot.userId,
            is_chief: slot.isChief,
          });
        }
      }
    };

    pushNonEmpty(manhaDoctors, 'manha');
    pushNonEmpty(tardeDoctors, 'tarde');
    pushNonEmpty(noiteDoctors, 'noite');
    pushNonEmpty(fullDayDoctors, '24h');

    try {
      const { error: delError } = await supabase
        .from('shifts')
        .delete()
        .eq('hospital_id', hospitalId)
        .eq('date', dateParam);

      if (delError) {
        setErrorMsg('Erro ao salvar plantões do dia: falha ao limpar registros antigos.');
        setSaving(false);
        return;
      }

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('shifts')
          .insert(toInsert);

        if (insertError) {
          setErrorMsg(`Erro ao salvar plantões do dia: ${insertError.message}`);
          setSaving(false);
          return;
        }
      }
      setSaving(false);
      router.push('/escala');
    } catch (err: any) {
      setErrorMsg('Erro ao salvar plantões do dia.');
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

    const toInsert: any[] = [];

    const pushNonEmpty = (arr: ShiftSlot[], period: string) => {
      for (const slot of arr) {
        if (slot.userId && slot.userId !== '') {
          toInsert.push({
            hospital_id: hospitalId,
            date: copyTargetDate,
            period,
            doctor_user_id: slot.userId,
            is_chief: slot.isChief,
          });
        }
      }
    };

    pushNonEmpty(manhaDoctors, 'manha');
    pushNonEmpty(tardeDoctors, 'tarde');
    pushNonEmpty(noiteDoctors, 'noite');
    pushNonEmpty(fullDayDoctors, '24h');

    try {
      const { error: delError } = await supabase
        .from('shifts')
        .delete()
        .eq('hospital_id', hospitalId)
        .eq('date', copyTargetDate);

      if (delError) return;

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('shifts')
          .insert(toInsert);
        if (insertError) {
            setErrorMsg(`Erro: ${insertError.message}`);
            setSaving(false);
            return;
        }
      }
      setSaving(false);
    } catch (err: any) {
      setSaving(false);
    }
  }

  function getAvailabilityStatus(userId: string, period: 'manha' | 'tarde' | 'noite' | '24h') {
    if (!userId) return null;
    if (period === '24h') {
      const periods = availability.filter((a) => a.user_id === userId).map((a) => a.period);
      if (periods.length === 0) return null;
      const hasManha = periods.includes('manha');
      const hasTarde = periods.includes('tarde');
      const hasNoite = periods.includes('noite');
      if (hasManha && hasTarde && hasNoite) {
        return { label: 'Disp. (M/T/N)', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      }
      return { label: 'Disp. parcial', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    const exists = availability.some((a) => a.user_id === userId && a.period === period);
    if (!exists) return { label: 'Sem anúncio', className: 'bg-slate-50 text-slate-500 border-slate-200' };
    return { label: 'Disponível', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }

  const periodStateMap: Record<string, { values: ShiftSlot[]; }> = {
    manha: { values: manhaDoctors },
    tarde: { values: tardeDoctors },
    noite: { values: noiteDoctors },
    '24h': { values: fullDayDoctors },
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-slate-500">{hospitalName}</p>
            <h1 className="text-lg font-semibold">Editar plantões do dia</h1>
            <p className="text-xs text-slate-500">{formattedDate}</p>
          </div>
          <button onClick={() => router.push('/escala')} className="text-xs border px-3 py-1.5 rounded-lg hover:bg-slate-50">
            Voltar para escala
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {errorMsg && (
          <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        <p className="text-xs text-slate-600 mb-2">
            Marque a caixa "CH" para indicar o Chefe de Plantão.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERIODS.map((p) => {
            const state = periodStateMap[p.key];
            return (
              <section key={p.key} className="bg-white rounded-xl shadow-sm border p-4 flex flex-col">
                <div className="flex items-baseline justify-between mb-3 border-b pb-2">
                  <h2 className="font-semibold text-sm text-slate-800">{p.label}</h2>
                  <span className="text-[10px] text-slate-400">Máx. {p.maxDoctors}</span>
                </div>

                <div className="flex flex-col gap-2">
                  {state.values.map((slot, index) => {
                    const status = getAvailabilityStatus(slot.userId, p.key as any);

                    return (
                      <div 
                        key={`${p.key}-${index}`} 
                        className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200"
                      >
                        {/* SELECT (Com min-w-0 para não estourar) */}
                        <div className="flex-1 min-w-0">
                          <select
                            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-slate-400 outline-none"
                            value={slot.userId}
                            onChange={(e) => handleDoctorChange(p.key as any, index, e.target.value)}
                          >
                            <option value="">Selecione um médico...</option>
                            {sortedDoctors.map((doc) => (
                              <option key={doc.id} value={doc.id}>
                                {doc.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Controles (CH + Badge + Remover) */}
                        <div className="flex items-center gap-2 justify-between sm:justify-end shrink-0">
                          
                          {/* Checkbox CH */}
                          <label 
                            title="Chefe de Plantão"
                            className={`flex items-center gap-1 cursor-pointer select-none border rounded px-1.5 py-1 transition ${
                              slot.isChief 
                                ? 'bg-slate-800 border-slate-800 text-white' 
                                : 'bg-white border-slate-300 text-slate-400 hover:border-slate-400'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              className="hidden" // Esconde o checkbox nativo, usa visual customizado
                              checked={slot.isChief}
                              onChange={(e) => handleToggleChief(p.key as any, index, e.target.checked)}
                            />
                            <span className="text-[9px] font-bold">CH</span>
                          </label>

                          {/* Badge de Disponibilidade (Compacto) */}
                          {status ? (
                            <span 
                              className={`text-[9px] px-1.5 py-1 rounded border whitespace-nowrap ${status.className}`}
                              title={status.label}
                            >
                              {status.label === 'Disponível' ? 'Disp.' : status.label}
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-300 px-1 select-none">
                              —
                            </span>
                          )}

                          {/* Botão Remover */}
                          {state.values.length > 1 && (
                            <button
                              type="button"
                              className="w-6 h-6 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition"
                              onClick={() => handleRemoveDoctor(p.key as any, index)}
                              title="Remover vaga"
                            >
                              <span className="text-xs font-bold">×</span>
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
                  className="mt-3 w-full py-2 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                >
                  + Adicionar vaga
                </button>
              </section>
            );
          })}
        </div>
        
        {/* Rodapé com Cópia e Save */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-4 bg-white p-4 rounded-xl shadow-sm border">
            <button
              type="button"
              onClick={handleClearAll}
              disabled={saving}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              Limpar dia
            </button>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-medium">COPIAR PARA:</span>
                <input
                  type="date"
                  value={copyTargetDate}
                  onChange={(e) => setCopyTargetDate(e.target.value)}
                  className="bg-transparent border-none text-xs focus:ring-0 text-slate-700 p-0"
                />
                <button
                  type="button"
                  onClick={handleCopyToDate}
                  disabled={saving}
                  className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50 pl-2 border-l border-slate-200"
                >
                  Copiar
                </button>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="text-xs px-6 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 font-medium shadow-sm shadow-slate-300"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
        </div>
      </main>
    </div>
  );
}

export default function EditarPlantaoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100 flex items-center justify-center">Carregando...</div>}>
      <EditarPlantaoContent />
    </Suspense>
  );
}