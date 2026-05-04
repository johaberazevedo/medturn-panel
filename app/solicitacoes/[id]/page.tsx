'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type DoctorOption = {
  id: string;
  name: string;
  email: string | null;
};

type ShiftSwapDetail = {
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

// ✅ Helper de Data Blindado (UTC Fix)
function formatDateBR(dateStr: string) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  if (Number.isNaN(d.getTime())) return dateStr;

  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
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

function statusLabel(status: string) {
  switch (status) {
    case 'approved':
    case 'aprovado':
      return 'Aprovado';
    case 'rejected':
    case 'rejeitado':
      return 'Recusado';
    case 'cancelled':
    case 'cancelado':
      return 'Cancelado';
    default:
      return 'Pendente';
  }
}

function statusChipClass(status: string) {
  switch (status) {
    case 'approved':
    case 'aprovado':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'rejected':
    case 'rejeitado':
    case 'cancelled':
    case 'cancelado':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
}

function visualStatusLabel(r: ShiftSwapDetail) {
  if (isDirectOfferPending(r)) return 'Oferta direcionada';
  if (isAwaitingCoordination(r)) return 'Em processo';
  return statusLabel(r.status);
}

function visualStatusChipClass(r: ShiftSwapDetail) {
  if (isDirectOfferPending(r)) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (isAwaitingCoordination(r)) return 'bg-sky-50 text-sky-700 border-sky-200';
  return statusChipClass(r.status);
}

function isDirectOfferPending(r: ShiftSwapDetail) {
  return r.reason === '__direct_offer__';
}

function isDirectOfferAccepted(r: ShiftSwapDetail) {
  return r.reason === '__direct_offer__accepted';
}

function isAvailabilityAccepted(r: ShiftSwapDetail) {
  return r.reason === '__offer_via_disponibilidade__';
}

function isPendingStatus(status: string) {
  return status === 'pendente' || status === 'pending';
}

function isMarketplaceOpen(r: ShiftSwapDetail) {
  return (
    isPendingStatus(r.status) &&
    !r.target_user_id &&
    r.reason !== '__offer_via_disponibilidade__'
  );
}

function isAwaitingCoordination(r: ShiftSwapDetail) {
  return (
    isPendingStatus(r.status) &&
    !!r.target_user_id &&
    r.reason !== '__direct_offer__'
  );
}

export default function SwapRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id;
  const requestId = Array.isArray(idParam) ? parseInt(idParam[0]) : parseInt(idParam || '0');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('Hospital');

  const [request, setRequest] = useState<ShiftSwapDetail | null>(null);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');

  useEffect(() => {
    if (!requestId || isNaN(requestId) || requestId === 0) {
      setErrorMsg('ID da solicitação inválido.');
      setLoading(false);
    }
  }, [requestId]);

  async function loadDoctors(hId: string) {
    const { data, error } = await supabase
      .from('hospital_users')
      .select('user_id, users(full_name, email)')
      .eq('hospital_id', hId);

    if (!error && data) {
      // Correção: Trata o array 'users'
      const mapped = data
        .map((row: any) => {
          const u = Array.isArray(row.users) ? row.users[0] : row.users;
          return {
            id: row.user_id,
            name: u?.full_name ?? u?.email ?? 'Sem nome',
            email: u?.email ?? null,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      setDoctors(mapped);
    }
  }

  async function loadDetail(hId: string) {
    const { data, error } = await supabase
      .from('shift_swap_requests')
      .select(`
        *,
        requester:requester_user_id(full_name, email),
        target:target_user_id(full_name, email),
        shift:from_shift_id(
          date, period, doctor_user_id,
          doctor:doctor_user_id(full_name, email)
        )
      `)
      .eq('hospital_id', hId)
      .eq('id', requestId)
      .maybeSingle();

    if (error || !data) {
      setErrorMsg('Solicitação não encontrada.');
      return;
    }

    // Correção: Normaliza os dados (remove arrays das relações)
    const raw = data as any;

    // Helper para pegar primeiro item se for array
    const unwrap = (val: any) => (Array.isArray(val) ? val[0] : val);

    const fixedData = {
      ...raw,
      requester: unwrap(raw.requester),
      target: unwrap(raw.target),
      shift: unwrap(raw.shift),
    };

    // Se tiver shift, precisa arrumar o doctor dentro dele também
    if (fixedData.shift) {
      fixedData.shift = {
        ...fixedData.shift,
        doctor: unwrap(fixedData.shift.doctor),
      };
    }

    setRequest(fixedData as ShiftSwapDetail);

    if (fixedData.target_user_id) setSelectedDoctor(fixedData.target_user_id);
  }

  useEffect(() => {
    async function init() {
      if (!requestId) return;
      setLoading(true);
      setErrorMsg(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // 1) Descobre o hospital verdadeiro desta solicitação (não depende do activeHospitalId)
      const { data: reqMeta, error: reqMetaError } = await supabase
        .from('shift_swap_requests')
        .select('id, hospital_id')
        .eq('id', requestId)
        .maybeSingle();

      if (reqMetaError || !reqMeta) {
        setErrorMsg('Solicitação não encontrada (ID inválido ou sem acesso).');
        setLoading(false);
        return;
      }

      const realHospitalId = reqMeta.hospital_id as string;

      // 🔒 BLOQUEIO: só admin/coordenador do hospital pode acessar esta página
      const { data: membership, error: memErr } = await supabase
        .from('hospital_users')
        .select('role, is_admin')
        .eq('user_id', user.id)
        .eq('hospital_id', realHospitalId)
        .maybeSingle();

      if (memErr) {
        console.error('Erro ao checar role:', memErr);
        setErrorMsg('Erro ao validar permissões.');
        setLoading(false);
        router.replace('/medico');
        return;
      }

      const isAllowed =
        membership?.is_admin === true ||
        membership?.role === 'admin' ||
        membership?.role === 'coordenador';

      if (!isAllowed) {
        setErrorMsg('Você não tem permissão para gerenciar solicitações deste hospital.');
        setLoading(false);
        router.replace('/medico');
        return;
      }

      // 2) Se o hospital ativo estiver diferente, sincroniza (multi-hospital safe)
      // 🔑 chave por usuário (evita bagunça multi-hospital / múltiplas abas)
      const storageKey = `activeHospitalId:${user.id}`;

      // fallback: se existir legado "activeHospitalId", migra uma vez
      const legacyKey = 'activeHospitalId';

      const storedHospitalId =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(storageKey) ||
            window.localStorage.getItem(legacyKey)
          : null;

      if (typeof window !== 'undefined') {
        if (!storedHospitalId || storedHospitalId !== realHospitalId) {
          window.localStorage.setItem(storageKey, realHospitalId);

          // opcional: mantém o legado sincronizado pra não quebrar outras telas antigas
          window.localStorage.setItem(legacyKey, realHospitalId);
        }
      }

      // 3) Carrega o nome do hospital real
      const { data: hosp, error: hospError } = await supabase
        .from('hospitals')
        .select('id, name')
        .eq('id', realHospitalId)
        .maybeSingle();

      if (hospError || !hosp) {
        setErrorMsg('Hospital não encontrado para esta solicitação.');
        setLoading(false);
        return;
      }

      setHospitalId(hosp.id);
      setHospitalName(hosp.name ?? 'Hospital');

      // 4) Agora sim carrega detalhe e lista de médicos do hospital certo
      await Promise.all([loadDetail(realHospitalId), loadDoctors(realHospitalId)]);

      setLoading(false);
    }

    init();
  }, [requestId, router]);

  async function handleConfirmSwap() {
    if (!request || !hospitalId) return;
    if (isDirectOfferPending(request)) {
      setErrorMsg('Esse médico ainda não aceitou a oferta no aplicativo.');
      return;
    }

    const finalDoctorId = request.target_user_id || selectedDoctor;

    if (!finalDoctorId) {
      setErrorMsg('Selecione um médico para assumir o plantão.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      // ✅ Checagem preventiva: avisa se a confirmação gerar conflito de plantão
      if (request.shift?.date && request.shift?.period) {
        const { data: conflictRows, error: conflictError } = await supabase
          .from('shifts')
          .select(`
            id,
            hospital_id,
            date,
            period,
            hospitals(name)
          `)
          .eq('doctor_user_id', finalDoctorId)
          .eq('date', request.shift.date)
          .eq('period', request.shift.period)
          .neq('id', request.from_shift_id);

        if (conflictError) throw conflictError;

        const conflicts = (conflictRows ?? []).map((row: any) => ({
          ...row,
          hospitals: Array.isArray(row.hospitals) ? row.hospitals[0] : row.hospitals,
        }));

        if (conflicts.length > 0) {
          const hospitalNames = conflicts
            .map((row: any) => row.hospitals?.name ?? 'outro hospital')
            .join(', ');

          const shouldContinue = window.confirm(
            `Atenção: este médico já está escalado em ${hospitalNames} nesse mesmo dia e período.\n\n` +
              `Isso pode representar um conflito de escala. Deseja confirmar mesmo assim?`
          );

          if (!shouldContinue) {
            setSaving(false);
            return;
          }
        }
      }

      // 1. Atualiza o status da solicitação para 'aprovado'
      // ✅ Só aprova se ainda estiver pendente (evita corrida com outra aba/admin)
      const { data: updatedReq, error: reqError } = await supabase
        .from('shift_swap_requests')
        .update({ status: 'aprovado', target_user_id: finalDoctorId })
        .eq('id', request.id)
        .eq('status', 'pendente')
        .select('id')
        .maybeSingle();

      if (reqError) throw reqError;

      // se não atualizou, alguém já finalizou (aprovou/rejeitou/cancelou)
      if (!updatedReq) {
        setErrorMsg('Esta solicitação não está mais pendente (alguém já processou). Atualize a página.');
        return;
      }

      // 2. 🔥 EFETIVA A TROCA NA ESCALA (Atualiza a tabela shifts)
      const { error: shiftError } = await supabase
        .from('shifts')
        .update({ doctor_user_id: finalDoctorId })
        .eq('id', request.from_shift_id);

      if (shiftError) throw shiftError;

      // 3. (Opcional) Limpa disponibilidade se existir
      if (request.shift?.date) {
        await supabase
          .from('availability')
          .delete()
          .eq('user_id', finalDoctorId)
          .eq('date', request.shift.date);
      }

      setSuccessMsg('Troca confirmada e escala atualizada com sucesso!');

      setRequest({
        ...request,
        status: 'aprovado',
        target_user_id: finalDoctorId,
      });
    } catch (err: any) {
      console.error('Erro ao confirmar:', err);

      // 🔥 TRATAMENTO AMIGÁVEL DO ERRO DE CHAVE DUPLICADA
      // Verifica se o erro contém "duplicate key" ou o nome da constraint
      if (
        err.message?.includes('duplicate key') ||
        err.message?.includes('shifts_unique_hospital_date_period_doctor')
      ) {
        setErrorMsg('Este médico já está de plantão neste turno. Selecione outro médico.');
      } else {
        setErrorMsg(`Erro ao confirmar troca: ${err.message}`);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleReject() {
    if (!request) return;
    setSaving(true);
    try {
      await supabase
        .from('shift_swap_requests')
        .update({ status: 'rejeitado' })
        .eq('id', request.id);
      setRequest({ ...request, status: 'rejeitado' });
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-[32px] border border-slate-100 bg-white px-6 py-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Carregando solicitação...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-[32px] border border-slate-100 bg-white px-6 py-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Solicitação inválida ou não encontrada.
          </p>
        </div>
      </div>
    );
  }

  const requesterName = request.requester?.full_name ?? request.requester?.email ?? 'Sem nome';
  const shiftDate = request.shift?.date ? formatDateBR(request.shift.date) : '-';
  const currentDoctor = request.shift?.doctor?.full_name ?? request.shift?.doctor?.email ?? 'Atual';

  const isEditable = request.status === 'pendente' || request.status === 'pending';

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
                MedTurn • Solicitações
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tighter text-slate-950">
                Troca #{request.id}
              </h1>

              <p className="mt-2 text-[11px] font-semibold text-slate-400">
                {hospitalName} • Criada em {formatDateTimeBR(request.created_at)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95"
              >
                Voltar
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

        {successMsg && (
          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {successMsg}
          </div>
        )}

        <section className="rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
                Solicitante
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                {requesterName}
              </h2>

              <p className="mt-2 text-xs font-semibold text-slate-400">
                Solicitação de troca de plantão
              </p>
            </div>

            <span
              className={
                'inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider ' +
                visualStatusChipClass(request)
              }
            >
              {visualStatusLabel(request)}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Plantão original
              </p>
              <p className="mt-2 text-sm font-bold text-slate-800">
                {shiftDate} • {periodLabel(request.shift?.period || '')}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Médico escalado atual
              </p>
              <p className="mt-2 text-sm font-bold text-slate-800">
                {currentDoctor}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Pedido para
              </p>
              <p className="mt-2 text-sm font-bold text-slate-800">
                {isDirectOfferPending(request) || isDirectOfferAccepted(request)
                  ? request.target?.full_name ?? request.target?.email ?? 'Médico específico'
                  : request.target_user_id
                    ? request.target?.full_name ?? request.target?.email ?? 'Médico selecionado'
                    : 'Qualquer médico'}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Motivo
              </p>
              <p className="mt-2 text-sm font-bold text-slate-800">
                {request.reason || '—'}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[28px] border border-slate-100 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
              Confirmação
            </p>

            <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">
              Definir quem assume o plantão
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Se a solicitação estiver aberta para qualquer médico, você pode definir manualmente quem vai assumir.
              Se já houver um aceite no aplicativo, basta confirmar para atualizar a escala.
            </p>

            {isDirectOfferPending(request) ? (
              <div className="mt-4 rounded-3xl border border-blue-200 bg-blue-50 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
                  <p className="text-sm font-black text-blue-800">
                    Oferta direcionada enviada
                  </p>
                </div>

                <p className="text-xs leading-relaxed text-blue-700">
                  Este plantão foi oferecido diretamente para{' '}
                  <strong>
                    {request.target?.full_name ?? request.target?.email ?? 'o médico selecionado'}
                  </strong>
                  , mas ele ainda não aceitou no aplicativo.
                </p>
              </div>
            ) : isAwaitingCoordination(request) ? (
              <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
                  <p className="text-sm font-black text-emerald-800">
                    Interesse registrado
                  </p>
                </div>

                <p className="text-xs leading-relaxed text-emerald-700">
                  O médico{' '}
                  <strong>
                    {request.target?.full_name ?? request.target?.email ?? 'Selecionado'}
                  </strong>{' '}
                  aceitou este plantão via aplicativo e está aguardando sua confirmação para assumir a escala.
                </p>
              </div>
            ) : isMarketplaceOpen(request) ? (
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                Ainda não há interessados. Você pode atribuir um médico manualmente abaixo.
              </p>
            ) : request.target_user_id ? (
              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs leading-relaxed text-slate-600">
                  Esta solicitação já possui um médico vinculado:{' '}
                  <strong>
                    {request.target?.full_name ?? request.target?.email ?? 'Selecionado'}
                  </strong>
                  .
                </p>
              </div>
            ) : null}

            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              disabled={
                !isEditable ||
                isDirectOfferPending(request) ||
                isAwaitingCoordination(request)
              }
              className={`mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#40C0A2] ${
                isDirectOfferPending(request) || isAwaitingCoordination(request)
                  ? 'bg-slate-100'
                  : 'bg-slate-50'
              }`}
            >
              <option value="">Selecione o médico substituto...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {isEditable && (
            <div className="mt-5 flex flex-col-reverse gap-3 md:flex-row md:justify-end">
              <button
                onClick={handleReject}
                disabled={saving}
                className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-wider text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                Rejeitar
              </button>

              <button
                onClick={handleConfirmSwap}
                disabled={saving || isDirectOfferPending(request)}
                className={`rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wider shadow-sm ${
                  saving || isDirectOfferPending(request)
                    ? 'cursor-not-allowed bg-slate-300 text-slate-500'
                    : 'bg-slate-950 text-white hover:bg-slate-800 active:scale-95'
                }`}
              >
                {saving
                  ? 'Processando...'
                  : isDirectOfferPending(request)
                    ? 'Confirmar após aceite do médico'
                    : 'Confirmar troca e atualizar escala'}
              </button>
            </div>
          )}

          {!isEditable && (
            <p className="pt-5 text-center text-xs font-semibold text-slate-400">
              Esta solicitação já foi finalizada.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}