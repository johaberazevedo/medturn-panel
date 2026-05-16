'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type AdminMembership = {
  hospital_id: string;
  role: string | null;
  is_admin: boolean | null;
  hospitals:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
};

type ShiftConflictRow = {
  id: number;
  hospital_id: string;
  date: string;
  period: 'manha' | 'tarde' | 'noite' | '24h' | string;
  doctor_user_id: string | null;
  hospitals: {
    name: string | null;
  } | null;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
};

type ConflictItem = {
  doctor_user_id: string;
  doctor_name: string;
  date: string;
  period: string;
  hospitals: Array<{
    hospital_id: string;
    hospital_name: string;
  }>;
};

function formatDateBR(dateStr: string) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);

  if (Number.isNaN(d.getTime())) return dateStr;

  return d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function periodLabel(p: string) {
  switch (p) {
    case 'manha':
      return 'Manhã';
    case 'tarde':
      return 'Tarde';
    case 'noite':
      return 'Noite';
    case '24h':
      return '24h';
    default:
      return p;
  }
}

function ConflitosPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [adminHospitalIds, setAdminHospitalIds] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const conflictsRequestIdRef = useRef(0);

  const today = new Date();

  const monthParam = Number(searchParams.get('month'));
  const yearParam = Number(searchParams.get('year'));

  const initialMonth =
    Number.isInteger(monthParam) && monthParam >= 1 && monthParam <= 12
      ? monthParam
      : today.getMonth() + 1;

  const initialYear =
    Number.isInteger(yearParam) && yearParam >= 2020 && yearParam <= 2100
      ? yearParam
      : today.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);

  const dateRange = useMemo(() => {
    const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;

    const nextMonthDate =
      selectedMonth === 12
        ? new Date(selectedYear + 1, 0, 1)
        : new Date(selectedYear, selectedMonth, 1);

    const end = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`;

    return { start, end };
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    const monthParam = Number(searchParams.get('month'));
    const yearParam = Number(searchParams.get('year'));

    if (Number.isInteger(monthParam) && monthParam >= 1 && monthParam <= 12) {
      setSelectedMonth(monthParam);
    }

    if (Number.isInteger(yearParam) && yearParam >= 2020 && yearParam <= 2100) {
      setSelectedYear(yearParam);
    }
  }, [searchParams]);

  useEffect(() => {
    async function initAdminHospitals() {
      setLoading(true);
      setErrorMsg(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          router.push('/login');
          return;
        }

        const { data: memberships, error: memError } = await supabase
          .from('hospital_users')
          .select('hospital_id, role, is_admin, hospitals(name)')
          .eq('user_id', user.id);

        if (memError) {
          setErrorMsg(memError.message);
          setAdminHospitalIds([]);
          setConflicts([]);
          setInitialized(true);
          setLoading(false);
          return;
        }

        const allMemberships = ((memberships ?? []) as AdminMembership[]);

const adminMemberships = allMemberships.filter((m) => {
  return m.is_admin === true || m.role === 'admin';
});

const hasCoordinatorRole = allMemberships.some((m) => m.role === 'coordenador');

if (adminMemberships.length === 0) {
  setAdminHospitalIds([]);
  setConflicts([]);
  setInitialized(true);
  setLoading(false);

  if (hasCoordinatorRole) {
    router.replace('/coordenador/escala');
  } else {
    router.replace('/medico');
  }

  return;
}

        const hospitalIds = adminMemberships.map((m) => m.hospital_id);

        setAdminHospitalIds(hospitalIds);
        setInitialized(true);

        if (hospitalIds.length === 0) {
          setConflicts([]);
          setLoading(false);
        }
      } catch (e: any) {
        setErrorMsg(e?.message ?? 'Erro ao carregar hospitais do administrador.');
        setAdminHospitalIds([]);
        setConflicts([]);
        setInitialized(true);
        setLoading(false);
      }
    }

    initAdminHospitals();
  }, [router]);

  useEffect(() => {
    if (!initialized) return;

    async function loadConflicts() {
      const requestId = conflictsRequestIdRef.current + 1;
      conflictsRequestIdRef.current = requestId;

      setLoading(true);
      setErrorMsg(null);

      if (adminHospitalIds.length === 0) {
        setConflicts([]);
        setLoading(false);
        return;
      }

      try {
        const { data: shiftRows, error: shiftError } = await supabase
          .from('shifts')
          .select(`
            id,
            hospital_id,
            date,
            period,
            doctor_user_id,
            hospitals(name),
            users:doctor_user_id(full_name, email)
          `)
          .in('hospital_id', adminHospitalIds)
          .gte('date', dateRange.start)
          .lt('date', dateRange.end)
          .not('doctor_user_id', 'is', null)
          .in('period', ['manha', 'tarde', 'noite']);

        if (requestId !== conflictsRequestIdRef.current) {
          return;
        }

        if (shiftError) {
          setErrorMsg(shiftError.message);
          setConflicts([]);
          setLoading(false);
          return;
        }

        const rows = (shiftRows ?? []).map((row: any) => ({
          ...row,
          hospitals: Array.isArray(row.hospitals) ? row.hospitals[0] : row.hospitals,
          users: Array.isArray(row.users) ? row.users[0] : row.users,
        })) as ShiftConflictRow[];

        const grouped = new Map<string, ShiftConflictRow[]>();

        for (const row of rows) {
          if (!row.doctor_user_id) continue;

          const key = `${row.doctor_user_id}__${row.date}__${row.period}`;
          const arr = grouped.get(key) ?? [];
          arr.push(row);
          grouped.set(key, arr);
        }

        const nextConflicts: ConflictItem[] = [];

        for (const [, group] of grouped) {
          const uniqueHospitalsMap = new Map<
            string,
            { hospital_id: string; hospital_name: string }
          >();

          for (const row of group) {
            uniqueHospitalsMap.set(row.hospital_id, {
              hospital_id: row.hospital_id,
              hospital_name: row.hospitals?.name ?? 'Hospital',
            });
          }

          const uniqueHospitals = Array.from(uniqueHospitalsMap.values());

          if (uniqueHospitals.length <= 1) continue;

          const base = group[0];

          nextConflicts.push({
            doctor_user_id: base.doctor_user_id!,
            doctor_name: base.users?.full_name ?? base.users?.email ?? 'Médico',
            date: base.date,
            period: base.period,
            hospitals: uniqueHospitals.sort((a, b) =>
              a.hospital_name.localeCompare(b.hospital_name, 'pt-BR', {
                sensitivity: 'base',
              })
            ),
          });
        }

        nextConflicts.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          if (a.period !== b.period) return a.period.localeCompare(b.period);
          return a.doctor_name.localeCompare(b.doctor_name, 'pt-BR', {
            sensitivity: 'base',
          });
        });

        setConflicts(nextConflicts);
      } catch (e: any) {
        if (requestId === conflictsRequestIdRef.current) {
          setErrorMsg(e?.message ?? 'Erro ao carregar conflitos.');
          setConflicts([]);
        }
      } finally {
        if (requestId === conflictsRequestIdRef.current) {
          setLoading(false);
        }
      }
    }

    loadConflicts();
  }, [initialized, adminHospitalIds, dateRange.start, dateRange.end]);

  const monthOptions = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  const currentYear = today.getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

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
                MedTurn • Segurança
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tighter text-slate-950">
                Conflitos de escala
              </h1>

              <p className="mt-2 text-[11px] font-semibold text-slate-400">
                Mesmo médico, mesma data e mesmo período em hospitais diferentes.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95"
              >
                Voltar ao dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-6 py-6 space-y-5">
        <section className="rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
                Análise
              </p>

              <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
                Mês analisado
              </h2>

              <p className="mt-1 text-[11px] font-semibold text-slate-400">
                A análise considera os hospitais onde você é administrador da escala.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#40C0A2]"
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#40C0A2]"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {errorMsg && (
          <div className="rounded-[28px] border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {loading && (
          <div className="rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Carregando conflitos...</p>
          </div>
        )}

        {!loading && !errorMsg && adminHospitalIds.length === 0 && (
          <div className="rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Você não possui hospitais com permissão de admin para analisar conflitos.
            </p>
          </div>
        )}

        {!loading && !errorMsg && adminHospitalIds.length > 0 && conflicts.length === 0 && (
          <div className="rounded-[34px] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-black text-emerald-700">
              Nenhum conflito encontrado nesse período.
            </p>

            <p className="mt-1 text-xs font-semibold text-emerald-700/70">
              As escalas analisadas não apresentam sobreposição entre hospitais.
            </p>
          </div>
        )}

        {!loading && !errorMsg && conflicts.length > 0 && (
          <section className="space-y-3">
            <div className="rounded-[34px] border border-amber-100 bg-amber-50 p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                Atenção
              </p>

              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                {conflicts.length} conflito(s) detectado(s)
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Revise os plantões abaixo para evitar sobreposição de escala.
              </p>
            </div>

            {conflicts.map((item) => (
              <div
                key={`${item.doctor_user_id}-${item.date}-${item.period}`}
                className="rounded-[34px] border border-amber-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                      Conflito
                    </p>

                    <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
                      {item.doctor_name}
                    </h2>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {formatDateBR(item.date)} • {periodLabel(item.period)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.hospitals.map((hospital) => (
                        <span
                          key={hospital.hospital_id}
                          className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black text-amber-700"
                        >
                          {hospital.hospital_name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/escala/editar?date=${item.date}`)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-100 active:scale-95"
                    >
                      Ver data
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default function ConflitosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="rounded-[32px] border border-slate-100 bg-white px-6 py-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Carregando conflitos...</p>
          </div>
        </div>
      }
    >
      <ConflitosPageContent />
    </Suspense>
  );
}