'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { toast, Toaster } from 'sonner';

type SwapRequest = {
  id: number;
  from_shift_id: number;
  status: 'pendente' | 'approved' | 'rejeitado' | 'cancelado';
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
  hospitals?: { name: string | null } | null;
};

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700',
    rejeitado: 'bg-red-100 text-red-700',
    cancelado: 'bg-slate-100 text-slate-500',
    pendente: 'bg-amber-100 text-amber-700'
  };
  const labels: Record<string, string> = {
    approved: 'Aprovado',
    rejeitado: 'Recusado',
    cancelado: 'Cancelado',
    pendente: 'Pendente'
  };
  return <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${styles[status] || styles.pendente}`}>{labels[status] || 'Pendente'}</span>;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '--/--';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function PropostasContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'recebidas' | 'enviadas'>('recebidas');
  const [userId, setUserId] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  
  const [received, setReceived] = useState<SwapRequest[]>([]);
  const [sent, setSent] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchData = useCallback(async (uid: string) => {
    setLoading(true);
    
    // 1. Pegamos todos os hospitais que o médico faz parte
    const { data: userHospitals } = await supabase
      .from('hospital_users')
      .select('hospital_id')
      .eq('user_id', uid);

    const hospitalIds = userHospitals?.map(h => h.hospital_id) || [];

    // Se não tiver hospital, nem busca
    if (hospitalIds.length === 0) {
      setLoading(false);
      return;
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const query = '*, requester:requester_user_id(full_name), target:target_user_id(full_name), shift:from_shift_id(date, period), hospitals(name)';

    const [sentRes, receivedRes] = await Promise.all([
      // ENVIADAS: Minhas trocas deste mês
      supabase
        .from('shift_swap_requests')
        .select(query)
        .eq('requester_user_id', uid)
        .gte('shift.date', monthStart)
        .order('created_at', { ascending: false }),

      // DISPONÍVEIS: Trocas abertas nos hospitais que eu trabalho
      supabase
        .from('shift_swap_requests')
        .select(query)
        .in('hospital_id', hospitalIds) // Filtra pela rede do médico
        .or(`target_user_id.eq.${uid},target_user_id.is.null`)
        .neq('requester_user_id', uid)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false })
    ]);

    const normalize = (list: any[]) => list.map(item => ({
      ...item,
      requester: Array.isArray(item.requester) ? item.requester[0] : item.requester,
      target: Array.isArray(item.target) ? item.target[0] : item.target,
      shift: Array.isArray(item.shift) ? item.shift[0] : item.shift,
      hospitals: Array.isArray(item.hospitals) ? item.hospitals[0] : item.hospitals,
    })).filter(item => item.shift !== null);

    setSent(normalize(sentRes.data ?? []) as SwapRequest[]);
    setReceived(normalize(receivedRes.data ?? []) as SwapRequest[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      const storedHosp = window.localStorage.getItem(`activeHospitalId:${user.id}`);
      setHospitalId(storedHosp); // Mantemos para contexto, mas fetchData agora é global por médico
      
      fetchData(user.id);
    }
    init();
  }, [router, fetchData]);

  async function executeAction(id: number, action: 'approved' | 'rejeitado' | 'cancelado', shiftId?: number) {
    setProcessingId(id);
    try {
      const { error: updateError } = await supabase.from('shift_swap_requests').update({ 
        status: action,
        target_user_id: action === 'approved' ? userId : undefined 
      }).eq('id', id);
      
      if (updateError) throw updateError;

      if (action === 'approved' && shiftId && userId) {
        const { error: shiftError } = await supabase.from('shifts').update({ doctor_user_id: userId }).eq('id', shiftId);
        if (shiftError) throw shiftError;
      }

      toast.success(action === 'approved' ? "Plantão assumido!" : "Status atualizado.");
      if (userId) fetchData(userId);
    } catch (err) {
      toast.error("Erro ao processar ação.");
    } finally {
      setProcessingId(null);
    }
  }

  const handleAction = (id: number, action: 'approved' | 'rejeitado' | 'cancelado', req?: SwapRequest) => {
    if (action === 'approved') {
      toast("Assumir este plantão?", {
        description: `Confirmar entrada no dia ${formatDate(req?.shift?.date ?? '')} no ${req?.hospitals?.name}?`,
        action: { 
          label: "Confirmar", 
          onClick: () => executeAction(id, 'approved', req?.from_shift_id) 
        },
        cancel: { 
          label: "Voltar",
          onClick: () => {} // Correção para o Build
        }
      });
    } else {
      executeAction(id, action);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm font-medium">Sincronizando Marketplace...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Toaster position="top-center" richColors />
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button onClick={() => router.push('/medico')} className="text-slate-400 hover:text-slate-600">🏠</button>
        <h1 className="text-sm font-black uppercase text-slate-800 tracking-tighter">Marketplace de Plantões</h1>
        <div className="w-6"></div>
      </header>

      <div className="flex bg-white border-b sticky top-[53px] z-10 shadow-sm">
        {(['recebidas', 'enviadas'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)} 
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-400'}`}
          >
            {tab === 'recebidas' ? 'Disponíveis' : 'Minhas Trocas'} 
            {tab === 'recebidas' && received.length > 0 && <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded-full ml-1">{received.length}</span>}
          </button>
        ))}
      </div>

      <main className="flex-1 p-6 space-y-4">
        {(activeTab === 'recebidas' ? received : sent).map(req => (
          <div key={req.id} className="bg-white border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all border-l-4 border-l-emerald-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{activeTab === 'recebidas' ? 'Anunciado por' : 'Destinatário'}</p>
                <p className="text-sm font-bold text-slate-800">{activeTab === 'recebidas' ? (req.requester?.full_name ?? 'Colega') : (req.target_user_id ? req.target?.full_name : 'Público (Qualquer um)')}</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase">{req.hospitals?.name}</p>
              </div>
              {statusBadge(req.status)}
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Horário Disponível</p>
              <p className="text-sm font-bold text-slate-700">📅 {formatDate(req.shift?.date ?? '')} • <span className="capitalize">{req.shift?.period}</span></p>
              {req.reason && <p className="mt-2 text-[11px] text-slate-500 italic leading-relaxed">"{req.reason}"</p>}
            </div>

            <div className="flex gap-2">
              {activeTab === 'recebidas' ? (
                <>
                  <button disabled={!!processingId} onClick={() => handleAction(req.id, 'rejeitado')} className="flex-1 border-2 border-slate-50 text-slate-300 py-3 rounded-2xl text-[10px] font-black uppercase transition-colors hover:bg-slate-50">Ignorar</button>
                  <button disabled={!!processingId} onClick={() => handleAction(req.id, 'approved', req)} className="flex-1 bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-slate-200 transition-transform active:scale-95">Pegar Plantão</button>
                </>
              ) : (
                req.status === 'pendente' && (
                  <button disabled={!!processingId} onClick={() => handleAction(req.id, 'cancelado')} className="w-full border-2 border-red-50 text-red-400 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-red-50 transition-colors">Remover anúncio</button>
                )
              )}
            </div>
          </div>
        ))}
        {(activeTab === 'recebidas' ? received : sent).length === 0 && (
          <div className="text-center py-20">
            <p className="text-xs text-slate-400 font-medium italic">Nenhuma oportunidade este mês.</p>
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