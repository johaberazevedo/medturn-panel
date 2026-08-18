'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// --- Helpers de Tipagem ---
type SituacaoLog =
  | 'realizada'
  | 'nao_finalizada'
  | 'nao_realizada'
  | 'aprovada_nao_refletida'
  | 'outro';

type FilterTab =
  | 'todas'
  | 'realizadas'
  | 'pendentes'
  | 'nao_realizadas';

type SwapRowRaw = {
  id: number;
  status: string | null;
  reason: string | null;
  created_at: string | null;
  updated_at: string | null;
  handled_at: string | null;
  handled_by_user_id: string | null;
  requester_user_id: string | null;
  target_user_id: string | null;
  from_shift_id: number | null;
  hospital_id: string | null;

  requester?: { full_name: string | null } | { full_name: string | null }[] | null;
  target?: { full_name: string | null } | { full_name: string | null }[] | null;
  handler?: { full_name: string | null } | { full_name: string | null }[] | null;
  hospital?: { name: string | null } | { name: string | null }[] | null;
  shift?:
    | {
        date: string | null;
        period: string | null;
        doctor_user_id: string | null;
      }
    | {
        date: string | null;
        period: string | null;
        doctor_user_id: string | null;
      }[]
    | null;
};

type SwapLogRow = {
  id: number;
  status: string;
  reason: string | null;
  created_at: string | null;
  updated_at: string | null;
  handled_at: string | null;
  handled_by_user_id: string | null;
  handler_name: string;

  requester_user_id: string | null;
  requester_name: string;

  target_user_id: string | null;
  target_name: string;

  from_shift_id: number | null;
  shift_date: string | null;
  shift_period: string | null;

  current_shift_owner_id: string | null;
  current_shift_owner_name: string;

  hospital_name: string;
  situacao_log: SituacaoLog;
};

// --- Funções Auxiliares ---

function firstObj<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getSituacaoLog(row: {
  status: string;
  target_user_id: string | null;
  current_shift_owner_id: string | null;
}): SituacaoLog {
  if (
    row.status === 'aprovado' &&
    !!row.target_user_id &&
    row.current_shift_owner_id === row.target_user_id
  ) {
    return 'realizada';
  }

  if (row.status === 'aprovado') {
    return 'aprovada_nao_refletida';
  }

  if (row.status === 'pendente') {
    return 'nao_finalizada';
  }

  if (row.status === 'rejeitado' || row.status === 'cancelado') {
    return 'nao_realizada';
  }

  return 'outro';
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShiftDate(dateStr: string | null) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    weekday: 'short',
  });
}

// Novos Helpers de Mês
function getMonthKey(dateStr: string | null) {
  if (!dateStr) return 'sem-data';
  const [year, month] = dateStr.split('-');
  return `${year}-${month}`;
}

function formatMonthLabel(monthKey: string) {
  if (monthKey === 'sem-data') return 'Sem data';
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}

function situacaoLabel(situacao: SituacaoLog) {
  switch (situacao) {
    case 'realizada': return 'Realizada';
    case 'nao_finalizada': return 'Pendente';
    case 'nao_realizada': return 'Não realizada';
    default: return '—';
  }
}

