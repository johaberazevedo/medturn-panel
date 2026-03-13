'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
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

  const [adminHospitalIds, setAdminHospitalIds] = useState<string[]>([]);

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
    async function loadConflicts() {
      setLoading(true);
      setErrorMsg(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const { data: memberships, error: memError } = await supabase
          .from('hospital_users')
          .select('hospital_id, role, is_admin, hospitals(name)')
          .eq('user_id', user.id);

        if (memError) {
          setErrorMsg(memError.message);
          setLoading(false);
          return;
        }

        const adminMemberships = ((memberships ?? []) as AdminMembership[]).filter((m) => {
          return m.is_admin === true || m.role === 'admin' || m.role === 'coordenador';
        });

        const hospitalIds = adminMemberships.map((m) => m.hospital_id);
        setAdminHospitalIds(hospitalIds);

        if (hospitalIds.length === 0) {
          setConflicts([]);
          setLoading(false);
          return;
        }

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
          .in('hospital_id', hospitalIds)
          .gte('date', dateRange.start)
          .lt('date', dateRange.end)
          .not('doctor_user_id', 'is', null)
          .in('period', ['manha', 'tarde', 'noite']);

        if (shiftError) {
          setErrorMsg(shiftError.message);
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
          const uniqueHospitalsMap = new Map<string, { hospital_id: string; hospital_name: string }>();

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
              a.hospital_name.localeCompare(b.hospital_name, 'pt-BR', { sensitivity: 'base' })
            ),
          });
        }

        nextConflicts.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          if (a.period !== b.period) return a.period.localeCompare(b.period);
          return a.doctor_name.localeCompare(b.doctor_name, 'pt-BR', { sensitivity: 'base' });
        });

        setConflicts(nextConflicts);
      } catch (e: any) {
        setErrorMsg(e?.message ?? 'Erro ao carregar conflitos.');
      } finally {
        setLoading(false);
      }
    }

    loadConflicts();
  }, [router, dateRange.start, dateRange.end]);

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
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase text-slate-500">Painel do hospital</p>
            <h1 className="text-xl font-semibold">Conflitos de escala</h1>
            <p className="text-[11px] text-slate-500">
              Mesmo médico, mesma data e mesmo período em hospitais diferentes.
            </p>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
          >
            Voltar ao dashboard
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white border rounded-xl p-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Mês analisado</h2>
            <p className="text-[11px] text-slate-500">
              A análise considera os hospitais onde você é administrador da escala.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
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
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}

        {loading && (
          <div className="bg-white border rounded-xl p-4">
            <p className="text-sm text-slate-600">Carregando conflitos...</p>
          </div>
        )}

        {!loading && !errorMsg && adminHospitalIds.length === 0 && (
          <div className="bg-white border rounded-xl p-4">
            <p className="text-sm text-slate-600">
              Você não possui hospitais com permissão de admin para analisar conflitos.
            </p>
          </div>
        )}

        {!loading && !errorMsg && adminHospitalIds.length > 0 && conflicts.length === 0 && (
          <div className="bg-white border rounded-xl p-4">
            <p className="text-sm text-slate-600">Nenhum conflito encontrado nesse período.</p>
          </div>
        )}

        {!loading && !errorMsg && conflicts.length > 0 && (
          <div className="space-y-3">
            {conflicts.map((item) => (
              <div
                key={`${item.doctor_user_id}-${item.date}-${item.period}`}
                className="bg-white border border-amber-300 rounded-xl p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">{item.doctor_name}</h2>
                    <p className="text-[11px] text-slate-500">
                      {formatDateBR(item.date)} • {periodLabel(item.period)}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.hospitals.map((hospital) => (
                        <span
                          key={hospital.hospital_id}
                          className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700"
                        >
                          {hospital.hospital_name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/escala/editar?date=${item.date}`)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
                    >
                      Ver data
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
                )}
      </main>
    </div>
  );
}

export default function ConflitosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <p className="text-sm text-slate-600">Carregando conflitos...</p>
        </div>
      }
    >
      <ConflitosPageContent />
    </Suspense>
  );
}