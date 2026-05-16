'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type HospitalOption = {
  id: string;
  name: string | null;
};

type ShiftRow = {
  id: number;
  date: string;
  period: 'manha' | 'tarde' | 'noite' | '24h';
  is_chief: boolean | null;
  badge: string | null;
  users: {
    full_name: string | null;
  } | null;
};

function localYYYYMMDD(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(dateStr: string, amount: number) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + amount);
  return localYYYYMMDD(d);
}

function formatDateLabel(dateStr: string) {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const d = new Date(dateStr + 'T12:00:00');

  return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const PERIODS: Array<{ key: ShiftRow['period']; label: string; icon: string }> = [
  { key: 'manha', label: 'Manhã', icon: '🌅' },
  { key: 'tarde', label: 'Tarde', icon: '☀️' },
  { key: 'noite', label: 'Noite', icon: '🌙' },
];

export default function CoordenadorEscalaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [userName, setUserName] = useState('Coordenador(a)');
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(localYYYYMMDD());
  const [shifts, setShifts] = useState<ShiftRow[]>([]);

  const selectedHospitalName = useMemo(() => {
    return hospitals.find((h) => h.id === selectedHospitalId)?.name ?? 'Hospital';
  }, [hospitals, selectedHospitalId]);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      setUserName(profile?.full_name?.split(' ')[0] ?? 'Coordenador(a)');

      const { data: memberships, error: membershipsError } = await supabase
        .from('hospital_users')
        .select('role, is_admin, hospital_id, hospitals(id, name)')
        .eq('user_id', user.id);

      if (membershipsError) {
        console.error('Erro ao carregar vínculos:', membershipsError);
        router.push('/login');
        return;
      }

      const membershipsList = memberships ?? [];

      const hasAdminRole = membershipsList.some(
        (item: any) => item.is_admin === true || item.role === 'admin'
      );

      const hasDoctorRole = membershipsList.some((item: any) => item.role === 'doctor');

      const hasCoordinatorRole = membershipsList.some(
        (item: any) => item.role === 'coordenador'
      );

      const canViewCoordinatorScale = hasAdminRole || hasCoordinatorRole;

      if (!canViewCoordinatorScale) {
        if (hasDoctorRole) {
          router.push('/medico');
        } else {
          router.push('/login');
        }

        return;
      }

      const coordinatorHospitals = (memberships ?? [])
        .filter((item: any) => {
          return (
            item.is_admin === true ||
            item.role === 'admin' ||
            item.role === 'coordenador'
          );
        })
        .map((item: any) => {
          const hospital = Array.isArray(item.hospitals) ? item.hospitals[0] : item.hospitals;

          return {
            id: hospital?.id ?? item.hospital_id,
            name: hospital?.name ?? 'Hospital',
          };
        })
        .filter((item: HospitalOption) => !!item.id);

      const initialHospitalId = coordinatorHospitals[0]?.id ?? null;

setHospitals(coordinatorHospitals);
setSelectedHospitalId(initialHospitalId);

if (initialHospitalId && typeof window !== 'undefined') {
  window.localStorage.setItem(`activeHospitalId:${user.id}`, initialHospitalId);
  window.localStorage.setItem('activeHospitalId', initialHospitalId);
}

setLoading(false);
    }

    init();
  }, [router]);

  useEffect(() => {
    async function loadShifts() {
      if (!selectedHospitalId) return;

      setLoadingShifts(true);

      const { data, error } = await supabase
        .from('shifts')
        .select(`
          id,
          date,
          period,
          is_chief,
          badge,
          users:doctor_user_id (
            full_name
          )
        `)
        .eq('hospital_id', selectedHospitalId)
        .eq('date', selectedDate)
        .in('period', ['manha', 'tarde', 'noite'])
        .order('period', { ascending: true });

if (error) {
  console.error('Erro ao carregar escala diária:', error);
  setShifts([]);
} else {
  const visibleShifts = (data ?? [])
  .filter((shift: any) => {
    const badge = shift.badge?.trim().toUpperCase() ?? '';

    return badge !== 'FERI';
  })
  .map((shift: any) => ({
    ...shift,
    users: Array.isArray(shift.users) ? shift.users[0] ?? null : shift.users,
  }));

setShifts(visibleShifts as ShiftRow[]);
}

      setLoadingShifts(false);
    }

    loadShifts();
  }, [selectedHospitalId, selectedDate]);

  function getPeriodShifts(period: ShiftRow['period']) {
  return shifts
    .filter((shift) => shift.period === period)
    .sort((a, b) => {
      if (a.is_chief && !b.is_chief) return -1;
      if (!a.is_chief && b.is_chief) return 1;

      const aHasBadge = !!(a.badge ?? '').trim();
      const bHasBadge = !!(b.badge ?? '').trim();

      if (aHasBadge && !bHasBadge) return -1;
      if (!aHasBadge && bHasBadge) return 1;

      const nameA = a.users?.full_name ?? '';
      const nameB = b.users?.full_name ?? '';

      return nameA.localeCompare(nameB, 'pt-BR', {
        sensitivity: 'base',
      });
    });
}

  async function handleHospitalChange(nextHospitalId: string) {
    setSelectedHospitalId(nextHospitalId);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && typeof window !== 'undefined') {
      window.localStorage.setItem(`activeHospitalId:${user.id}`, nextHospitalId);
      window.localStorage.setItem('activeHospitalId', nextHospitalId);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <div className="rounded-[32px] border border-slate-100 bg-white px-6 py-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Carregando escala...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <header className="border-b border-slate-100 bg-white/90 px-6 py-5 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#40C0A2]">
                MedTurn • Coordenador
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                Escala diária
              </h1>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                Olá, {userName}. Visualização rápida da escala em modo leitura.
              </p>
            </div>

            <button
              onClick={() => router.push('/perfil')}
              className="w-fit rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95"
            >
              Perfil
            </button>
          </div>

          <div className="mt-5 grid gap-3 rounded-[32px] border border-slate-100 bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Hospital
              </label>

              {hospitals.length > 1 ? (
                <select
                  value={selectedHospitalId ?? ''}
                  onChange={(e) => handleHospitalChange(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#40C0A2]"
                >
                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.name ?? 'Hospital'}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-black text-slate-900">
                  {selectedHospitalName}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Data
              </label>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#40C0A2]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 md:w-[260px]">
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 active:scale-95"
              >
                Ontem
              </button>

              <button
                onClick={() => setSelectedDate(localYYYYMMDD())}
                className="rounded-2xl bg-slate-950 px-3 py-3 text-[10px] font-black uppercase tracking-wider text-white hover:bg-slate-800 active:scale-95"
              >
                Hoje
              </button>

              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 active:scale-95"
              >
                Amanhã
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-5 rounded-[30px] border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {selectedHospitalName}
          </p>

          <div className="mt-1 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              {formatDateLabel(selectedDate)}
            </h2>

            <p className="text-[11px] font-semibold text-slate-400">
              {loadingShifts
  ? 'Atualizando plantões...'
  : `${shifts.length} profissional${shifts.length === 1 ? '' : 'ais'} escalado${shifts.length === 1 ? '' : 's'} no dia`}
            </p>
          </div>
        </div>

        {loadingShifts ? (
          <div className="rounded-[34px] border border-slate-100 bg-white p-6 text-sm font-semibold text-slate-400 shadow-sm">
            Carregando plantões...
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
  {PERIODS.map((period) => {
              const periodShifts = getPeriodShifts(period.key);

              return (
                <section
                  key={period.key}
                  className="overflow-hidden rounded-[34px] border border-slate-100 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
                        {period.icon} Período
                      </p>

                      <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                        {period.label}
                      </h3>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {periodShifts.length} escala{periodShifts.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="p-4">
                    {periodShifts.length === 0 ? (
                      <div className="rounded-3xl bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-400">
                        Nenhum profissional escalado.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {periodShifts.map((shift) => (
                          <div
                            key={shift.id}
                            className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3.5"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="min-w-0 flex-1 truncate text-sm font-black text-slate-900">
                                {shift.users?.full_name ?? 'Profissional não definido'}
                              </p>

                              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                                {shift.is_chief && (
                                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-amber-700">
                                    Chefe
                                  </span>
                                )}

                                {shift.badge && (
                                  <span className="rounded-full border border-slate-100 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">
                                    {shift.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}