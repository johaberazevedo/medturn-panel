'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import OneSignalInit from '../components/OneSignalInit';
import EnableWebPushButton from '../components/EnableWebPushButton';

type NextShift = {
  date: string;
  period: string;
  hospital_name: string;
};

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

  // hoje
  if (shift.period === '24h') return false;

  const minutes = minutesNowLocal(now);

  const cutoff: Record<'manha' | 'tarde' | 'noite', number> = {
    manha: 9 * 60,   // 09:00
    tarde: 14 * 60,  // 14:00
    noite: 20 * 60,  // 20:00
  };

  return minutes >= cutoff[shift.period];
}

const WEB_PUSH_PILOT_USER_IDS = [
  'd6309a52-3678-424f-b232-c4f42bcb7785',
  '92ccb1ad-adf2-4c7e-aba0-ba0e397a45af',
  '6b0e88ec-f92b-4662-af77-70d2210dca9f',
  'ef659b9d-0b42-47fa-b429-856701556b39',
  '92afc0ad-6556-48e4-8aa6-628e192ef4a2',
];

function isWebPushPilot(userId?: string | null) {
  if (!userId) return false;
  return WEB_PUSH_PILOT_USER_IDS.includes(userId);
}
export default function MedicoHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
const [userName, setUserName] = useState('Doutor(a)');
const [stats, setStats] = useState({ disponiveis: 0, disponibilidade30d: 0 });
const [nextShift, setNextShift] = useState<NextShift | null>(null);
const [canCheckin, setCanCheckin] = useState(false);
const [currentUserId, setCurrentUserId] = useState<string | null>(null);
const [webPushEnabled, setWebPushEnabled] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

