'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type HospitalPickRow = {
  hospital_id: string;
  hospitals: { name: string | null } | null;
  role?: string | null;
  is_admin?: boolean | null;
};

// Componente interno que usa useSearchParams (precisa de Suspense)
function SelecionarHospitalContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ Agora seguro dentro do Suspense

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<HospitalPickRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
const [userId, setUserId] = useState<string | null>(null);
const [choosingHospitalId, setChoosingHospitalId] = useState<string | null>(null);

  const rawRedirect = searchParams.get('redirect');
  const redirect = rawRedirect && rawRedirect.startsWith('/') ? rawRedirect : '/dashboard';

useEffect(() => {
  async function load() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
  .from('hospital_users')
  .select('hospital_id, role, is_admin, hospitals(name)')
  .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao carregar hospitais:', error);
        setErrorMsg('Não foi possível carregar seus hospitais.');
        setLoading(false);
        return;
      }

      const formatted = (data ?? [])
  .map((item: any) => ({
    ...item,
    hospitals: Array.isArray(item.hospitals) ? item.hospitals[0] : item.hospitals,
  }))
  .sort((a: HospitalPickRow, b: HospitalPickRow) => {
    const nameA = a.hospitals?.name ?? 'Hospital';
    const nameB = b.hospitals?.name ?? 'Hospital';

    return nameA.localeCompare(nameB, 'pt-BR', {
      sensitivity: 'base',
    });
  }) as HospitalPickRow[];

      if (!formatted.length) {
        setErrorMsg('Você ainda não está vinculado a nenhum hospital.');
      }

      setRows(formatted);
      setLoading(false);
    }

    load();
  }, [router]);

  function choose(hospitalId: string) {
  if (!userId) {
    router.push('/login');
    return;
  }

  setChoosingHospitalId(hospitalId);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(`activeHospitalId:${userId}`, hospitalId);
    window.localStorage.setItem('activeHospitalId', hospitalId);
  }

  let next = redirect;

  if (typeof window !== 'undefined') {
    try {
      const url = new URL(redirect, window.location.origin);

      const shouldAttachHospitalId =
        url.pathname !== '/dashboard' &&
        !url.searchParams.get('hospitalId');

      if (shouldAttachHospitalId) {
        url.searchParams.set('hospitalId', hospitalId);
      }

      next = url.pathname + url.search + url.hash;
    } catch {
      next = redirect;
    }
  }

  router.push(next);
}

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-[32px] border border-slate-100 bg-white px-6 py-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Carregando hospitais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="rounded-b-[28px] bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1500px] items-start px-6 py-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center">
            <img
              src="/medturn-logo-transparent.png"
              alt="MedTurn"
              className="h-20 w-20 object-contain"
            />
          </div>

          <div className="ml-5 flex flex-1 flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="pt-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#40C0A2]">
                MedTurn
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tighter text-slate-950">
                Selecionar hospital
              </h1>

              <p className="mt-2 text-[11px] font-semibold text-slate-400">
                Escolha qual hospital você quer gerenciar agora.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-6 py-6">
        {errorMsg && (
          <div className="mb-5 rounded-[28px] border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {!errorMsg && (
          <section className="rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
                Hospitais disponíveis
              </p>

              <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
                Acessar painel
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((r) => {
                const name = r.hospitals?.name ?? 'Hospital';
                const roleLabel =
                  (r.is_admin ? 'Admin' : (r.role ? String(r.role) : 'Membro'));

                return (
<button
  key={r.hospital_id}
  onClick={() => choose(r.hospital_id)}
  disabled={choosingHospitalId !== null}
  className="group rounded-[28px] border border-slate-100 bg-slate-50 p-5 text-left transition hover:border-[#40C0A2]/30 hover:bg-[#40C0A2]/5 active:scale-[0.99] disabled:opacity-60"
>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Hospital
                        </p>

                        <h3 className="mt-1 text-base font-black text-slate-900">
                          {name}
                        </h3>

                        <p className="mt-3 text-xs leading-relaxed text-slate-500">
                          Acessar painel administrativo deste hospital.
                        </p>
                      </div>

                      <span className="rounded-2xl border border-slate-100 bg-white px-3 py-1 text-[10px] font-black text-slate-500 shadow-sm">
                        {choosingHospitalId === r.hospital_id ? 'Abrindo...' : roleLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <div className="mt-5 rounded-[28px] border border-slate-100 bg-white px-5 py-4 text-[11px] font-semibold text-slate-400 shadow-sm">
          Você poderá trocar de hospital novamente a qualquer momento pelo menu.
        </div>
      </main>
    </div>
  );
}

// Componente "Casca" que envolve o conteúdo em Suspense
export default function SelecionarHospitalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="rounded-[32px] border border-slate-100 bg-white px-6 py-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Carregando seleção...</p>
          </div>
        </div>
      }
    >
      <SelecionarHospitalContent />
    </Suspense>
  );
}