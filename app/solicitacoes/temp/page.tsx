'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type MembershipRow = {
  hospital_id: string;
  hospitals: {
    name: string | null;
  } | null;
};

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

function formatDateBR(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short',
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

function statusLabel(status: string) {
  switch (status) {
    case 'approved':
      return 'Aprovado';
    case 'rejected':
      return 'Recusado';
    default:
      return 'Pendente';
  }
}

function statusChipClass(status: string) {
  const base =
    'inline-flex items-center px-2 py-0.5 rounded-full border text-[11px]';
  switch (status) {
    case 'approved':
      return base + ' bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'rejected':
      return base + ' bg-red-50 text-red-700 border-red-200';
    default:
      return base + ' bg-amber-50 text-amber-700 border-amber-200';
  }
}

export default function SwapRequestDetailPage() {
  const router = useRouter();
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('Hospital');

  const [request, setRequest] = useState<ShiftSwapDetail | null>(null);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');

  const idParam = (params as any)?.id;
  const requestId = Array.isArray(idParam)
    ? parseInt(idParam[0] as string, 10)
    : parseInt(idParam as string, 10);

  useEffect(() => {
    if (!requestId || Number.isNaN(requestId)) {
      setErrorMsg('Solicitação inválida.');
      setLoading(false);
    }
  }, [requestId]);

  async function loadDoctors(hId: string) {
    const { data, error } = await supabase
      .from('hospital_users')
      .select('user_id, users(full_name, email)')
      .eq('hospital_id', hId);

    if (error) {
      console.error(error);
      setErrorMsg('Erro ao carregar lista de médicos.');
      return;
    }

    const mapped: DoctorOption[] = (data ?? []).map((row: any) => ({
      id: row.user_id as string,
      name:
        (row.users?.full_name as string | null) ??
        (row.users?.email as string | null) ??
        'Médico sem nome',
      email: (row.users?.email as string | null) ?? null,
    }));

    mapped.sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );

    setDoctors(mapped);
  }

  async function loadDetail(hId: string) {
    try {
      const { data, error } = await supabase
        .from('shift_swap_requests')
        .select(
          `
          id,
          hospital_id,
          requester_user_id,
          from_shift_id,
          target_user_id,
          reason,
          status,
          created_at,
          requester:requester_user_id ( full_name, email ),
          target:target_user_id ( full_name, email ),
          shift:from_shift_id (
            date,
            period,
            doctor_user_id,
            doctor:doctor_user_id ( full_name, email )
          )
        `
        )
        .eq('hospital_id', hId)
        .eq('id', requestId)
        .maybeSingle();

      if (error || !data) {
        console.error(error);
        setErrorMsg('Não foi possível carregar esta solicitação.');
        setRequest(null);
        return;
      }

      setRequest(data as ShiftSwapDetail);

      if (data.target_user_id) {
        setSelectedDoctor(data.target_user_id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro inesperado ao carregar a solicitação.');
    }
  }

  useEffect(() => {
    async function init() {
      if (!requestId || Number.isNaN(requestId)) return;

      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: membership, error: mError } = await supabase
        .from('hospital_users')
        .select('hospital_id, hospitals(name)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (mError || !membership) {
        console.error(mError);
        setErrorMsg(
          'Não foi possível identificar seu hospital. Verifique seu cadastro.'
        );
        setLoading(false);
        return;
      }

      const m = membership as MembershipRow;
      setHospitalId(m.hospital_id);
      setHospitalName(m.hospitals?.name ?? 'Hospital');

      await Promise.all([
        loadDetail(m.hospital_id),
        loadDoctors(m.hospital_id),
      ]);

      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, requestId]);

  async function handleConfirmSwap() {
  if (!request) return;
  if (!hospitalId) return;

  setSaving(true);
  setErrorMsg(null);
  setSuccessMsg(null);

  try {
    const updatePayload: any = {
      status: 'approved',
    };

    // Se o admin escolher um médico específico, grava no target_user_id
    if (selectedDoctor) {
      updatePayload.target_user_id = selectedDoctor;
    }

    const { error } = await supabase
      .from('shift_swap_requests')
      .update(updatePayload)
      .eq('id', request.id)
      .eq('hospital_id', hospitalId);

    if (error) {
      console.error('Erro Supabase ao atualizar solicitação:', error);
      setErrorMsg('Erro ao atualizar a solicitação.');
      setSaving(false);
      return;
    }

    setRequest({
      ...request,
      status: 'approved',
      target_user_id: selectedDoctor || request.target_user_id,
    });

    setSuccessMsg('Troca confirmada com sucesso.');
  } catch (err) {
    console.error('Erro inesperado ao atualizar solicitação:', err);
    setErrorMsg('Erro inesperado ao atualizar a solicitação.');
  } finally {
    setSaving(false);
  }
}

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-600">Carregando solicitação...</p>
      </div>
    );
  }

  if (!hospitalId || !request) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white border rounded-xl px-4 py-3 text-sm">
          Não foi possível carregar esta solicitação.
        </div>
      </div>
    );
  }

  const requesterName =
    request.requester?.full_name ??
    request.requester?.email ??
    'Médico sem nome';

  const shiftDate = request.shift?.date
    ? formatDateBR(request.shift.date)
    : 'Data não encontrada';

  const shiftPeriod = request.shift?.period
    ? periodLabel(request.shift.period)
    : '';

  const currentDoctorName =
    request.shift?.doctor?.full_name ??
    request.shift?.doctor?.email ??
    requesterName;

  const targetName =
    request.target_user_id && request.target
      ? request.target.full_name ?? request.target.email ?? 'Médico destino'
      : 'Qualquer médico';

  const isFinalized = request.status !== 'pending';

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase text-slate-500">
              {hospitalName}
            </p>
            <h1 className="text-lg font-semibold">
              Solicitação de troca #{request.id}
            </h1>
            <p className="text-[11px] text-slate-500">
              Recebida em {formatDateTimeBR(request.created_at)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="text-xs border px-3 py-1.5 rounded-lg hover:bg-slate-50"
          >
            Voltar ao painel
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {errorMsg && (
          <div className="bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-lg text-xs">
            {successMsg}
          </div>
        )}

        <section className="bg-white border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] text-slate-500 mb-0.5">Solicitante</p>
              <p className="text-sm font-semibold">{requesterName}</p>
            </div>

            <span className={statusChipClass(request.status)}>
              {statusLabel(request.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600 mt-2">
            <div>
              <p className="font-semibold text-slate-700 mb-0.5">
                Plantão original
              </p>
              <p>
                {shiftDate}
                {shiftPeriod && ` • ${shiftPeriod}`}
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-700 mb-0.5">
                Médico escalado
              </p>
              <p>{currentDoctorName}</p>
            </div>

            <div>
              <p className="font-semibold text-slate-700 mb-0.5">
                Pedido para
              </p>
              <p>{targetName}</p>
            </div>

            {request.reason && (
              <div>
                <p className="font-semibold text-slate-700 mb-0.5">Motivo</p>
                <p>{request.reason}</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 mt-3 pt-3 space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-700">
                Definir quem assume o plantão (opcional)
              </label>
              <p className="text-[11px] text-slate-500">
                Você pode manter como &quot;qualquer médico&quot; ou escolher
                um profissional específico para assumir. Depois ele confirma no
                app.
              </p>
              <select
                className="border rounded-lg px-2 py-1.5 text-xs max-w-xs"
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                disabled={isFinalized}
              >
                <option value="">Qualquer médico</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {isFinalized && (
              <p className="text-[11px] text-slate-500">
                Esta solicitação já foi{' '}
                <strong>{statusLabel(request.status).toLowerCase()}</strong>.
                Você ainda pode ajustar o médico destino e salvar novamente se
                necessário.
              </p>
            )}

            <div className="flex justify-end">
  <button
    type="button"
    onClick={handleConfirmSwap}
    disabled={saving}
    className="text-xs px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
  >
    {saving ? 'Salvando...' : 'Confirmar troca'}
  </button>
</div>
          </div>
        </section>
      </main>
    </div>
  );
}