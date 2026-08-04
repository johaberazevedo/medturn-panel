'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  Settings, Save, ChevronLeft, Loader2, Globe,
  Clock, CheckCircle2, RefreshCw, UserX, FileDown, CalendarRange
} from 'lucide-react';

// --- CONFIG ---
const INICIO_TURNO = { manha: 7, tarde: 13, noite: 19, '24h': 7 };
const JANELA_TOLERANCIA_MS = 2 * 60 * 60 * 1000;

type ShiftRow = {
  id: number; date: string; period: 'manha' | 'tarde' | 'noite' | '24h';
  doctor_user_id: string | null; is_chief: boolean;
  users: { full_name: string | null; email?: string | null } | null;
};

const PERIOD_ORDER: ShiftRow['period'][] = ['manha', 'tarde', 'noite', '24h'];

const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function previousMonth() {
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: previous.getFullYear(), month: previous.getMonth() + 1 };
}

export default function CheckinAdminPage() {
  const router = useRouter();
  const initialReportPeriod = useMemo(() => previousMonth(), []);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [hospConfig, setHospConfig] = useState({ name: '', is_enabled: true, lat: '', lng: '', radius: '200' });
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [reportYear, setReportYear] = useState(initialReportPeriod.year);
  const [reportMonth, setReportMonth] = useState(initialReportPeriod.month);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const isReportPeriodValid = Number.isInteger(reportYear) && reportYear >= 2000 && reportYear <= 2100;
  const isReportMonthClosed = useMemo(() => {
    if (!Number.isInteger(reportYear) || reportYear < 2000 || reportYear > 2100) return false;
    const now = new Date();
    const selectedMonth = new Date(reportYear, reportMonth - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return selectedMonth < currentMonth;
  }, [reportYear, reportMonth]);

  const carregarDados = useCallback(async (hId: string, d: string) => {
  setFetching(true);

  const { data: hosp } = await supabase
    .from('hospitals')
    .select('*')
    .eq('id', hId)
    .single();

  if (hosp) {
    setHospConfig({
      name: hosp.name,
      is_enabled: hosp.is_checkin_enabled,
      lat: hosp.latitude?.toString() || '',
      lng: hosp.longitude?.toString() || '',
      radius: hosp.geofence_radius?.toString() || '200',
    });
  }

  const { data: sData } = await supabase
    .from('shifts')
    .select('*, users(full_name, email)')
    .eq('hospital_id', hId)
    .eq('date', d)
    .order('period');

  const sIds = sData?.map((x) => x.id) || [];

  let cData: any[] = [];

  if (sIds.length > 0) {
    const { data } = await supabase
      .from('shift_checkins')
      .select('*')
      .in('shift_id', sIds);

    cData = data || [];
  }

  setShifts(
    sData?.map((s) => ({
      ...s,
      users: Array.isArray(s.users) ? s.users[0] : s.users,
    })) || []
  );

  setCheckins(cData);
  setFetching(false);
}, []);

useEffect(() => {
  async function init() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      router.push('/login');
      return;
    }

const hId =
  typeof window !== 'undefined'
    ? window.localStorage.getItem(`activeHospitalId:${user.id}`) ??
      window.localStorage.getItem('activeHospitalId')
    : null;

    if (!hId) {
      setLoading(false);
      router.push('/selecionar-hospital');
      return;
    }

if (typeof window !== 'undefined') {
  window.localStorage.setItem(`activeHospitalId:${user.id}`, hId);
  window.localStorage.setItem('activeHospitalId', hId);
}

    const { data: membership, error: membershipError } = await supabase
      .from('hospital_users')
      .select('role, is_admin')
      .eq('user_id', user.id)
      .eq('hospital_id', hId)
      .maybeSingle();

    if (membershipError) {
      console.error('Erro ao verificar permissão do check-in:', membershipError);
      setLoading(false);
      router.replace('/medico');
      return;
    }

const isAdmin =
  membership?.is_admin === true ||
  membership?.role === 'admin';

if (!isAdmin) {
  setLoading(false);

  if (membership?.role === 'coordenador') {
    router.replace('/coordenador/escala');
  } else {
    router.replace('/medico');
  }

  return;
}

    setHospitalId(hId);
    await carregarDados(hId, date);
    setLoading(false);
  }

  init();
}, [router, date, carregarDados]);

  const grouped = useMemo(() => {
    const byPeriod: Record<string, any[]> = { manha: [], tarde: [], noite: [], '24h': [] };
    shifts.filter(s => !!s.doctor_user_id).forEach(s => {
      const ck = checkins.find(c => c.shift_id === s.id);
      const now = new Date();
      const [y, m, d] = s.date.split('-').map(Number);
      const startAt = new Date(y, m - 1, d, INICIO_TURNO[s.period], 0, 0);
      const deadline = new Date(startAt.getTime() + JANELA_TOLERANCIA_MS);
      const state = ck ? 'presente' : (now > deadline ? 'ausente' : 'pendente');
      byPeriod[s.period].push({ ...s, checkin: ck, state, deadline: deadline.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) });
    });
    return byPeriod;
  }, [shifts, checkins]);

  const salvarConfig = async () => {
    setSalvando(true);
    await supabase.from('hospitals').update({
      is_checkin_enabled: hospConfig.is_enabled,
      latitude: parseFloat(hospConfig.lat), longitude: parseFloat(hospConfig.lng),
      geofence_radius: parseInt(hospConfig.radius)
    }).eq('id', hospitalId);
    setSalvando(false);
    alert("Configurações aplicadas!");
  };

  const gerarRelatorioCheckins = async () => {
    if (!hospitalId || !isReportMonthClosed || generatingReport) return;

    setGeneratingReport(true);
    setReportError(null);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (sessionError || !accessToken) {
        setReportError('Sua sessão expirou. Entre novamente para gerar o relatório.');
        return;
      }

      const response = await fetch('/api/report/checkin-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          hospitalId,
          year: reportYear,
          month: reportMonth,
        }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        setReportError(
          json?.detail
            ? `${json.error} — ${json.detail}`
            : (json?.error ?? 'Não foi possível gerar o relatório de check-ins.')
        );
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `medturn_checkins_${reportYear}-${String(reportMonth).padStart(2, '0')}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar relatório de check-ins:', error);
      setReportError('Não foi possível gerar o relatório de check-ins.');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-black uppercase tracking-widest animate-pulse text-xs">Sincronizando Unidade...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-50 flex justify-between items-center shadow-sm backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400"><ChevronLeft size={20} /></button>
          <section>
            <h1 className="text-lg font-black uppercase tracking-tight text-slate-800">Operações de Presença</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{hospConfig.name}</p>
          </section>
        </div>
        <div className="flex items-center gap-3">
          {fetching && <RefreshCw size={14} className="animate-spin text-blue-500" />}
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="text-xs font-bold border rounded-xl px-4 py-2 bg-slate-50 outline-none focus:ring-2 ring-blue-500 transition-all" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* HUD DE CONFIGURAÇÕES */}
        <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group transition-all">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 border-r border-white/10 pr-8">
              <div className="flex items-center gap-3 mb-4"><Settings size={18} className="text-blue-400" /><h2 className="text-sm font-black uppercase tracking-widest">Painel de GPS</h2></div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase">Botão no App</p>
                <button onClick={() => setHospConfig(p => ({ ...p, is_enabled: !p.is_enabled }))} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${hospConfig.is_enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all ${hospConfig.is_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-3 gap-6">
              {[ { l: 'Latitude', k: 'lat' }, { l: 'Longitude', k: 'lng' }, { l: 'Raio (m)', k: 'radius' } ].map(f => (
                <div key={f.k}>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">{f.l}</label>
                  <input type="text" value={(hospConfig as any)[f.k]} onChange={e => setHospConfig(p => ({ ...p, [f.k]: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition" />
                </div>
              ))}
            </div>
            <div className="lg:col-span-2">
              <button onClick={salvarConfig} disabled={salvando} className="w-full h-full min-h-[100px] bg-blue-600 hover:bg-blue-500 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                {salvando ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                <span className="text-[10px] font-black uppercase">Aplicar</span>
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-10 transition-opacity"><Globe size={180} /></div>
        </section>

        {/* RELATÓRIO MENSAL DE CHECK-INS */}
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-emerald-600">
                <CalendarRange size={18} />
                <p className="text-[10px] font-black uppercase tracking-widest">Relatório mensal</p>
              </div>
              <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900">
                Check-ins do mês
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Gere o PDF com os plantões e plantonistas que registraram presença na competência selecionada.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div>
                <label htmlFor="checkin-report-month" className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Mês
                </label>
                <select
                  id="checkin-report-month"
                  value={reportMonth}
                  onChange={(event) => {
                    setReportMonth(Number(event.target.value));
                    setReportError(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:w-40"
                >
                  {MONTH_LABELS.map((label, index) => (
                    <option key={label} value={index + 1}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="checkin-report-year" className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Ano
                </label>
                <input
                  id="checkin-report-year"
                  type="number"
                  min={2000}
                  max={2100}
                  value={reportYear}
                  onChange={(event) => {
                    setReportYear(Number(event.target.value));
                    setReportError(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:w-28"
                />
              </div>

              <button
                onClick={gerarRelatorioCheckins}
                disabled={!isReportMonthClosed || generatingReport}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:active:scale-100"
              >
                {generatingReport ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
                {generatingReport ? 'Gerando...' : 'Gerar PDF'}
              </button>
            </div>
          </div>

          {!isReportPeriodValid && (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              Informe um ano válido entre 2000 e 2100.
            </p>
          )}

          {isReportPeriodValid && !isReportMonthClosed && (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
              O relatório fica disponível somente depois do encerramento do mês selecionado.
            </p>
          )}

          {reportError && (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700" role="alert">
              {reportError}
            </p>
          )}
        </section>

        {/* LISTAGEM AGRUPADA POR TURNOS */}
<div className="space-y-6">
  {shifts.filter((s) => !!s.doctor_user_id).length === 0 && (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-black uppercase tracking-widest text-slate-400">
        Nenhum plantão encontrado
      </p>
      <h2 className="mt-2 text-xl font-black text-slate-900">
        Não há médicos escalados para esta data.
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        Selecione outra data ou cadastre a escala do dia para acompanhar os registros de presença.
      </p>
<button
  onClick={() =>
    router.push(
      hospitalId
        ? `/escala/editar?date=${date}&hospitalId=${hospitalId}`
        : `/escala/editar?date=${date}`
    )
  }
  className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800 active:scale-95"
>
  Ir para escala do dia
</button>
    </div>
  )}
  {PERIOD_ORDER.map((p) => {
            const list = grouped[p];
            if (list.length === 0) return null;
            return (
              <section key={p} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="bg-slate-50/80 px-6 py-4 border-b flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2"><Clock size={16} className="text-slate-400" /> {p}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Janela: {INICIO_TURNO[p]}:00h - {INICIO_TURNO[p]+2}:00h</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/30 font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-3">Médico</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Registro</th><th className="px-6 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {list.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-black text-slate-800">{s.users?.full_name || 'Sem nome'} {s.is_chief && <span className="ml-2 bg-slate-900 text-[9px] text-white px-1 py-0.5 rounded">CH</span>}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 font-black uppercase px-2 py-1 rounded-lg border ${
                              s.state === 'presente' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                              s.state === 'ausente' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-amber-50 border-amber-200 text-amber-500'
                            }`}>
                              {s.state === 'presente' ? <CheckCircle2 size={12} /> : s.state === 'ausente' ? <UserX size={12} /> : <Clock size={12} />} {s.state}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {s.checkin ? <div className="text-[10px]"><p className="font-black text-slate-700">{new Date(s.checkin.created_at).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</p><p className="text-[9px] text-slate-400 uppercase tracking-tighter">{s.checkin.method}</p></div> : '--:--'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {s.state !== 'presente' && <button onClick={async () => { if(window.confirm("Confirmar presença manual?")){ await supabase.from('shift_checkins').insert({ shift_id: s.id, doctor_user_id: s.doctor_user_id, source: 'web_admin', method: 'manual' }); carregarDados(hospitalId!, date); } }} className="text-[10px] font-black bg-slate-900 text-white px-4 py-2 rounded-xl active:scale-95 transition-all">Confirmar Manual</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
