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

  const rawRedirect = searchParams.get('redirect');
  const redirect = rawRedirect && rawRedirect.startsWith('/') ? rawRedirect : '/dashboard';

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data, error } = await supabase
        .from('hospital_users')
        .select('hospital_id, role, is_admin, hospitals(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar hospitais:', error);
        setErrorMsg('Não foi possível carregar seus hospitais.');
        setLoading(false);
        return;
      }

      const formatted = (data ?? []).map((item: any) => ({
        ...item,
        hospitals: Array.isArray(item.hospitals) ? item.hospitals[0] : item.hospitals,
      })) as HospitalPickRow[];

      if (!formatted.length) {
        setErrorMsg('Você ainda não está vinculado a nenhum hospital.');
      }

      setRows(formatted);
      setLoading(false);
    }

    load();
  }, [router]);

  async function choose(hospitalId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`activeHospitalId:${user.id}`, hospitalId);
      window.localStorage.setItem('activeHospitalId', hospitalId);
    }

    let next = redirect;

    if (typeof window !== 'undefined') {
      try {
        const url = new URL(redirect, window.location.origin);
        if (!url.searchParams.get('hospitalId')) {
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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-600">Carregando hospitais...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <p className="text-[11px] uppercase text-slate-500">MedTurn</p>
          <h1 className="text-xl font-semibold">Selecionar hospital</h1>
          <p className="text-[11px] text-slate-500">
            Escolha qual hospital você quer gerenciar agora.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {errorMsg && (
          <div className="bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-xs mb-4">
            {errorMsg}
          </div>
        )}

        {!errorMsg && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rows.map((r) => {
              const name = r.hospitals?.name ?? 'Hospital';
              const roleLabel =
                (r.is_admin ? 'Admin' : (r.role ? String(r.role) : 'Membro'));

              return (
                <button
                  key={r.hospital_id}
                  onClick={() => choose(r.hospital_id)}
                  className="bg-white border rounded-xl p-4 text-left hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-semibold mb-1">{name}</h2>
                      <p className="text-[11px] text-slate-500">Acessar painel</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 text-slate-600 bg-slate-50">
                      {roleLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 text-[11px] text-slate-500">
          Você poderá trocar de hospital novamente a qualquer momento pelo menu.
        </div>
      </main>
    </div>
  );
}

// Componente "Casca" que envolve o conteúdo em Suspense
export default function SelecionarHospitalPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-500">Carregando seleção...</div>}>
      <SelecionarHospitalContent />
    </Suspense>
  );
}