function situacaoClasses(situacao: SituacaoLog) {
  switch (situacao) {
    case 'realizada': return 'bg-emerald-100 text-emerald-700';
    case 'nao_finalizada': return 'bg-amber-100 text-amber-700';
    case 'nao_realizada': return 'bg-rose-100 text-rose-700';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function statusClasses(status: string) {
  switch (status) {
    case 'aprovado': return 'bg-emerald-50 text-emerald-700';
    case 'pendente': return 'bg-amber-50 text-amber-700';
    case 'rejeitado': return 'bg-red-50 text-red-700';
    case 'cancelado': return 'bg-slate-100 text-slate-600';
    default: return 'bg-slate-100 text-slate-700';
  }
}

function statusLabel(row: SwapLogRow) {
  return row.status === 'cancelado' && row.handled_at
    ? 'Cancelado pela coordenação'
    : row.status;
}

function normalizeName(name: string | null | undefined, fallback = '—') {
  return name?.trim() || fallback;
}

// --- Componente Principal ---

export default function TrocasLogPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SwapLogRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [tab, setTab] = useState<FilterTab>('todas');
  const [search, setSearch] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('todos');
  const [monthFilter, setMonthFilter] = useState('todos');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('shift_swap_requests')
          .select(`
            id, status, reason, created_at, updated_at, handled_at, handled_by_user_id,
            requester_user_id, target_user_id, from_shift_id, hospital_id,
            requester:requester_user_id(full_name),
            target:target_user_id(full_name),
            handler:handled_by_user_id(full_name),
            hospital:hospital_id(name),
            shift:from_shift_id(date, period, doctor_user_id)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        const rawRows = (data ?? []) as SwapRowRaw[];

        const currentOwnerIds = Array.from(
          new Set(
            rawRows
              .map((r) => firstObj(r.shift)?.doctor_user_id)
              .filter((id): id is string => !!id)
          )
        );

        let ownerNameMap = new Map<string, string>();
        if (currentOwnerIds.length > 0) {
          const { data: ownerUsers, error: ownerError } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', currentOwnerIds);

          if (ownerError) throw ownerError;
          ownerNameMap = new Map(
            (ownerUsers ?? []).map((u: any) => [u.id as string, normalizeName(u.full_name)])
          );
        }

        const normalized: SwapLogRow[] = rawRows
          .map((r) => {
            const requester = firstObj(r.requester);
            const target = firstObj(r.target);
            const handler = firstObj(r.handler);
            const hospital = firstObj(r.hospital);
            const shift = firstObj(r.shift);
            const currentShiftOwnerId = shift?.doctor_user_id ?? null;
            const status = r.status ?? 'desconhecido';

            return {
              id: r.id,
              status,
              reason: r.reason,
              created_at: r.created_at,
              updated_at: r.updated_at,
              handled_at: r.handled_at,
              handled_by_user_id: r.handled_by_user_id,
              handler_name: normalizeName(
                handler?.full_name,
                r.status === 'cancelado' && r.handled_at
                  ? 'Usuário removido'
                  : '—'
              ),
              requester_user_id: r.requester_user_id,
              requester_name: normalizeName(requester?.full_name),
              target_user_id: r.target_user_id,
              target_name: normalizeName(target?.full_name),
              from_shift_id: r.from_shift_id,
              shift_date: shift?.date ?? null,
              shift_period: shift?.period ?? null,
              current_shift_owner_id: currentShiftOwnerId,
              current_shift_owner_name: normalizeName(
                currentShiftOwnerId ? ownerNameMap.get(currentShiftOwnerId) : null
              ),
              hospital_name: normalizeName(hospital?.name, 'Hospital'),
              situacao_log: getSituacaoLog({
                status,
                target_user_id: r.target_user_id,
                current_shift_owner_id: currentShiftOwnerId,
              }),
            };
          })
          .filter(
            (r) =>
              r.situacao_log === 'realizada' ||
              r.situacao_log === 'nao_finalizada' ||
              r.situacao_log === 'nao_realizada'
          );

        setRows(normalized);
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err?.message ?? 'Erro ao carregar o histórico de trocas.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const hospitalOptions = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.hospital_name))).sort((a, b) =>
      a.localeCompare(b, 'pt-BR')
    );
  }, [rows]);

  const monthOptions = useMemo(() => {
    return Array.from(new Set(rows.map((r) => getMonthKey(r.shift_date)))).sort((a, b) =>
      b.localeCompare(a)
    );
  }, [rows]);

const monthScopedRows = useMemo(() => {
  if (monthFilter === 'todos') return rows;
  return rows.filter((r) => getMonthKey(r.shift_date) === monthFilter);
}, [rows, monthFilter]);

  const counters = useMemo(() => {
  return {
    todas: monthScopedRows.length,
    realizadas: monthScopedRows.filter((r) => r.situacao_log === 'realizada').length,
    pendentes: monthScopedRows.filter((r) => r.situacao_log === 'nao_finalizada').length,
    nao_realizadas: monthScopedRows.filter((r) => r.situacao_log === 'nao_realizada').length,
  };
}, [monthScopedRows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((r) => {
      if (tab === 'realizadas' && r.situacao_log !== 'realizada') return false;
      if (tab === 'pendentes' && r.situacao_log !== 'nao_finalizada') return false;
      if (tab === 'nao_realizadas' && r.situacao_log !== 'nao_realizada') return false;

      if (hospitalFilter !== 'todos' && r.hospital_name !== hospitalFilter) return false;
      if (monthFilter !== 'todos' && getMonthKey(r.shift_date) !== monthFilter) return false;

      if (!q) return true;

      const haystack = [
        String(r.id),
        r.hospital_name,
        r.requester_name,
        r.target_name,
        r.current_shift_owner_name,
        r.handler_name,
        r.status,
        r.situacao_log,
        r.reason ?? '',
        r.shift_date ?? '',
        r.shift_period ?? '',
      ].join(' ').toLowerCase();

      return haystack.includes(q);
    });
  }, [rows, tab, hospitalFilter, monthFilter, search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm font-medium text-slate-400">
        Carregando histórico de trocas...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white px-6 pt-8 pb-6 rounded-b-[40px] shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-600">
              Painel administrativo
            </p>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900">
              Histórico de Trocas
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Histórico das solicitações com desfecho real do plantão.
            </p>
          </div>

          <button
            onClick={() => router.back()}
            className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 active:scale-95"
          >
            Voltar
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryCard label="Todas" value={counters.todas} />
          <SummaryCard label="Realizadas" value={counters.realizadas} />
          <SummaryCard label="Pendentes" value={counters.pendentes} />
          <SummaryCard label="Não realizadas" value={counters.nao_realizadas} />
        </div>
      </header>

      <main className="p-6 space-y-4">
        {errorMessage && (
          <div className="rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-2">
            <TabButton active={tab === 'todas'} label={`Todas (${counters.todas})`} onClick={() => setTab('todas')} />
            <TabButton active={tab === 'realizadas'} label={`Realizadas (${counters.realizadas})`} onClick={() => setTab('realizadas')} />
            <TabButton active={tab === 'pendentes'} label={`Pendentes (${counters.pendentes})`} onClick={() => setTab('pendentes')} />
            <TabButton active={tab === 'nao_realizadas'} label={`Não realizadas (${counters.nao_realizadas})`} onClick={() => setTab('nao_realizadas')} />
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por hospital, médico, status, data..."
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
            />

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
            >
              <option value="todos">Todos os meses</option>
              {monthOptions.map((monthKey) => (
                <option key={monthKey} value={monthKey}>
                  {formatMonthLabel(monthKey)}
                </option>
              ))}
            </select>

            <select
              value={hospitalFilter}
              onChange={(e) => setHospitalFilter(e.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-sky-400"
            >
              <option value="todos">Todos os hospitais</option>
              {hospitalOptions.map((hospital) => (
                <option key={hospital} value={hospital}>{hospital}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredRows.length === 0 ? (
            <div className="rounded-[32px] border border-slate-100 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
              Nenhuma troca encontrada com os filtros atuais.
            </div>
          ) : (
            filteredRows.map((row) => (
              <div key={row.id} className="rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Solicitação #{row.id}</p>
                    <h2 className="mt-1 text-base font-black text-slate-900">{row.hospital_name}</h2>
                    <p className="mt-1 text-sm text-slate-500 capitalize">
                      {formatShiftDate(row.shift_date)} • {row.shift_period ?? '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={statusClasses(row.status)}>{statusLabel(row)}</Badge>
                    <Badge className={situacaoClasses(row.situacao_log)}>{situacaoLabel(row.situacao_log)}</Badge>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <InfoItem label="Solicitante" value={row.requester_name} />
                  <InfoItem label="Alvo da troca" value={row.target_name} />
                  <InfoItem label="Dono atual do plantão" value={row.current_shift_owner_name} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <InfoItem label="Criado em" value={formatDateTime(row.created_at)} />
                  <InfoItem label="Última atualização" value={formatDateTime(row.updated_at)} />
                </div>

                {row.status === 'cancelado' && row.handled_at && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <InfoItem label="Processado por" value={row.handler_name} />
                    <InfoItem label="Processado em" value={formatDateTime(row.handled_at)} />
                  </div>
                )}

                {row.reason && (
                  <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Motivo / origem</p>
                    <p className="mt-1 text-sm text-slate-600 break-all">{row.reason}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

// --- Componentes de UI ---

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-slate-900 px-4 py-4 text-white">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
        active ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${className}`}>
      {children}
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{value || '—'}</p>
    </div>
  );
}
