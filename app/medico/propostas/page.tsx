'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { toast, Toaster } from 'sonner';

type SwapRequest = {
  id: number;
  from_shift_id: number;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';
  reason: string | null;
  created_at: string;
  target_user_id: string | null;
  hospital_id: string;

  requester: { full_name: string | null } | null;
  target: { full_name: string | null } | null;

  shift: {
    date: string;
    period: 'manha' | 'tarde' | 'noite' | '24h';
  } | null;

  hospitals: { name: string | null } | null;
};

type DisplayStatus = SwapRequest['status'] | 'em_processo';

function statusBadge(status: DisplayStatus) {
  const styles: Record<DisplayStatus, string> = {
    aprovado: 'bg-emerald-100 text-emerald-700',
    rejeitado: 'bg-red-100 text-red-700',
    cancelado: 'bg-slate-100 text-slate-500',
    pendente: 'bg-amber-100 text-amber-700',
    em_processo: 'bg-sky-100 text-sky-700',
  };

  const labels: Record<DisplayStatus, string> = {
    aprovado: 'Aprovado',
    rejeitado: 'Recusado',
    cancelado: 'Cancelado',
    pendente: 'Pendente',
    em_processo: 'Em processo',
  };

  return (
    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return '--/--';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function localYYYYMMDD(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function minutesNowLocal(d = new Date()) {
  return d.getHours() * 60 + d.getMinutes();
}

function isExpiredShift(shift: {
  date: string;
  period: 'manha' | 'tarde' | 'noite' | '24h';
}) {
  const now = new Date();
  const today = localYYYYMMDD(now);

  if (shift.date < today) return true;
  if (shift.date > today) return false;

  if (shift.period === '24h') return false;

  const minutes = minutesNowLocal(now);

  const cutoff: Record<'manha' | 'tarde' | 'noite', number> = {
    manha: 9 * 60,
    tarde: 14 * 60,
    noite: 20 * 60,
  };

  return minutes >= cutoff[shift.period];
}

function isPendingStatus(status: string) {
  return status === 'pendente' || status === 'pending';
}

function isDirectOfferPending(req: SwapRequest) {
  return req.reason === '__direct_offer__';
}

function isDirectOfferAccepted(req: SwapRequest) {
  return req.reason === '__direct_offer__accepted';
}

function isAvailabilityAccepted(req: SwapRequest) {
  return req.reason === '__offer_via_disponibilidade__';
}

function isMarketplaceOpen(req: SwapRequest) {
  return (
    isPendingStatus(req.status) &&
    !req.target_user_id &&
    req.reason !== '__offer_via_disponibilidade__'
  );
}

function isMarketplaceAccepted(req: SwapRequest) {
  return (
    isPendingStatus(req.status) &&
    !!req.target_user_id &&
    req.reason !== '__direct_offer__' &&
    req.reason !== '__direct_offer__accepted' &&
    req.reason !== '__offer_via_disponibilidade__'
  );
}

function isAwaitingCoordination(req: SwapRequest) {
  return (
    isPendingStatus(req.status) &&
    !!req.target_user_id &&
    (
      isMarketplaceAccepted(req) ||
      isDirectOfferAccepted(req) ||
      isAvailabilityAccepted(req)
    )
  );
}

function isDirectedToMePending(req: SwapRequest, userId: string | null) {
  return !!userId && isDirectOfferPending(req) && req.target_user_id === userId;
}

function PropostasContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'recebidas' | 'enviadas'>('recebidas');
  const [userId, setUserId] = useState<string | null>(null);

  const [received, setReceived] = useState<SwapRequest[]>([]);
  const [sent, setSent] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchData = useCallback(async (uid: string) => {
    setLoading(true);

    const { data: userHospitals } = await supabase
      .from('hospital_users')
      .select('hospital_id')
      .eq('user_id', uid);

    const hospitalIds = userHospitals?.map(h => h.hospital_id) || [];

    if (hospitalIds.length === 0) {
      setReceived([]);
      setSent([]);
      setLoading(false);
      return;
    }

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const query =
      '*, requester:requester_user_id(full_name), target:target_user_id(full_name), shift:from_shift_id(date, period), hospitals(name)';

    const [sentRes, receivedRes] = await Promise.all([
      supabase
        .from('shift_swap_requests')
        .select(query)
        .eq('requester_user_id', uid)
        .gte('shift.date', monthStart)
        .order('created_at', { ascending: false }),

      supabase
        .from('shift_swap_requests')
        .select(query)
        .in('hospital_id', hospitalIds)
        .neq('requester_user_id', uid)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false }),
    ]);

    const normalizeBase = (list: any[]) =>
      list
        .map(item => ({
          ...item,
          requester: Array.isArray(item.requester) ? item.requester[0] : item.requester,
          target: Array.isArray(item.target) ? item.target[0] : item.target,
          shift: Array.isArray(item.shift) ? item.shift[0] : item.shift,
          hospitals: Array.isArray(item.hospitals) ? item.hospitals[0] : item.hospitals,
        }))
        .filter(item => item.shift !== null);

    const normalizeSent = (list: any[]) => normalizeBase(list);

const normalizeReceived = (list: any[]) =>
  normalizeBase(list)
    .filter(item => !isExpiredShift(item.shift))
    .filter(item => {
      const open = isMarketplaceOpen(item);
      const directedToMe = isDirectedToMePending(item, uid);
      const awaitingForMe =
        isAwaitingCoordination(item) &&
        item.target_user_id === uid;

      return open || directedToMe || awaitingForMe;
    });

    setSent(normalizeSent(sentRes.data ?? []) as SwapRequest[]);
    setReceived(normalizeReceived(receivedRes.data ?? []) as SwapRequest[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);
      fetchData(user.id);
    }

    init();
  }, [router, fetchData]);

  useEffect(() => {
    if (!userId) return;

    const refresh = async () => {
      await fetchData(userId);
    };

    const channel = supabase
      .channel(`medico-propostas-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shift_swap_requests',
        },
        async () => {
          await refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shifts',
        },
        async () => {
          await refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hospital_users',
        },
        async () => {
          await refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchData]);

  const isMinePending = (req: SwapRequest) =>
  isAwaitingCoordination(req) && !!userId && req.target_user_id === userId;

const isOpen = (req: SwapRequest) =>
  isMarketplaceOpen(req);

const isTakenByOther = (req: SwapRequest) =>
  isAwaitingCoordination(req) &&
  !!userId &&
  req.target_user_id !== userId;

const isDirectOfferForMe = (req: SwapRequest) =>
  isDirectedToMePending(req, userId);

const displayStatus = (req: SwapRequest): DisplayStatus => {
  if (isAwaitingCoordination(req)) return 'em_processo';
  return req.status;
};

const isActionableReceived = (req: SwapRequest) =>
  isOpen(req) || isDirectOfferForMe(req);

const receivedActionableCount = received.filter(isActionableReceived).length;

  const firstName = (s?: string | null) => (s ?? '').trim().split(' ')[0] || 'Alguém';

async function acceptDirectOffer(req: SwapRequest) {
  if (!userId) throw new Error('Sem usuário logado');

  const { data, error } = await supabase
    .from('shift_swap_requests')
    .update({
      reason: '__direct_offer__accepted',
    })
    .eq('id', req.id)
    .eq('status', 'pendente')
    .eq('target_user_id', userId)
    .eq('reason', '__direct_offer__')
    .select('id')
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error('Essa oferta direcionada não está mais disponível para você.');
  }
}

  async function executeAction(
  req: SwapRequest,
  action: 'pegar' | 'rejeitado' | 'cancelado'
) {
  setProcessingId(req.id);

  try {
    if (!userId) throw new Error('Sem usuário logado');

    if (action === 'pegar') {
      if (isDirectOfferForMe(req)) {
        const { data, error } = await supabase
          .from('shift_swap_requests')
          .update({
            reason: '__direct_offer__accepted',
            status: 'pendente',
          })
          .eq('id', req.id)
          .eq('status', 'pendente')
          .eq('target_user_id', userId)
          .eq('reason', '__direct_offer__')
          .select('id')
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          toast.error('Essa oferta direcionada não está mais disponível para você.');
          return;
        }

        toast.success('Oferta aceita! Agora falta a coordenação confirmar.');
      } else {
        const { error } = await supabase.rpc('claim_shift_swap', {
          swap_id: req.id,
          candidate_id: userId,
        });

        if (error) {
          const msg = error.message ?? '';

          if (msg.includes('não está mais disponível')) {
            toast.error('Alguém já pegou esse plantão antes de você.');
            return;
          }

          throw error;
        }

        toast.success('Pedido enviado! Aguardando confirmação da coordenação.');
      }
    } else {
      const { error } = await supabase
        .from('shift_swap_requests')
        .update({ status: action })
        .eq('id', req.id);

      if (error) throw error;

      toast.success('Status atualizado.');
    }

    await fetchData(userId);
  } catch (err: any) {
    toast.error(err?.message ?? 'Erro ao processar ação.');
  } finally {
    setProcessingId(null);
  }
}

  const handleAction = (req: SwapRequest, action: 'pegar' | 'rejeitado' | 'cancelado') => {
  if (action === 'pegar') {
    const periodLabelMap: Record<string, string> = {
      manha: 'Manhã',
      tarde: 'Tarde',
      noite: 'Noite',
      '24h': '24h',
    };

    const shiftPeriod = req.shift?.period
      ? (periodLabelMap[req.shift.period] ?? req.shift.period)
      : 'Plantão';

    const shiftDate = formatDate(req.shift?.date ?? '');
    const hospitalName = req.hospitals?.name ?? 'hospital';

    toast(
      isDirectOfferForMe(req) ? 'Aceitar oferta direcionada?' : 'Assumir este plantão?',
      {
        description: isDirectOfferForMe(req)
          ? `Esse plantão de ${shiftPeriod}, em ${shiftDate}, no ${hospitalName}, foi oferecido diretamente para você.`
          : `Confirmar aceite do plantão de ${shiftPeriod}, em ${shiftDate}, no ${hospitalName}?`,
        action: {
          label: 'Confirmar',
          onClick: () => executeAction(req, 'pegar'),
        },
        cancel: { label: 'Voltar', onClick: () => {} },
      }
    );
  } else {
    executeAction(req, action);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm font-medium">
        Sincronizando Marketplace...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Toaster position="top-center" richColors />
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button onClick={() => router.push('/medico')} className="text-slate-400 hover:text-slate-600">
          🏠
        </button>
        <h1 className="text-sm font-black uppercase text-slate-800 tracking-tighter">
          Marketplace de Plantões
        </h1>
        <div className="w-6"></div>
      </header>

      <div className="flex bg-white border-b sticky top-[53px] z-10 shadow-sm">
        {(['recebidas', 'enviadas'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-400'
            }`}
          >
            {tab === 'recebidas' ? 'Disponíveis' : 'Minhas Trocas'}
            {tab === 'recebidas' && receivedActionableCount > 0 && (
  <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded-full ml-1">
    {receivedActionableCount}
  </span>
)}
          </button>
        ))}
      </div>

      <main className="flex-1 p-6 space-y-4">
        {(activeTab === 'recebidas' ? received : sent).map(req => (
          <div
            key={req.id}
            className="bg-white border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all border-l-4 border-l-emerald-500"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {activeTab === 'recebidas' ? 'Anunciado por' : 'Destinatário'}
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {activeTab === 'recebidas'
                    ? (req.requester?.full_name ?? 'Colega')
                    : (req.target_user_id
                        ? (req.target?.full_name ?? 'Médico')
                        : 'Marketplace (Qualquer médico)')}
                </p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase">
                  {req.hospitals?.name}
                </p>
              </div>
              {statusBadge(
                activeTab === 'enviadas'
                  ? req.status
                  : displayStatus(req)
              )}
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                Horário Disponível
              </p>
              <p className="text-sm font-bold text-slate-700">
                📅 {formatDate(req.shift?.date ?? '')} • <span className="capitalize">{req.shift?.period}</span>
              </p>
              {req.reason && req.reason !== '__offer_via_disponibilidade__' && (
                <p className="mt-2 text-[11px] text-slate-500 italic leading-relaxed">
                  "{req.reason}"
                </p>
              )}
            </div>

            {activeTab === 'enviadas' && isAwaitingCoordination(req) && req.target_user_id && (
  <div className="mb-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl px-4 py-3">
    <p className="text-[10px] font-black uppercase tracking-widest">Aguardando coordenação</p>
    <p className="text-[11px] font-medium leading-relaxed">
      <span className="font-bold">{firstName(req.target?.full_name)}</span> aceitou sua troca. Agora falta a coordenação confirmar no painel.
    </p>
  </div>
)}

            {activeTab === 'recebidas' && isDirectOfferForMe(req) && (
  <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl px-4 py-3">
    <p className="text-[10px] font-black uppercase tracking-widest">Oferta direcionada</p>
    <p className="text-[11px] font-medium leading-relaxed">
      Este plantão foi oferecido diretamente para você e ainda aguarda seu aceite.
    </p>
  </div>
)}

{activeTab === 'recebidas' && isMinePending(req) && (
  <div className="mb-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl px-4 py-3">
    <p className="text-[10px] font-black uppercase tracking-widest">Aguardando confirmação</p>
    <p className="text-[11px] font-medium leading-relaxed">
      Você aceitou este plantão. A coordenação precisa confirmar no painel.
    </p>
  </div>
)}

{activeTab === 'recebidas' && isTakenByOther(req) && (
  <div className="mb-4 bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl px-4 py-3">
    <p className="text-[10px] font-black uppercase tracking-widest">Já em processo de troca</p>
    <p className="text-[11px] font-medium leading-relaxed">
      <span className="font-bold">{firstName(req.target?.full_name)}</span> já aceitou esse plantão e está aguardando a coordenação confirmar.
    </p>
  </div>
)}

            <div className="flex gap-2">
              {activeTab === 'recebidas' ? (
                <button
  disabled={
    processingId === req.id ||
    isMinePending(req) ||
    isTakenByOther(req) ||
    (!isOpen(req) && !isDirectOfferForMe(req))
  }
  onClick={() => handleAction(req, 'pegar')}
  className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase transition-all active:scale-[0.98] disabled:opacity-60 ${
    isDirectOfferForMe(req)
      ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200'
      : isMinePending(req)
        ? 'bg-amber-100 text-amber-800'
        : isTakenByOther(req)
          ? 'bg-slate-100 text-slate-400 border border-slate-200'
          : isOpen(req)
            ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
            : 'bg-slate-200 text-slate-500'
  }`}
>
  {processingId === req.id
    ? 'Processando...'
    : isDirectOfferForMe(req)
      ? 'Aceitar oferta'
      : isMinePending(req)
        ? 'Aguardando coordenação'
        : isTakenByOther(req)
          ? 'Já em processo de troca'
          : isOpen(req)
            ? 'Pegar Plantão'
            : 'Indisponível'}
</button>
              ) : (
                req.status === 'pendente' && (
                  <button
                    disabled={!!processingId}
                    onClick={() => handleAction(req, 'cancelado')}
                    className="w-full border-2 border-red-50 text-red-400 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-red-50 transition-colors"
                  >
                    Remover anúncio
                  </button>
                )
              )}
            </div>
          </div>
        ))}

        {(activeTab === 'recebidas' ? received : sent).length === 0 && (
          <div className="text-center py-20">
            <p className="text-xs text-slate-400 font-medium italic">
              Nenhuma oportunidade este mês.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PropostasPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-sm text-slate-500">Carregando Marketplace...</div>}>
      <PropostasContent />
    </Suspense>
  );
}