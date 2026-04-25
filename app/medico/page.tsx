'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import OneSignalInit from '../components/OneSignalInit';
import EnableWebPushButton from '../components/EnableWebPushButton';
import InstallMedTurnCard from '../components/InstallMedTurnCard';
import PilotManifestLink from '../components/PilotManifestLink';

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

export default function MedicoHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
const [userName, setUserName] = useState('Doutor(a)');
const [stats, setStats] = useState({ disponiveis: 0, disponibilidade30d: 0 });
const [nextShift, setNextShift] = useState<NextShift | null>(null);
const [canCheckin, setCanCheckin] = useState(false);
const [currentUserId, setCurrentUserId] = useState<string | null>(null);

const loadHomeData = useCallback(async (userId: string) => {
  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.full_name) {
    setUserName(profile.full_name.split(' ')[0]);
  }

  const { data: userHosp } = await supabase
    .from('hospital_users')
    .select('hospital_id')
    .eq('user_id', userId);

  const hospitalIds = userHosp?.map(h => h.hospital_id) || [];

  if (hospitalIds.length === 0) {
    setNextShift(null);
    setCanCheckin(false);
    setStats({ disponiveis: 0, disponibilidade30d: 0 });
    return;
  }

  const today = localYYYYMMDD();

  const { data: shifts } = await supabase
    .from('shifts')
    .select('date, period, hospitals(name)')
    .eq('doctor_user_id', userId)
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (shifts) {
    setNextShift({
      date: shifts.date,
      period: shifts.period,
      hospital_name: (shifts.hospitals as any)?.name || 'Hospital',
    });
  } else {
    setNextShift(null);
  }

  const { data: todayShifts } = await supabase
    .from('shifts')
    .select('id, hospitals(is_checkin_enabled)')
    .eq('doctor_user_id', userId)
    .eq('date', today);

  const hasEnabledCheckin = todayShifts?.some(
    s => (s.hospitals as any)?.is_checkin_enabled === true
  );
  setCanCheckin(!!hasEnabledCheckin);

const { data: swapRows, error: swapErr } = await supabase
  .from('shift_swap_requests')
  .select('id, target_user_id, reason, shift:from_shift_id(date, period)')
  .in('hospital_id', hospitalIds)
  .eq('status', 'pendente')
  .neq('requester_user_id', userId)
  .or(`target_user_id.eq.${userId},target_user_id.is.null`);

  let countDisponiveis = 0;

  if (!swapErr) {
    countDisponiveis = (swapRows ?? [])
  .map((row: any) => ({
    ...row,
    shift: Array.isArray(row.shift) ? row.shift[0] : row.shift,
  }))
  .filter(r => r.shift?.date && r.shift?.period)
  .filter(r => !isExpiredShift(r.shift))
  .filter(r => {
    const isMarketplaceOpen =
  r.target_user_id === null &&
  r.reason !== '__offer_via_disponibilidade__';

    const isDirectedPendingForMe =
      r.target_user_id === userId &&
      r.reason === '__direct_offer__';

    return isMarketplaceOpen || isDirectedPendingForMe;
  })
  .length;
  }

  const end30 = (() => {
    const d = new Date(today + 'T00:00:00');
    d.setDate(d.getDate() + 29);
    return localYYYYMMDD(d);
  })();

  const { data: availAds30, error: availAds30Err } = await supabase
  .from('availability')
  .select('user_id, date')
  .in('hospital_id', hospitalIds)
  .neq('user_id', userId)
  .is('expires_at', null)
  .gte('date', today)
  .lte('date', end30);

  const disponibilidade30d = availAds30Err
    ? 0
    : new Set((availAds30 ?? []).map((r: any) => `${r.user_id}|${r.date}`)).size;

  setStats({
    disponiveis: countDisponiveis,
    disponibilidade30d,
  });
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

    setCurrentUserId(user.id);

await loadHomeData(user.id);
setLoading(false);
  }

  init();
}, [router, loadHomeData]);

useEffect(() => {
  if (!currentUserId) return;

  const refresh = async () => {
    await loadHomeData(currentUserId);
  };

  const channel = supabase
    .channel(`medico-home-${currentUserId}`)
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
        table: 'availability',
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
        table: 'hospitals',
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
}, [currentUserId, loadHomeData]);

  function formatNextDate(dateStr: string) {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const date = new Date(dateStr + 'T12:00:00');
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm font-medium text-slate-400">MedTurn carregando...</div>;

  return (
  <>
<PilotManifestLink enabled={true} />

<OneSignalInit
  enabled={true}
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
        
<EnableWebPushButton />
<InstallMedTurnCard />
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
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Propostas</h2>
<p className="text-xs text-slate-500">Encontre oportunidades extras e gerencie suas trocas.</p>
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