setCurrentUserId(user.id);
setWebPushEnabled(isWebPushPilot(user.id));

      const { data: profile } = await supabase.from('users').select('full_name').eq('id', user.id).maybeSingle();
      if (profile?.full_name) setUserName(profile.full_name.split(' ')[0]);

      const { data: userHosp } = await supabase.from('hospital_users').select('hospital_id').eq('user_id', user.id);
      const hospitalIds = userHosp?.map(h => h.hospital_id) || [];

      if (hospitalIds.length > 0) {
  const today = localYYYYMMDD(); // ✅ fuso do celular (helper do topo)

// 1. Busca o próximo plantão para o card do header
const { data: shifts } = await supabase
  .from('shifts')
  .select('date, period, hospitals(name)')
  .eq('doctor_user_id', user.id)
  .gte('date', today) // ✅ fuso local
  .order('date', { ascending: true })
  .limit(1)
  .maybeSingle();

if (shifts) {
  setNextShift({
    date: shifts.date,
    period: shifts.period,
    hospital_name: (shifts.hospitals as any)?.name || 'Hospital',
  });
}

// 2. ✅ LÓGICA DO BOTÃO: Verifica se tem plantão HOJE com check-in LIGADO
const { data: todayShifts } = await supabase
  .from('shifts')
  .select('id, hospitals(is_checkin_enabled)')
  .eq('doctor_user_id', user.id)
  .eq('date', today); // ✅ fuso local

const hasEnabledCheckin = todayShifts?.some(
  s => (s.hospitals as any)?.is_checkin_enabled === true
);
setCanCheckin(!!hasEnabledCheckin);

// 3. ✅ Badge "Plantões Disponíveis" batendo com a regra por período do Marketplace
const { data: swapRows, error: swapErr } = await supabase
  .from('shift_swap_requests')
  .select('id, target_user_id, shift:from_shift_id(date, period)')
  .in('hospital_id', hospitalIds)
  .eq('status', 'pendente')
  .neq('requester_user_id', user.id)
  .or(`target_user_id.eq.${user.id},target_user_id.is.null`);

let countDisponiveis = 0;

if (!swapErr) {
  countDisponiveis = (swapRows ?? [])
    .map((row: any) => ({
      ...row,
      shift: Array.isArray(row.shift) ? row.shift[0] : row.shift,
    }))
    .filter(r => r.shift?.date && r.shift?.period)
    .filter(r => !isExpiredShift(r.shift))
    .length;
}

// ✅ Badge "Disponibilidade" = quantos ANÚNCIOS (disponibilidades de outros médicos) nos próximos 30 dias
const end30 = (() => {
  const d = new Date(today + 'T00:00:00');
  d.setDate(d.getDate() + 29);
  return localYYYYMMDD(d);
})();

const { data: availAds30, error: availAds30Err } = await supabase
  .from('availability')
  .select('user_id, date') // só precisa disso pra deduplicar
  .in('hospital_id', hospitalIds)
  .neq('user_id', user.id)     // ✅ só anúncios de OUTROS médicos
  .gte('date', today)
  .lte('date', end30);

// ✅ “anúncio” = (médico + dia) (não conta manhã/tarde/noite separado)
const disponibilidade30d = availAds30Err
  ? 0
  : new Set((availAds30 ?? []).map((r: any) => `${r.user_id}|${r.date}`)).size;

setStats({ disponiveis: countDisponiveis, disponibilidade30d });
      }

      setLoading(false);
    }
    init();
  }, [router]);

  function formatNextDate(dateStr: string) {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const date = new Date(dateStr + 'T12:00:00');
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm font-medium text-slate-400">MedTurn carregando...</div>;

  return (
  <>
    <OneSignalInit
      enabled={webPushEnabled}
      externalId={currentUserId}
    />

    <div className="min-h-screen bg-slate-50">
      <header className="bg-white px-6 pt-8 pb-6 rounded-b-[40px] shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Painel do Médico</p>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Olá, {userName}!</h1>
          </div>
          <button 
            onClick={() => router.push('/perfil')}
            className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-transform active:scale-90"
          >
            👤
          </button>
        </div>

        <div className="mt-6 bg-slate-900 rounded-3xl p-5 text-white shadow-xl shadow-slate-200">
          <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Próximo Plantão</p>
          <div className="flex justify-between items-end">
            {nextShift ? (
              <div>
                <h3 className="text-lg font-bold">{formatNextDate(nextShift.date)}</h3>
                <p className="text-xs text-slate-300 capitalize">{nextShift.period} • {nextShift.hospital_name}</p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-slate-500 italic">Nenhum agendado</h3>
                <p className="text-xs text-slate-500">Consulte sua agenda do mês</p>
              </div>
            )}
            <button onClick={() => router.push('/medico/calendario')} className="text-[10px] font-black bg-emerald-500 px-3 py-1.5 rounded-xl uppercase transition-all active:scale-95">Ver Tudo</button>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-4">
        
{webPushEnabled && <EnableWebPushButton />}
        {/* ✅ NOVO BOTÃO DE CHECK-IN: Aparece seguindo a sua lógica */}
        {canCheckin && (
          <button 
            onClick={() => router.push('/medico/checkin')}
            className="w-full bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl">📍</div>
              <div className="text-left">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Confirmar Presença</h2>
                <p className="text-xs text-slate-500">Check-in disponível para hoje</p>
              </div>
            </div>
          </button>
        )}

        <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Atalhos Rápidos</h2>

        <div className="grid grid-cols-2 gap-4">
          <QuickCard 
            title="Minha Agenda" 
            icon="📅" 
            color="bg-blue-50"
            onClick={() => router.push('/medico/calendario')}
          />
          <QuickCard 
  title="Disponibilidade"
  subtitle="Anuncie a sua • Veja plantonistas disponíveis"
  icon="✅" 
  color="bg-emerald-50"
  badge={stats.disponibilidade30d > 0 ? `${stats.disponibilidade30d}` : undefined}
  onClick={() => router.push('/medico/disponibilidade')}
/>
        </div>

        <button 
          onClick={() => router.push('/medico/propostas')}
          className="w-full bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl">🤝</div>
            <div className="text-left">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Plantões Disponíveis</h2>
              <p className="text-xs text-slate-500">Encontre oportunidades extras</p>
            </div>
          </div>
          {stats.disponiveis > 0 && (
            <div className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
              {stats.disponiveis} NOVOS
            </div>
          )}
        </button>

        <button
  onClick={async () => {
    if (typeof window !== 'undefined') {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal) {
  await OneSignal.logout();
});
    }

    await supabase.auth.signOut();
    router.push('/login');
  }}
  className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors mt-4"
>
  Sair da Conta
</button>
      </main>
        </div>
  </>
  );
}

function QuickCard({
  title,
  subtitle,
  icon,
  color,
  onClick,
  badge,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  color: string;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} relative p-6 rounded-[32px] flex flex-col items-center gap-1 transition-all active:scale-95 shadow-sm`}
    >
      {badge && (
        <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full">
          {badge}
        </div>
      )}

      <span className="text-3xl">{icon}</span>

      <span className="text-[9px] font-black uppercase text-slate-700 text-center leading-tight">
        {title}
      </span>

      {subtitle && (
        <span className="text-[9px] text-slate-500 text-center leading-tight">
          {subtitle}
        </span>
      )}
    </button>
  );
}
