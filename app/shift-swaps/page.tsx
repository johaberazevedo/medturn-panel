'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type MembershipRow = {
  hospital_id: string;
  role: string | null;
  hospitals: {
    name: string | null;
  } | null;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
};

type ShiftSwapRow = {
  id: number;
  hospital_id: string;
  requester_user_id: string;
  from_shift_id: number;
  target_user_id: string | null;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';
  reason: string | null;
  created_at: string;
  handled_at: string | null;
  requester: {
    full_name: string | null;
    email: string | null;
  } | null;
  target: {
    full_name: string | null;
    email: string | null;
  } | null;
  shift: {
    date: string;
    period: 'manha' | 'tarde' | 'noite' | '24h';
    users: {
      full_name: string | null;
      email: string | null;
    } | null;
  } | null;
};

type StatusFilter = 'todos' | 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';

export default function ShiftSwapsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('Hospital');
  const [adminName, setAdminName] = useState<string>('Administrador');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [swaps, setSwaps] = useState<ShiftSwapRow[]>([]);
  const [swapsLoading, setSwapsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pendente');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  function formatDateBR(dateStr: string) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function formatDateTimeBR(dateStr: string) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function periodLabel(p: 'manha' | 'tarde' | 'noite' | '24h') {
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

  function periodChipClass(p: 'manha' | 'tarde' | 'noite' | '24h') {
    if (p === 'manha') {
      return 'bg-green-50 text-green-700 border-green-200';
    }
    if (p === 'tarde') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (p === 'noite') {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-orange-50 text-orange-700 border-orange-200';
  }

  function statusLabel(s: StatusFilter) {
    switch (s) {
      case 'pendente':
        return 'Pendente';
      case 'aprovado':
        return 'Aprovado';
      case 'rejeitado':
        return 'Rejeitado';
      case 'cancelado':
        return 'Cancelado';
      case 'todos':
        return 'Todos';
      default:
        return s;
    }
  }

  function statusBadgeClass(s: ShiftSwapRow['status']) {
    switch (s) {
      case 'pendente':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'aprovado':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejeitado':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'cancelado':
        return 'bg-slate-50 text-slate-500 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  }

  async function loadSwaps(hId: string, filter: StatusFilter) {
    setSwapsLoading(true);
    setErrorMsg(null);

    try {
      let query = supabase
  .from('shift_swap_requests')
  .select(
    `
    id,
    hospital_id,
    requester_user_id,
    from_shift_id,
    target_user_id,
    status,
    reason,
    created_at,
    handled_at,
    requester:requester_user_id ( full_name, email ),
    target:target_user_id ( full_name, email ),
    shift:from_shift_id (
      date,
      period,
      users ( full_name, email )
    )
  `
  )
  .eq('hospital_id', hId)
  .eq('status', 'pendente')   // 🔥🔥🔥 ADICIONE ESTA LINHA
  .order('created_at', { ascending: false })
  .limit(50);

      if (filter !== 'todos') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        setErrorMsg('Erro ao carregar solicitações de troca.');
        setSwaps([]);
        setSwapsLoading(false);
        return;
      }

      // Correção: Trata os arrays que o Supabase retorna para as relações
      const formatted = (data ?? []).map((item: any) => {
         // Trata o turno e o usuário do turno (médico atual)
         let flatShift = Array.isArray(item.shift) ? item.shift[0] : item.shift;
         if (flatShift && Array.isArray(flatShift.users)) {
            flatShift = { ...flatShift, users: flatShift.users[0] };
         }

         return {
           ...item,
           requester: Array.isArray(item.requester) ? item.requester[0] : item.requester,
           target: Array.isArray(item.target) ? item.target[0] : item.target,
           shift: flatShift
         };
      });

      setSwaps(formatted as ShiftSwapRow[]);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro inesperado ao carregar as solicitações de troca.');
    } finally {
      setSwapsLoading(false);
    }
  }

  async function handleUpdateStatus(id: number, newStatus: ShiftSwapRow['status']) {
    if (!hospitalId) return;

    setActionLoadingId(id);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from('shift_swap_requests')
        .update({
          status: newStatus,
          handled_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('hospital_id', hospitalId);

      if (error) {
        console.error(error);
        setErrorMsg('Erro ao atualizar status da solicitação.');
        setActionLoadingId(null);
        return;
      }

      setSwaps((current) =>
        current.map((s) =>
          s.id === id ? { ...s, status: newStatus, handled_at: new Date().toISOString() } : s
        )
      );
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro inesperado ao atualizar status da solicitação.');
    } finally {
      setActionLoadingId(null);
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      setErrorMsg(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: membership, error: mError } = await supabase
        .from('hospital_users')
        .select(
          'hospital_id, role, hospitals(name), users(full_name, email)'
        )
        .eq('user_id', user.id)
        .maybeSingle();

      if (mError || !membership) {
        console.error(mError);
        setErrorMsg(
          'Não foi possível carregar seu hospital. Verifique se seu usuário está vinculado.'
        );
        setLoading(false);
        return;
      }

      // Correção: Constrói 'm' tratando arrays do Supabase
      const rawM = membership as any;
      const m: MembershipRow = {
        hospital_id: rawM.hospital_id,
        role: rawM.role,
        hospitals: Array.isArray(rawM.hospitals) ? rawM.hospitals[0] : rawM.hospitals,
        users: Array.isArray(rawM.users) ? rawM.users[0] : rawM.users
      };

      if (m.role !== 'admin') {
        setErrorMsg('Apenas administradores podem acessar a página de trocas de plantão.');
        setLoading(false);
        return;
      }

      setHospitalId(m.hospital_id);
      setHospitalName(m.hospitals?.name ?? 'Hospital');

      const adminLabel =
        m.users?.full_name ??
        m.users?.email ??
        'Administrador';
      setAdminName(adminLabel);

      await loadSwaps(m.hospital_id, statusFilter);
      setLoading(false);
    }

    init();
  }, [router]);

  useEffect(() => {
    if (hospitalId) {
      loadSwaps(hospitalId, statusFilter);
    }
  }, [hospitalId, statusFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-600">Carregando solicitações de troca...</p>
      </div>
    );
  }

  if (!hospitalId) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white border rounded-xl px-4 py-3 text-sm">
          Não foi possível identificar seu hospital. Verifique seu cadastro.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase text-slate-500">
              Trocas de plantão
            </p>
            <h1 className="text-xl font-semibold">
              {hospitalName}
            </h1>
            <p className="text-[11px] text-slate-500">
              Logado como: {adminName}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Voltar ao dashboard
            </button>
            <button
              onClick={() => router.push('/escala')}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Ver escala mensal
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

        <section className="bg-white border rounded-xl p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-semibold">
                Solicitações de troca de plantão
              </h2>
              <p className="text-[11px] text-slate-500">
                Acompanhe os pedidos dos médicos e aprove ou rejeite conforme necessidade.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Filtrar status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="border rounded-lg px-2 py-1.5 text-xs"
              >
                <option value="pendente">Pendentes</option>
                <option value="aprovado">Aprovados</option>
                <option value="rejeitado">Rejeitados</option>
                <option value="cancelado">Cancelados</option>
                <option value="todos">Todos</option>
              </select>
            </div>
          </div>

          {swapsLoading && (
            <p className="text-[11px] text-slate-500">
              Carregando solicitações...
            </p>
          )}

          {!swapsLoading && swaps.length === 0 && (
            <p className="text-[11px] text-slate-400">
              Nenhuma solicitação encontrada para este filtro.
            </p>
          )}

          {!swapsLoading && swaps.length > 0 && (
            <ul className="space-y-2 max-h-[600px] overflow-auto pr-1">
              {swaps.map((s) => {
                const requesterName =
                  s.requester?.full_name ??
                  s.requester?.email ??
                  'Médico sem nome';

                const targetName = s.target
                  ? s.target.full_name ?? s.target.email ?? 'Médico'
                  : null;

                const shiftDate = s.shift?.date
                  ? formatDateBR(s.shift.date)
                  : 'Data não encontrada';

                const shiftPeriod = s.shift?.period
                  ? periodLabel(s.shift.period)
                  : 'Período não encontrado';

                const currentDoctorName = s.shift?.users
                  ? s.shift.users.full_name ?? s.shift.users.email ?? 'Médico'
                  : null;

                return (
                  <li
                    key={s.id}
                    className="border rounded-lg px-3 py-2 text-[11px] bg-slate-50 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            'inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] ' +
                            statusBadgeClass(s.status)
                          }
                        >
                          {statusLabel(s.status)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Criado em: {formatDateTimeBR(s.created_at)}
                        </span>
                      </div>
                      {s.shift?.date && (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/escala/editar?date=${s.shift?.date}`)
                          }
                          className="text-[10px] text-slate-600 underline"
                        >
                          Ir para escala do dia
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 text-slate-700">
                      <span className="font-medium">
                        {requesterName}
                      </span>
                      <span>pediu troca do plantão</span>
                      <span className="font-medium">
                        {shiftDate} — {shiftPeriod}
                      </span>
                    </div>

                    {currentDoctorName && (
                      <div className="text-slate-600">
                        <span className="text-[10px] text-slate-500">
                          Plantão atual:
                        </span>{' '}
                        <span className="font-medium">{currentDoctorName}</span>
                      </div>
                    )}

                    {targetName && (
                      <div className="text-slate-600">
                        <span className="text-[10px] text-slate-500">
                          Sugestão de troca com:
                        </span>{' '}
                        <span className="font-medium">{targetName}</span>
                      </div>
                    )}

                    {s.reason && (
                      <div className="text-slate-600">
                        <span className="text-[10px] text-slate-500">
                          Motivo:
                        </span>{' '}
                        <span>{s.reason}</span>
                      </div>
                    )}

                    {s.handled_at && s.status !== 'pendente' && (
                      <div className="text-[10px] text-slate-500">
                        Atualizado em: {formatDateTimeBR(s.handled_at)}
                      </div>
                    )}

                    {s.status === 'pendente' && (
                      <div className="mt-1 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={actionLoadingId === s.id}
                          onClick={() => handleUpdateStatus(s.id, 'aprovado')}
                          className="text-[10px] px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                        >
                          {actionLoadingId === s.id
                            ? 'Atualizando...'
                            : 'Aprovar'}
                        </button>
                        <button
                          type="button"
                          disabled={actionLoadingId === s.id}
                          onClick={() => handleUpdateStatus(s.id, 'rejeitado')}
                          className="text-[10px] px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
                        >
                          {actionLoadingId === s.id
                            ? 'Atualizando...'
                            : 'Rejeitar'}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
