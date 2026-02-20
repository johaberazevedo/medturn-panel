'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  Settings, MapPin, Power, Save, ChevronLeft, Loader2, Globe,
  Activity, Clock, CheckCircle2, AlertCircle, RefreshCw, UserX
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

export default function CheckinAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [hospConfig, setHospConfig] = useState({ name: '', is_enabled: true, lat: '', lng: '', radius: '200' });
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const carregarDados = useCallback(async (hId: string, d: string) => {
    setFetching(true);
    const { data: hosp } = await supabase.from('hospitals').select('*').eq('id', hId).single();
    if (hosp) setHospConfig({ 
      name: hosp.name, is_enabled: hosp.is_checkin_enabled, 
      lat: hosp.latitude?.toString() || '', lng: hosp.longitude?.toString() || '', 
      radius: hosp.geofence_radius?.toString() || '200' 
    });

    const { data: sData } = await supabase.from('shifts').select('*, users(full_name, email)').eq('hospital_id', hId).eq('date', d).order('period');
    const sIds = sData?.map(x => x.id) || [];
    const { data: cData } = await supabase.from('shift_checkins').select('*').in('shift_id', sIds);
    
    setShifts(sData?.map(s => ({ ...s, users: Array.isArray(s.users) ? s.users[0] : s.users })) || []);
    setCheckins(cData || []);
    setFetching(false);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      const hId = localStorage.getItem(`activeHospitalId:${user.id}`);
      if (!hId) return router.push('/selecionar-hospital');
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

        {/* LISTAGEM AGRUPADA POR TURNOS */}
        <div className="space-y-6">
          {PERIOD_ORDER.map(p => {
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