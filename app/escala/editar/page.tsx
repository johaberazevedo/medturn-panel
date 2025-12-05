'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type DoctorOption = {
  id: string;
  name: string;
  email: string | null;
};

type HospitalUserRow = {
  user_id: string;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
};

type ShiftRow = {
  id: number;
  period: 'manha' | 'tarde' | 'noite' | '24h';
  doctor_user_id: string | null;
};

// Disponibilidade no Supabase (futuro POST /availability)
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

export default function EditarPlantaoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dateParam = searchParams.get('date');

  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('Hospital');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [doctors, setDoctors] = useState<DoctorOption[]>([]);

  const [manhaDoctors, setManhaDoctors] = useState<(string | '')[]>(['']);
  const [tardeDoctors, setTardeDoctors] = useState<(string | '')[]>(['']);
  const [noiteDoctors, setNoiteDoctors] = useState<(string | '')[]>(['']);
  const [fullDayDoctors, setFullDayDoctors] = useState<(string | '')[]>(['']);

  // Copiar escala deste dia para outra data
  const [copyTargetDate, setCopyTargetDate] = useState<string>('');

  // Disponibilidade dos médicos para este dia (manha/tarde/noite)
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);

  const sortedDoctors = useMemo(() => {
    return [...doctors].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );
  }, [doctors]);

  if (!dateParam) {
    return <div>Data inválida.</div>;
  }

  // --- CORREÇÃO DO FUSO HORÁRIO (SOLUÇÃO 1) ---
  // Fazemos o parse manual da string YYYY-MM-DD para criar a data no fuso local
  // e evitar que o new Date() use UTC e subtraia horas (caindo no dia anterior).
  const [yearStr, monthStr, dayStr] = dateParam.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // JS conta meses de 0 a 11
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
  // ---------------------------------------------

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
    setHospitalName(membership.hospitals?.name ?? 'Hospital');

    const { data: rows, error } = await supabase
      .from('hospital_users')
      .select('user_id, users(full_name, email)')
      .eq('hospital_id', hospital_id);

    if (error) {
      setErrorMsg('Erro ao carregar médicos do hospital.');
      return hospital_id;
    }

    const mapped: DoctorOption[] = (rows as HospitalUserRow[]).map((row) => ({
      id: row.user_id,
      name:
        row.users?.full_name ??
        row.users?.email ??
        'Médico sem nome',
      email: row.users?.email ?? null,
    }));

    mapped.sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );

    setDoctors(mapped);
    return hospital_id;
  }

  async function loadShiftsForDay(hospital_id: string) {
    const { data, error } = await supabase
      .from('shifts')
      .select('id, period, doctor_user_id')
      .eq('hospital_id', hospital_id)
      .eq('date', dateParam);

    if (error) {
      setErrorMsg('Erro ao carregar plantões do dia.');
      return;
    }

    const rows = (data ?? []) as ShiftRow[];

    const manha = rows
      .filter((r) => r.period === 'manha')
      .map((r) => r.doctor_user_id ?? '');
    const tarde = rows
      .filter((r) => r.period === 'tarde')
      .map((r) => r.doctor_user_id ?? '');
    const noite = rows
      .filter((r) => r.period === 'noite')
      .map((r) => r.doctor_user_id ?? '');
    const full = rows
      .filter((r) => r.period === '24h')
      .map((r) => r.doctor_user_id ?? '');

    setManhaDoctors(manha.length > 0 ? manha : ['']);
    setTardeDoctors(tarde.length > 0 ? tarde : ['']);
    setNoiteDoctors(noite.length > 0 ? noite : ['']);
    setFullDayDoctors(full.length > 0 ? full : ['']);
  }

  async function loadAvailabilityForDay(hospital_id: string) {
    // Tabela esperada: availability(hospital_id, user_id, date, period)
    const { data, error } = await supabase
      .from('availability')
      .select('user_id, period')
      .eq('hospital_id', hospital_id)
      .eq('date', dateParam);

    if (!error && data) {
      setAvailability(data as AvailabilityRow[]);
    } else {
      // Se der erro (ex: tabela ainda não existe), só não mostra os badges
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
    value: string
  ) {
    const update = (
      arr: (string | '')[],
      setArr: (v: (string | '')[]) => void
    ) => {
      const copy = [...arr];
      copy[index] = value;
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

  function handleAddDoctor(period: 'manha' | 'tarde' | 'noite' | '24h') {
    const addTo = (
      arr: (string | '')[],
      setArr: (v: (string | '')[]) => void,
      max: number
    ) => {
      if (arr.length >= max) return;
      setArr([...arr, '']);
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
    const removeFrom = (
      arr: (string | '')[],
      setArr: (v: (string | '')[]) => void
    ) => {
      const copy = [...arr];
      copy.splice(index, 1);
      if (copy.length === 0) copy.push('');
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
      setManhaDoctors(['']);
      setTardeDoctors(['']);
      setNoiteDoctors(['']);
      setFullDayDoctors(['']);
    }

    setSaving(false);
  }

  async function handleSave() {
    if (!hospitalId) return;

    setSaving(true);
    setErrorMsg(null);

    const toInsert: {
      hospital_id: string;
      date: string;
      period: 'manha' | 'tarde' | 'noite' | '24h';
      doctor_user_id: string;
    }[] = [];

    const pushNonEmpty = (
      arr: (string | '')[],
      period: 'manha' | 'tarde' | 'noite' | '24h'
    ) => {
      for (const id of arr) {
        if (id && id !== '') {
          toInsert.push({
            hospital_id: hospitalId,
            date: dateParam!,
            period,
            doctor_user_id: id,
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
          setErrorMsg(
            `Erro ao salvar plantões do dia: ${insertError.message}`
          );
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

    const toInsert: {
      hospital_id: string;
      date: string;
      period: 'manha' | 'tarde' | 'noite' | '24h';
      doctor_user_id: string;
    }[] = [];

    const pushNonEmpty = (
      arr: (string | '')[],
      period: 'manha' | 'tarde' | 'noite' | '24h'
    ) => {
      for (const id of arr) {
        if (id && id !== '') {
          toInsert.push({
            hospital_id: hospitalId,
            date: copyTargetDate,
            period,
            doctor_user_id: id,
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

      if (delError) {
        setErrorMsg('Erro ao limpar plantões da data de destino.');
        setSaving(false);
        return;
      }

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('shifts')
          .insert(toInsert);

        if (insertError) {
          setErrorMsg(
            `Erro ao copiar escala para a data de destino: ${insertError.message}`
          );
          setSaving(false);
          return;
        }
      }

      setSaving(false);
    } catch (err: any) {
      setErrorMsg('Erro ao copiar escala para a data de destino.');
      setSaving(false);
    }
  }

  function getAvailabilityStatus(
    userId: string,
    period: 'manha' | 'tarde' | 'noite' | '24h'
  ): { label: string; className: string } | null {
    if (!userId) return null;

    if (period === '24h') {
      const periods = availability
        .filter((a) => a.user_id === userId)
        .map((a) => a.period);

      if (periods.length === 0) {
        return null; // não mostra nada para 24h sem info
      }

      const hasManha = periods.includes('manha');
      const hasTarde = periods.includes('tarde');
      const hasNoite = periods.includes('noite');

      if (hasManha && hasTarde && hasNoite) {
        return {
          label: 'Disponível (M/T/N)',
          className:
            'bg-emerald-50 text-emerald-700 border border-emerald-200',
        };
      }

      return {
        label: 'Disponível parcial',
        className: 'bg-amber-50 text-amber-700 border border-amber-200',
      };
    }

    const exists = availability.some(
      (a) => a.user_id === userId && a.period === period
    );

    if (!exists) {
      return {
        label: 'Sem anúncio',
        className: 'bg-slate-50 text-slate-500 border border-slate-200',
      };
    }

    return {
      label: 'Disponível',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    };
  }

  const periodStateMap: Record<
    'manha' | 'tarde' | 'noite' | '24h',
    {
      values: (string | '')[];
      setter: (v: (string | '')[]) => void;
    }
  > = {
    manha: {
      values: manhaDoctors,
      setter: setManhaDoctors,
    },
    tarde: {
      values: tardeDoctors,
      setter: setTardeDoctors,
    },
    noite: {
      values: noiteDoctors,
      setter: setNoiteDoctors,
    },
    '24h': {
      values: fullDayDoctors,
      setter: setFullDayDoctors,
    },
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-slate-500">
              {hospitalName}
            </p>
            <h1 className="text-lg font-semibold">
              Editar plantões do dia
            </h1>
            <p className="text-xs text-slate-500">
              {formattedDate}
            </p>
          </div>

          <button
            onClick={() => router.push('/escala')}
            className="text-xs border px-3 py-1.5 rounded-lg hover:bg-slate-50"
          >
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
          Defina os médicos responsáveis por cada período. Os selos de
          disponibilidade aparecem de acordo com o que cada um anunciou
          (manhã/tarde/noite) no app.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERIODS.map((p) => {
            const state = periodStateMap[p.key];

            return (
              <section
                key={p.key}
                className="bg-white rounded-xl shadow-sm border p-4"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <h2 className="font-semibold text-sm">{p.label}</h2>
                  <span className="text-[11px] text-slate-500">
                    Máx. {p.maxDoctors} médicos
                  </span>
                </div>

                <div className="space-y-2">
                  {state.values.map((value, index) => {
                    const status = getAvailabilityStatus(value, p.key);

                    return (
                      <div
                        key={`${p.key}-${index}`}
                        className="flex items-center gap-2"
                      >
                        <div className="flex-1 flex items-center gap-2">
                          <select
                            className="flex-1 border rounded-lg px-2 py-1.5 text-sm"
                            value={value}
                            onChange={(e) =>
                              handleDoctorChange(
                                p.key,
                                index,
                                e.target.value
                              )
                            }
                          >
                            <option value="">
                              Selecione um médico
                            </option>
                            {sortedDoctors.map((doc) => (
                              <option key={doc.id} value={doc.id}>
                                {doc.name}
                                {doc.email ? ` — ${doc.email}` : ''}
                              </option>
                            ))}
                          </select>

                          {state.values.length > 1 && (
                            <button
                              type="button"
                              className="text-[11px] text-red-500 hover:text-red-600"
                              onClick={() =>
                                handleRemoveDoctor(p.key, index)
                              }
                            >
                              remover
                            </button>
                          )}
                        </div>

                        {status && (
                          <span
                            className={
                              'text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ' +
                              status.className
                            }
                          >
                            {status.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddDoctor(p.key)}
                  className="mt-2 text-[11px] text-slate-600 hover:text-slate-800"
                >
                  + adicionar médico
                </button>
              </section>
            );
          })}
        </div>

        {availability.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border p-4">
            <h3 className="text-sm font-semibold mb-2">
              Disponibilidade cadastrada no app
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border rounded-lg border-collapse">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2 py-1 border text-left">Médico</th>
                    <th className="px-2 py-1 border text-center">Manhã</th>
                    <th className="px-2 py-1 border text-center">Tarde</th>
                    <th className="px-2 py-1 border text-center">Noite</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doc) => {
                    const has = (period: 'manha' | 'tarde' | 'noite') =>
                      availability.some(
                        (a) => a.user_id === doc.id && a.period === period
                      );

                    return (
                      <tr key={doc.id} className="border-t">
                        <td className="px-2 py-1">
                          <div className="flex flex-col">
                            <span className="font-medium">{doc.name}</span>
                            {doc.email && (
                              <span className="text-slate-400 text-[10px]">
                                {doc.email}
                              </span>
                            )}
                          </div>
                        </td>

                        {(['manha', 'tarde', 'noite'] as const).map((p) => (
                          <td
                            key={p}
                            className="px-2 py-1 text-center align-middle"
                          >
                            {has(p) ? (
                              <span className="text-emerald-600 text-xs">●</span>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-2 text-[10px] text-slate-500">
              Tabela apenas informativa. A disponibilidade vem do app do médico
              e não altera automaticamente a escala.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-4">
          <button
            type="button"
            onClick={handleClearAll}
            disabled={saving}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Limpar todos os plantões do dia
          </button>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-slate-600 whitespace-nowrap">
                Copiar esta escala para:
              </label>
              <input
                type="date"
                value={copyTargetDate}
                onChange={(e) => setCopyTargetDate(e.target.value)}
                className="border rounded-lg px-2 py-1.5 text-xs"
              />
            </div>
            <button
              type="button"
              onClick={handleCopyToDate}
              disabled={saving}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-60"
            >
              Copiar escala para data
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-xs px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Salvar plantões do dia'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}