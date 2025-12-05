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
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function periodLabel(p: string) {
  switch (p) {
    case 'manha': return 'Manhã';
    case 'tarde': return 'Tarde';
    case 'noite': return 'Noite';
    case '24h': return '24h';
    default: return p;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'approved': case 'aprovado': return 'Aprovado';
    case 'rejected': case 'rejeitado': return 'Recusado';
    case 'cancelled': case 'cancelado': return 'Cancelado';
    default: return 'Pendente';
  }
}

function statusChipClass(status: string) {
  switch (status) {
    case 'approved': case 'aprovado': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'rejected': case 'rejeitado': case 'cancelled': case 'cancelado': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-amber-50 text-amber-700 border-amber-200';
  }
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
      const mapped = data.map((row: any) => {
        const u = Array.isArray(row.users) ? row.users[0] : row.users;
        return {
          id: row.user_id,
          name: u?.full_name ?? u?.email ?? 'Sem nome',
          email: u?.email ?? null
        };
      }).sort((a, b) => a.name.localeCompare(b.name));
      
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
    const unwrap = (val: any) => Array.isArray(val) ? val[0] : val;

    const fixedData = {
      ...raw,
      requester: unwrap(raw.requester),
      target: unwrap(raw.target),
      shift: unwrap(raw.shift)
    };

    // Se tiver shift, precisa arrumar o doctor dentro dele também
    if (fixedData.shift) {
      fixedData.shift = {
        ...fixedData.shift,
        doctor: unwrap(fixedData.shift.doctor)
      };
    }

    setRequest(fixedData as ShiftSwapDetail);
    
    if (fixedData.target_user_id) setSelectedDoctor(fixedData.target_user_id);
  }

  useEffect(() => {
    async function init() {
      if (!requestId) return;
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: membership } = await supabase
        .from('hospital_users')
        .select('hospital_id, hospitals(name)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        setErrorMsg('Hospital não encontrado.');
        setLoading(false);
        return;
      }

      // Correção: Normaliza membership
      const rawM = membership as any;
      const hospData = rawM.hospitals;
      const realName = Array.isArray(hospData) ? hospData[0]?.name : hospData?.name;

      setHospitalId(rawM.hospital_id);
      setHospitalName(realName ?? 'Hospital');

      await Promise.all([
        loadDetail(rawM.hospital_id),
        loadDoctors(rawM.hospital_id)
      ]);
      setLoading(false);
    }
    init();
  }, [requestId, router]);

  async function handleConfirmSwap() {
    if (!request || !hospitalId) return;
    
    const finalDoctorId = request.target_user_id || selectedDoctor;

    if (!finalDoctorId) {
      setErrorMsg("Selecione um médico para assumir o plantão.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    
    try {
      // 1. Atualiza o status da solicitação para 'aprovado'
      const { error: reqError } = await supabase
        .from('shift_swap_requests')
        .update({ status: 'aprovado', target_user_id: finalDoctorId })
        .eq('id', request.id);

      if (reqError) throw reqError;

      // 2. 🔥 EFETIVA A TROCA NA ESCALA (Atualiza a tabela shifts)
      const { error: shiftError } = await supabase
        .from('shifts')
        .update({ doctor_user_id: finalDoctorId })
        .eq('id', request.from_shift_id);

      if (shiftError) throw shiftError;

      // 3. (Opcional) Limpa disponibilidade se existir
      if (request.shift?.date) {
         await supabase.from('availability')
           .delete()
           .eq('user_id', finalDoctorId)
           .eq('date', request.shift.date);
      }

      setSuccessMsg('Troca confirmada e escala atualizada com sucesso!');
      
      setRequest({ 
        ...request, 
        status: 'aprovado', 
        target_user_id: finalDoctorId 
      });
      
    } catch (err: any) {
      console.error("Erro ao confirmar:", err);
      
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
        await supabase.from('shift_swap_requests').update({ status: 'rejeitado' }).eq('id', request.id);
        setRequest({ ...request, status: 'rejeitado' });
    } catch(e) { console.error(e); }
    setSaving(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-600">Carregando...</div>;
  if (!request) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-600">Solicitação inválida ou não encontrada.</div>;

  const requesterName = request.requester?.full_name ?? request.requester?.email ?? 'Sem nome';
  const shiftDate = request.shift?.date ? formatDateBR(request.shift.date) : '-';
  const currentDoctor = request.shift?.doctor?.full_name ?? request.shift?.doctor?.email ?? 'Atual';
  
  const isEditable = request.status === 'pendente' || request.status === 'pending';

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
           <div>
             <p className="text-xs uppercase text-slate-500">{hospitalName}</p>
             <h1 className="text-lg font-semibold">Troca #{request.id}</h1>
           </div>
           <button onClick={() => router.push('/dashboard')} className="text-xs border px-3 py-1.5 rounded hover:bg-slate-50">Voltar</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {errorMsg && <div className="bg-red-50 text-red-700 border-red-200 border px-3 py-2 rounded text-sm">{errorMsg}</div>}
        {successMsg && <div className="bg-emerald-50 text-emerald-700 border-emerald-200 border px-3 py-2 rounded text-sm">{successMsg}</div>}

        <section className="bg-white border rounded-xl p-5 space-y-4">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-xs text-slate-500">Solicitante</p>
                 <p className="font-semibold text-lg">{requesterName}</p>
              </div>
              <span className={'px-2 py-1 rounded-full border text-xs font-medium ' + statusChipClass(request.status)}>
                {statusLabel(request.status)}
              </span>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 border-t border-b border-slate-100">
              <div>
                 <p className="text-xs text-slate-500 font-semibold">Plantão Original</p>
                 <p className="text-sm text-slate-800">{shiftDate} • {periodLabel(request.shift?.period || '')}</p>
              </div>
              <div>
                 <p className="text-xs text-slate-500 font-semibold">Médico Escalado (Atual)</p>
                 <p className="text-sm text-slate-800">{currentDoctor}</p>
              </div>
              <div>
                 <p className="text-xs text-slate-500 font-semibold">Pedido para</p>
                 <p className="text-sm text-slate-800">{request.target_user_id ? (request.target?.full_name ?? 'Médico específico') : 'Qualquer médico'}</p>
              </div>
              <div>
                 <p className="text-xs text-slate-500 font-semibold">Motivo</p>
                 <p className="text-sm text-slate-800">{request.reason || '—'}</p>
              </div>
           </div>

           <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Definir quem assume o plantão</p>
              <p className="text-xs text-slate-500">Se a solicitação for para "Qualquer médico", você pode selecionar abaixo quem vai assumir. Isso atualizará a escala automaticamente.</p>
              
              <select 
                value={selectedDoctor} 
                onChange={e => setSelectedDoctor(e.target.value)}
                disabled={!isEditable}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50"
              >
                <option value="">Selecione o médico substituto...</option>
                {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
           </div>

           {isEditable && (
             <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={handleReject} 
                  disabled={saving}
                  className="px-4 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  Rejeitar
                </button>
                <button 
                  onClick={handleConfirmSwap} 
                  disabled={saving}
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  {saving ? 'Processando...' : 'Confirmar troca e atualizar escala'}
                </button>
             </div>
           )}
           
           {!isEditable && (
             <p className="text-xs text-center text-slate-400 pt-2">Esta solicitação já foi finalizada.</p>
           )}
        </section>
      </main>
    </div>
  );
}