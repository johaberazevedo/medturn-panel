'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type MembershipRow = {
  hospital_id: string;
  hospitals: {
    name: string | null;
  } | null;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
};

type DoctorOption = {
  user_id: string;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
};

type AvailabilityNotification = {
  hospital_id: string;
  user_id: string;
  date: string;
  period: 'manha' | 'tarde' | 'noite';
  created_at: string;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
};

type ShiftSwapNotification = {
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

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('Hospital');
  const [adminName, setAdminName] = useState<string>('Administrador');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<AvailabilityNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

    const [swapRequests, setSwapRequests] = useState<ShiftSwapNotification[]>([]);
  const [swapLoading, setSwapLoading] = useState(false);

  // 📣 Comunicação admin
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [sendMode, setSendMode] = useState<'all' | 'single'>('single');
  const [targetUserId, setTargetUserId] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // ✅ CORREÇÃO DE DATA: Garante que o fuso horário não altere o dia
  function formatDateBR(dateStr: string) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    
    if (Number.isNaN(d.getTime())) return dateStr;
    
    return d.toLocaleDateString('pt-BR', { 
      weekday: 'short', 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  function formatDateTimeBR(dateStr: string) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
    
  function periodLabel(p: 'manha' | 'tarde' | 'noite' | '24h') {
    switch (p) {
      case 'manha': return 'Manhã';
      case 'tarde': return 'Tarde';
      case 'noite': return 'Noite';
      case '24h': return '24h';
      default: return p;
    }
  }

  function periodChipClass(p: 'manha' | 'tarde' | 'noite') {
    if (p === 'manha') return 'bg-green-50 text-green-700 border-green-200';
    if (p === 'tarde') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-purple-50 text-purple-700 border-purple-200';
  }

  function statusLabel(status: string) {
    switch (status) {
      case 'approved': case 'aprovado': return 'Aprovado';
      case 'rejected': case 'rejeitado': case 'recusado': return 'Recusado';
      default: return 'Pendente';
    }
  }

    function statusChipClass(status: string) {
    switch (status) {
      case 'approved': case 'aprovado': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected': case 'rejeitado': case 'recusado': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  }

  const loadDoctors = useCallback(async (hId: string) => {
  const { data, error } = await supabase
    .from('hospital_users')
    .select('user_id, role, users(full_name, email)')
    .eq('hospital_id', hId)
    .in('role', ['doctor', 'admin']);

  if (error) {
    console.error('Erro ao carregar destinatários:', error);
    return;
  }

  if (data) {
    const formatted = data.map((item: any) => ({
      user_id: item.user_id,
      users: Array.isArray(item.users) ? item.users[0] : item.users,
    }));

    const unique = Array.from(
      new Map(formatted.map((item) => [item.user_id, item])).values()
    );

    setDoctorOptions(unique as DoctorOption[]);
  }
}, []);

  const loadData = useCallback(async (hId: string) => {
    setNotifLoading(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const since = thirtyDaysAgo.toISOString();

      const { data, error } = await supabase
        .from('availability')
        .select('hospital_id, user_id, date, period, created_at, users(full_name, email)')
        .eq('hospital_id', hId)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error) {
        const formattedData = (data ?? []).map((item: any) => ({
          ...item,
          users: Array.isArray(item.users) ? item.users[0] : item.users
        }));
        setNotifications(formattedData as AvailabilityNotification[]);
      }
    } catch (e) { console.error(e); }
    setNotifLoading(false);

    setSwapLoading(true);
    try {
      const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const dateLimit = thirtyDaysAgo.toISOString().split('T')[0]; // ✅ Formato YYYY-MM-DD

const { data, error } = await supabase
  .from('shift_swap_requests')
  .select(`
    id, hospital_id, requester_user_id, from_shift_id, target_user_id, reason, status, created_at,
    requester:requester_user_id(full_name, email),
    target:target_user_id(full_name, email),
    shift:from_shift_id!inner(date, period, doctor_user_id, doctor:doctor_user_id(full_name, email))
  `) // ✅ Adicionado !inner para permitir o filtro na tabela relacionada
  .eq('hospital_id', hId)
  .eq('status', 'pendente')
  .gte('shift.date', dateLimit) // ✅ Filtra pela DATA DO PLANTÃO (passado recente + futuro)
  .order('created_at', { ascending: false })
  .limit(20);

      if (!error) {
        const formattedSwaps = (data ?? []).map((item: any) => {
           let shiftObj = Array.isArray(item.shift) ? item.shift[0] : item.shift;
           if (shiftObj && Array.isArray(shiftObj.doctor)) {
             shiftObj = { ...shiftObj, doctor: shiftObj.doctor[0] };
           }
           return {
             ...item,
             requester: Array.isArray(item.requester) ? item.requester[0] : item.requester,
             target: Array.isArray(item.target) ? item.target[0] : item.target,
             shift: shiftObj
           };
        });
        // 🔥 Prioriza solicitações com interessado aguardando confirmação
const sortedSwaps = formattedSwaps.sort((a, b) => {
  const aHasTarget = !!a.target_user_id;
  const bHasTarget = !!b.target_user_id;

  // quem tem interessado vem primeiro
  if (aHasTarget && !bHasTarget) return -1;
  if (!aHasTarget && bHasTarget) return 1;

  // se ambos iguais, mantém ordem por data (já vem desc, mas garantimos)
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
});

setSwapRequests(sortedSwaps as ShiftSwapNotification[]);
      }
    } catch (e) { console.error(e); }
    setSwapLoading(false);
  }, []);

useEffect(() => {
  async function init() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    // 1) tenta pegar hospital já selecionado
    const storedHospitalId =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(`activeHospitalId:${user.id}`)
        : null;

    if (!storedHospitalId) {
      setLoading(false);
      router.push('/selecionar-hospital');
      return;
    }

    // 2) 🔒 BLOQUEIO: só admin/coordenador do hospital pode ver dashboard
    const { data: membership, error: memErr } = await supabase
      .from('hospital_users')
      .select('role, is_admin')
      .eq('user_id', user.id)
      .eq('hospital_id', storedHospitalId)
      .maybeSingle();

    if (memErr) {
      console.error('Erro ao checar role:', memErr);
      setLoading(false);
      router.replace('/medico');
      return;
    }

    const isAllowed =
      membership?.is_admin === true ||
      membership?.role === 'admin' ||
      membership?.role === 'coordenador';

    if (!isAllowed) {
      setLoading(false);
      router.replace('/medico');
      return;
    }

    // 3) carrega hospital pelo ID selecionado
    const { data: hosp, error: hospError } = await supabase
      .from('hospitals')
      .select('id, name')
      .eq('id', storedHospitalId)
      .maybeSingle();

    if (hospError || !hosp) {
      setErrorMsg('Não foi possível identificar o hospital selecionado.');
      setLoading(false);
      return;
    }

    // 4) carrega nome do usuário logado
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    // 5) aplica
    setHospitalId(hosp.id);
    setHospitalName(hosp.name ?? 'Hospital');
    setAdminName(profile?.full_name ?? profile?.email ?? user.email ?? 'Administrador');

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`activeHospitalId:${user.id}`, hosp.id);
    }

        await loadData(hosp.id);
    await loadDoctors(hosp.id);
    setLoading(false);
  }
  init();
}, [router, loadData, loadDoctors]);

  useEffect(() => {
    if (!hospitalId) return;
    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'availability', filter: `hospital_id=eq.${hospitalId}` }, () => loadData(hospitalId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_swap_requests', filter: `hospital_id=eq.${hospitalId}` }, () => loadData(hospitalId))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [hospitalId, loadData]);

  async function sendAdminMessage() {
    if (!messageTitle.trim() || !messageBody.trim()) {
      alert('Preencha título e mensagem.');
      return;
    }

    if (sendMode === 'single' && !targetUserId) {
      alert('Selecione um médico.');
      return;
    }

    setSendingMessage(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch('/api/admin/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          hospitalId,
          title: messageTitle,
          message: messageBody,
          mode: sendMode,
          targetUserId: sendMode === 'single' ? targetUserId : undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? 'Erro ao enviar aviso.');
      }

            alert(`Sucesso! Enviado para ${json.sent} usuário(s).`);

      setMessageTitle('');
      setMessageBody('');
      setTargetUserId('');
      setSendMode('single');
      setShowMessageModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingMessage(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-600">Carregando painel...</p>
      </div>
    );
  }

  if (!hospitalId) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white border rounded-xl px-4 py-3 text-sm">
          Erro: Hospital não identificado.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase text-slate-500">Painel do hospital</p>
            <h1 className="text-xl font-semibold">{hospitalName}</h1>
            <p className="text-[11px] text-slate-500">Logado como: {adminName}</p>
          </div>
                   <div className="flex gap-2">
            <button
              onClick={() => setShowMessageModal(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Enviar aviso
            </button>

            <button 
              onClick={() => router.push('/escala')} 
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Ver escala mensal
            </button>

            {/* 🙈 CHECK-IN OCULTO POR ENQUANTO
            <button
              onClick={() => router.push('/checkin')}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Check-in
            </button>
            */}

            <button 
              onClick={() => router.push('/medicos')} 
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Gerenciar médicos
            </button>

            <button
              onClick={() => router.push('/relatorio')}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Relatório de pagamento
            </button>

            <button
              onClick={() => router.push('/selecionar-hospital')}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              Trocar hospital
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button 
                onClick={() => router.push('/escala')} 
                className="bg-white border rounded-xl p-4 text-left hover:shadow-sm transition-shadow"
              >
                <h2 className="text-sm font-semibold mb-1">Escala mensal</h2>
                <p className="text-[11px] text-slate-500">Visualize e edite a escala de plantões.</p>
              </button>

              <button 
                onClick={() => router.push('/medicos')} 
                className="bg-white border rounded-xl p-4 text-left hover:shadow-sm transition-shadow"
              >
                <h2 className="text-sm font-semibold mb-1">Médicos do hospital</h2>
                <p className="text-[11px] text-slate-500">Gerencie o quadro de profissionais.</p>
              </button>

              <button
                onClick={() => router.push('/relatorio')}
                className="bg-white border rounded-xl p-4 text-left hover:shadow-sm transition-shadow"
              >
                <h2 className="text-sm font-semibold mb-1">Relatório de pagamento</h2>
                <p className="text-[11px] text-slate-500">Calcule turnos do mês e gerencie feriados.</p>
              </button>
            </div>

                  

            <div className="bg-white border rounded-xl p-4">
               <h2 className="text-sm font-semibold mb-2">Próximos passos</h2>
               <ul className="text-[11px] text-slate-600 list-disc ml-4 space-y-1">
                 <li>Use a página <strong>Escala mensal</strong> para organizar quem está em cada plantão.</li>
                 <li>Peça para os médicos manterem a <strong>disponibilidade atualizada</strong> no app.</li>
                 <li>Acompanhe o <strong>Relatório de pagamento</strong> para o fechamento do mês.</li>
                 <li>Use as <strong>notificações</strong> ao lado para montar a escala mais rápido.</li>
               </ul>
            </div>
          </section>

          <section className="space-y-3">
            {/* Feed de Notificações permanece igual */}
            <div className="bg-white border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">Disponibilidades e solicitações</h2>
                <button onClick={() => loadData(hospitalId!)} className="text-[10px] text-slate-500 hover:text-slate-800">
                  Atualizar
                </button>
              </div>

              <p className="text-[11px] text-slate-500 mb-1">Últimos anúncios de disponibilidade (30 dias).</p>
              {notifLoading && <p className="text-[11px] text-slate-500 mb-2">Carregando...</p>}
              
              {!notifLoading && notifications.length === 0 && (
                <p className="text-[11px] text-slate-400 mb-2">Nenhum anúncio recente.</p>
              )}
              
              {!notifLoading && notifications.length > 0 && (
                <ul className="space-y-2 max-h-64 overflow-auto pr-1 mb-4">
                  {notifications.map((n) => (
                    <li key={`${n.user_id}-${n.date}-${n.period}-${n.created_at}`} className="border rounded-lg px-2.5 py-2 text-[11px] flex flex-col gap-1 bg-slate-50">
                      <div className="flex justify-between items-center">
                         <span className="font-medium truncate">{n.users?.full_name ?? n.users?.email ?? 'Médico'}</span>
                         <span className="text-[10px] text-slate-500">{formatDateTimeBR(n.created_at)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-slate-600">Disp. para <strong>{formatDateBR(n.date)}</strong></span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                         <span className={'px-2 py-0.5 rounded-full border text-[10px] ' + periodChipClass(n.period)}>{periodLabel(n.period)}</span>
                         <button onClick={() => router.push(`/escala/editar?date=${n.date}`)} className="text-[10px] text-slate-600 underline">Ir para escala</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <h3 className="text-[11px] font-semibold text-slate-700 mt-2 mb-1">Solicitações de troca</h3>
              {swapLoading && <p className="text-[11px] text-slate-500">Carregando...</p>}
              {!swapLoading && swapRequests.length === 0 && <p className="text-[11px] text-slate-400">Nenhuma solicitação pendente.</p>}
              {!swapLoading && swapRequests.length > 0 && (
                <ul className="space-y-2 max-h-64 overflow-auto pr-1">
                  {swapRequests.map((r) => (
                    <li
  key={r.id}
  className={`border rounded-lg px-2.5 py-2 text-[11px] flex flex-col gap-1 bg-slate-50 transition-all
    ${r.target_user_id ? 'border-emerald-400 shadow-sm shadow-emerald-100' : ''}
  `}
>
                        <div className="flex justify-between items-center">
                           <span className="font-medium truncate">{r.requester?.full_name ?? 'Médico'}</span>
                           <span className={'px-2 py-0.5 rounded-full border text-[10px] ' + statusChipClass(r.status)}>{statusLabel(r.status)}</span>
                        </div>
                        <div className="text-slate-600 mt-1">
  {r.target_user_id ? (
    <p>
      <span className="text-emerald-600 font-bold">
        ● {(r.target?.full_name ?? r.target?.email ?? 'Alguém').split(' ')[0]} aceitou
      </span>{' '}
      a troca de {(r.requester?.full_name ?? r.requester?.email ?? 'Médico').split(' ')[0]}
      {' '}— <span className="text-[10px] text-slate-500">clique para confirmar</span>
    </p>
  ) : (
    <p>
      Solicitação de cobertura: <strong>{r.requester?.full_name ?? r.requester?.email ?? 'Médico'}</strong>
    </p>
  )}
  <div className="text-[10px] text-slate-400 mt-1">
    📅 {formatDateBR(r.shift?.date ?? '')} • {periodLabel((r.shift?.period ?? 'manha') as any)}
  </div>
</div>
                        <div className="flex justify-end mt-1">
                             <button onClick={() => router.push(`/solicitacoes/${r.id}`)} className="text-[10px] text-slate-600 underline">Ver detalhes</button>
                        </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
           </main>

      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold">Enviar aviso</h2>
                <p className="text-[11px] text-slate-500">
                  Envie um aviso para um usuário específico ou para todos os usuários do hospital.
                </p>
              </div>

              <button
                onClick={() => setShowMessageModal(false)}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-3 px-5 py-4">
              <input
                type="text"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="Título do aviso"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />

              <textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Mensagem"
                rows={5}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none"
              />

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
  <select
    value={sendMode}
    onChange={(e) => setSendMode(e.target.value as 'all' | 'single')}
    className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
  >
    <option value="single">Enviar para um usuário</option>
    <option value="all">Enviar para todos do hospital</option>
  </select>

  {sendMode === 'single' && (
    <select
      value={targetUserId}
      onChange={(e) => setTargetUserId(e.target.value)}
      className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
    >
      <option value="">Selecione um usuário</option>
      {doctorOptions.map((doc) => (
        <option key={doc.user_id} value={doc.user_id}>
          {doc.users?.full_name ?? doc.users?.email ?? doc.user_id}
        </option>
      ))}
    </select>
  )}
</div>
            </div>

            <div className="flex justify-end gap-2 border-t px-5 py-4">
              <button
                onClick={() => setShowMessageModal(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                onClick={sendAdminMessage}
                disabled={sendingMessage}
                className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {sendingMessage ? 'Enviando...' : 'Enviar aviso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}