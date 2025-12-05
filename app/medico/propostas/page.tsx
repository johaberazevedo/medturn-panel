'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// --- Tipagens ---
type SwapRequest = {
  id: number;
  status: 'pendente' | 'approved' | 'rejeitado' | 'cancelado';
  reason: string | null;
  created_at: string;
  target_user_id: string | null;
  requester: { full_name: string | null } | null;
  target: { full_name: string | null } | null;
  shift: {
    date: string;
    period: 'manha' | 'tarde' | 'noite' | '24h';
  } | null;
};

// --- Helpers Visuais ---
function statusBadge(status: string) {
  switch (status) {
    case 'approved': return <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Aprovado</span>;
    case 'rejeitado': return <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase">Recusado</span>;
    case 'cancelado': return <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-[10px] font-bold uppercase">Cancelado</span>;
    default: return <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">Pendente</span>;
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '--/--';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// --- Componente Principal ---
function PropostasContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'recebidas' | 'enviadas'>('recebidas');
  const [userId, setUserId] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  
  const [received, setReceived] = useState<SwapRequest[]>([]);
  const [sent, setSent] = useState<SwapRequest[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // 1. Carrega Usuário e Dados
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      const { data: membership } = await supabase
        .from('hospital_users')
        .select('hospital_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membership) {
        setHospitalId(membership.hospital_id);
        fetchData(user.id, membership.hospital_id);
      } else {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  // 2. Busca Propostas
  async function fetchData(uid: string, hid: string) {
    setLoading(true);
    
    // Buscar ENVIADAS (Eu pedi)
    const { data: sentData } = await supabase
      .from('shift_swap_requests')
      .select('*, requester:requester_user_id(full_name), target:target_user_id(full_name), shift:from_shift_id(date, period)')
      .eq('hospital_id', hid)
      .eq('requester_user_id', uid)
      .order('created_at', { ascending: false });

    // Buscar RECEBIDAS (Pediram pra mim OU para "Qualquer um")
    // Logica: target = eu OU target is null (mas sou do mesmo hospital, filtrado acima)
    const { data: receivedData } = await supabase
      .from('shift_swap_requests')
      .select('*, requester:requester_user_id(full_name), target:target_user_id(full_name), shift:from_shift_id(date, period)')
      .eq('hospital_id', hid)
      .or(`target_user_id.eq.${uid},target_user_id.is.null`)
      .neq('requester_user_id', uid) // Não mostrar as que eu mesmo criei (caso target seja null)
      .eq('status', 'pendente') // Só mostra pendentes na inbox para aceitar/recusar
      .order('created_at', { ascending: false });

    // Normalizar dados (Array -> Object)
    const normalize = (list: any[]) => list.map(item => ({
      ...item,
      requester: Array.isArray(item.requester) ? item.requester[0] : item.requester,
      target: Array.isArray(item.target) ? item.target[0] : item.target,
      shift: Array.isArray(item.shift) ? item.shift[0] : item.shift,
    }));

    setSent(normalize(sentData ?? []) as SwapRequest[]);
    setReceived(normalize(receivedData ?? []) as SwapRequest[]);
    setLoading(false);
  }

  // 3. Ações (Aceitar, Recusar, Cancelar)
  async function handleAction(id: number, action: 'accept' | 'reject' | 'cancel', requestData?: SwapRequest) {
    if (!userId || !hospitalId) return;
    setProcessingId(id);
    setMsg(null);

    try {
      if (action === 'cancel') {
        await supabase.from('shift_swap_requests').update({ status: 'cancelado' }).eq('id', id);
        setMsg({ text: 'Solicitação cancelada.', type: 'success' });
      } 
      
      else if (action === 'reject') {
        await supabase.from('shift_swap_requests').update({ status: 'rejeitado' }).eq('id', id);
        setMsg({ text: 'Solicitação recusada.', type: 'success' });
      } 
      
      else if (action === 'accept' && requestData) {
        // ACEITAR TROCA:
        // 1. Atualiza status da solicitação
        // 2. Atualiza o plantão na tabela shifts (Assume o plantão)
        
        // A. Atualiza Solicitacao
        const { error: reqError } = await supabase
          .from('shift_swap_requests')
          .update({ status: 'approved', target_user_id: userId }) // Garante que target sou eu
          .eq('id', id);
        if (reqError) throw reqError;

        // B. Efetiva a troca no plantão original (Se tiver permissão RLS, senão precisa de admin)
        // Tentamos fazer direto. Se falhar por RLS, o admin teria que aprovar.
        // Assumindo lógica "Self-Service":
        if (requestData.from_shift_id) {
             const { error: shiftError } = await supabase
            .from('shifts')
            .update({ doctor_user_id: userId })
            .eq('id', requestData.from_shift_id);
            
            if (shiftError) throw shiftError;
        }

        setMsg({ text: 'Troca aceita! Você assumiu o plantão.', type: 'success' });
      }

      // Recarrega dados
      await fetchData(userId, hospitalId);

    } catch (err: any) {
      console.error(err);
      setMsg({ text: 'Erro ao processar ação. Contate o admin.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">Carregando propostas...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.push('/medico')} className="text-xl">🏠</button>
        <h1 className="text-sm font-bold text-slate-800">Trocas de Plantão</h1>
        <div className="w-6"></div>
      </header>

      {/* Tabs */}
      <div className="flex bg-white border-b text-sm font-medium text-slate-600">
        <button 
          onClick={() => setActiveTab('recebidas')} 
          className={`flex-1 py-3 text-center border-b-2 ${activeTab === 'recebidas' ? 'border-slate-800 text-slate-800' : 'border-transparent'}`}
        >
          Recebidas {received.length > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-1">{received.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('enviadas')} 
          className={`flex-1 py-3 text-center border-b-2 ${activeTab === 'enviadas' ? 'border-slate-800 text-slate-800' : 'border-transparent'}`}
        >
          Enviadas
        </button>
      </div>

      <main className="flex-1 p-4 overflow-y-auto">
        {msg && (
          <div className={`mb-4 px-3 py-2 rounded text-xs border ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        {/* --- LISTA RECEBIDAS --- */}
        {activeTab === 'recebidas' && (
          <div className="space-y-3">
            {received.length === 0 ? (
              <p className="text-center text-xs text-slate-400 mt-10">Nenhuma solicitação pendente para você.</p>
            ) : (
              received.map(req => (
                <div key={req.id} className="bg-white border rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Solicitante</p>
                      <p className="text-sm font-semibold">{req.requester?.full_name ?? 'Colega'}</p>
                    </div>
                    {statusBadge(req.status)}
                  </div>
                  
                  <div className="bg-slate-50 rounded p-2 text-xs text-slate-700 mb-3 border border-slate-100">
                    <p><strong>Quer passar o plantão:</strong></p>
                    <p className="text-sm mt-1">📅 {formatDate(req.shift?.date ?? '')} • {req.shift?.period ?? '?'}</p>
                    {req.reason && <p className="mt-2 text-slate-500 italic">"{req.reason}"</p>}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      disabled={!!processingId}
                      onClick={() => handleAction(req.id, 'reject')}
                      className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
                    >
                      Recusar
                    </button>
                    <button 
                      disabled={!!processingId}
                      onClick={() => handleAction(req.id, 'accept', req)}
                      className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
                    >
                      {processingId === req.id ? '...' : 'Aceitar Plantão'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- LISTA ENVIADAS --- */}
        {activeTab === 'enviadas' && (
          <div className="space-y-3">
            {sent.length === 0 ? (
              <p className="text-center text-xs text-slate-400 mt-10">Você ainda não solicitou nenhuma troca.</p>
            ) : (
              sent.map(req => (
                <div key={req.id} className="bg-white border rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Para</p>
                      <p className="text-sm font-medium">{req.target_user_id ? (req.target?.full_name ?? 'Médico') : 'Qualquer um (Aberto)'}</p>
                    </div>
                    {statusBadge(req.status)}
                  </div>

                  <div className="text-xs text-slate-600 mb-2">
                    Plantão: <strong>{formatDate(req.shift?.date ?? '')}</strong> ({req.shift?.period})
                  </div>

                  {req.status === 'pendente' && (
                    <button 
                      disabled={!!processingId}
                      onClick={() => handleAction(req.id, 'cancel')}
                      className="w-full mt-2 border border-red-100 text-red-500 py-1.5 rounded-lg text-xs hover:bg-red-50 disabled:opacity-50"
                    >
                      {processingId === req.id ? '...' : 'Cancelar pedido'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Wrapper do Suspense (pra evitar erro de build)
export default function PropostasPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-sm text-slate-500">Carregando...</div>}>
      <PropostasContent />
    </Suspense>
  );
}