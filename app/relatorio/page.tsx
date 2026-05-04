'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type ReportRow = {
  medico: string;

  semana: string;
  fds: string;
  feriado: string;
  total: string;

  semana_unidades: number;
  semana_chefe_unidades: number;
  fds_unidades: number;
  fds_chefe_unidades: number;
  feriado_unidades: number;
  feriado_chefe_unidades: number;
  total_unidades: number;
};

type HolidayRow = {
  id: number;
  hospital_id: string;
  holiday_date: string; // yyyy-mm-dd
  name: string;
  scope: 'national' | 'state' | 'city' | 'custom';
  uf: string | null;
  city: string | null;
  is_active: boolean;
  created_at: string;
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function monthLabel(m: number) {
  const labels = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ];
  return labels[m - 1] ?? `Mês ${m}`;
}

function monthStartISO(year: number, month: number) {
  return `${year}-${pad2(month)}-01`;
}

function nextMonthStartISO(year: number, month: number) {
  const y = month === 12 ? year + 1 : year;
  const m = month === 12 ? 1 : month + 1;
  return `${y}-${pad2(m)}-01`;
}

function scopeLabel(h: HolidayRow) {
  switch (h.scope) {
    case 'national':
      return 'Nacional';
    case 'state':
      return h.uf ? `Estadual (${h.uf})` : 'Estadual';
    case 'city':
      return h.city ? `Municipal (${h.city})` : 'Municipal';
    case 'custom':
      return 'Manual';
    default:
      return h.scope;
  }
}

export default function RelatorioPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('Hospital');
  const [adminName, setAdminName] = useState<string>('Administrador');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // mês/ano
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);

  // relatório
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  // feriados
  const [holidays, setHolidays] = useState<HolidayRow[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);

  // UI feriados
  const [manualName, setManualName] = useState<string>('');
  const [manualDate, setManualDate] = useState<string>(''); // yyyy-mm-dd
  const [manualActive, setManualActive] = useState<boolean>(true);

  const startDate = useMemo(() => monthStartISO(year, month), [year, month]);
  const endDate = useMemo(() => nextMonthStartISO(year, month), [year, month]);

  // ✅ helper: carrega hospital + admin igual teu dashboard
  const init = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const storedHospitalId =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('activeHospitalId')
        : null;

    if (!storedHospitalId) {
      setLoading(false);
      router.push('/selecionar-hospital');
      return;
    }

    const { data: hosp, error: hospError } = await supabase
      .from('hospitals')
      .select('id, name')
      .eq('id', storedHospitalId)
      .maybeSingle();

    if (hospError || !hosp) {
      console.error('Erro ao carregar hospital:', hospError);
      setErrorMsg('Não foi possível identificar o hospital selecionado.');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    setHospitalId(hosp.id);
    setHospitalName(hosp.name ?? 'Hospital');
    setAdminName(profile?.full_name ?? profile?.email ?? user.email ?? 'Administrador');

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('activeHospitalId', hosp.id);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    init();
  }, [init]);

  // =========================================================
  // ✅ LOAD: RELATÓRIO (por enquanto mock + estrutura pronta)
  // =========================================================
  const loadReport = useCallback(async () => {
    if (!hospitalId) return;
    setReportLoading(true);
    setErrorMsg(null);

    try {
      /**
       * 🔌 Aqui vamos plugar seu SQL agregado.
       * Caminho recomendado:
       * 1) Criar uma VIEW ou RPC (recomendado) no Postgres: payment_report_month(hospital_id, start_date, end_date)
       * 2) Chamar via supabase.rpc(...)
       *
       * Por enquanto: mock para layout ficar pronto.
       */

      const { data, error } = await supabase.rpc('payment_report_month', {
        p_hospital_id: hospitalId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) {
        console.error(error);
        setErrorMsg('Falha ao carregar relatório (RPC).');
        setReportRows([]);
      } else {
        setReportRows((data ?? []) as ReportRow[]);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Falha ao carregar relatório.');
    }

    setReportLoading(false);
  }, [hospitalId, startDate, endDate]);

  // =========================================================
  // ✅ LOAD: FERIADOS (read-only real)
  // =========================================================
  const loadHolidays = useCallback(async () => {
    if (!hospitalId) return;
    setHolidaysLoading(true);
    setErrorMsg(null);

    try {
      const startYear = `${year}-01-01`;
      const endYear = `${year + 1}-01-01`;

      const { data, error } = await supabase
        .from('hospital_holidays')
        .select('id, hospital_id, holiday_date, name, scope, uf, city, is_active, created_at')
        .eq('hospital_id', hospitalId)
        .gte('holiday_date', startYear)
        .lt('holiday_date', endYear)
        .order('holiday_date', { ascending: true });

      if (error) {
        console.error(error);
        setErrorMsg('Falha ao carregar feriados.');
      } else {
        setHolidays((data ?? []) as HolidayRow[]);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Falha ao carregar feriados.');
    }

    setHolidaysLoading(false);
  }, [hospitalId, year]);

  // dispara loads quando hospitalId estiver pronto
  useEffect(() => {
    if (!hospitalId) return;
    loadReport();
    loadHolidays();
  }, [hospitalId, loadReport, loadHolidays, year, month]);

  // =========================================================
  // ✅ AÇÕES (por enquanto: UI pronta / sem escrita)
  // =========================================================
  const onGeneratePDF = async () => {
    if (!hospitalId) return;

    try {
      setErrorMsg(null);

      const res = await fetch('/api/report/payment-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId,
          hospitalName,
          year,
          month,
          startDate,
          endDate,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        console.error(json);
        setErrorMsg(
          json?.detail
            ? `${json.error} — ${json.detail}`
            : (json?.error ?? 'Falha ao gerar PDF.')
        );
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `medturn_relatorio_${year}-${String(month).padStart(2, '0')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setErrorMsg('Falha ao gerar PDF.');
    }
  };

  const onImportNational = async () => {
    if (!hospitalId) return;

    try {
      setErrorMsg(null);

      const res = await fetch('/api/holidays/import-national', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalId, year }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error(json);
        setErrorMsg(
          json?.detail
            ? `${json.error} — ${json.detail}`
            : (json?.error ?? 'Falha ao importar feriados nacionais.')
        );
        return;
      }

      // Recarrega lista após importar
      await loadHolidays();
      alert(`Import nacional OK: ${json.total ?? 0} itens processados.`);
    } catch (e) {
      console.error(e);
      setErrorMsg('Falha ao importar feriados nacionais.');
    }
  };

  const onAddManualHoliday = async () => {
    if (!hospitalId) return;

    const name = manualName.trim();
    const date = manualDate;

    if (!name) {
      setErrorMsg('Informe o nome do feriado.');
      return;
    }
    if (!date) {
      setErrorMsg('Selecione a data do feriado.');
      return;
    }

    setErrorMsg(null);

    try {
      // Dedupe básico: mesma data + nome no mesmo hospital
      const { data: existing, error: existErr } = await supabase
        .from('hospital_holidays')
        .select('id')
        .eq('hospital_id', hospitalId)
        .eq('holiday_date', date)
        .ilike('name', name)
        .limit(1);

      if (existErr) console.error(existErr);

      if ((existing ?? []).length > 0) {
        setErrorMsg('Esse feriado já existe (mesma data e nome).');
        return;
      }

      const payload: any = {
        hospital_id: hospitalId,
        holiday_date: date,
        name,
        scope: 'custom', // <--- TRAVADO EM CUSTOM
        is_active: manualActive,
        uf: null,        // <--- SEMPRE NULO PARA MANUAL
      };

      const { error } = await supabase
        .from('hospital_holidays')
        .insert(payload);

      if (error) {
        console.error(error);
        setErrorMsg('Falha ao adicionar feriado.');
        return;
      }

      // limpa form
      setManualName('');
      setManualDate('');
      setManualActive(true);

      await loadHolidays();
    } catch (e) {
      console.error(e);
      setErrorMsg('Falha ao adicionar feriado.');
    }
  };

  const onToggleHoliday = async (row: HolidayRow) => {
    if (!hospitalId) return;

    try {
      // optimistic UI
      setHolidays((prev) =>
        prev.map((h) => (h.id === row.id ? { ...h, is_active: !h.is_active } : h))
      );

      const { error } = await supabase
        .from('hospital_holidays')
        .update({ is_active: !row.is_active })
        .eq('id', row.id)
        .eq('hospital_id', hospitalId);

      if (error) {
        console.error(error);
        setErrorMsg('Falha ao atualizar feriado (toggle).');
        // rollback
        setHolidays((prev) =>
          prev.map((h) => (h.id === row.id ? { ...h, is_active: row.is_active } : h))
        );
        return;
      }

      await loadHolidays();
    } catch (e) {
      console.error(e);
      setErrorMsg('Falha ao atualizar feriado (toggle).');
      // rollback
      setHolidays((prev) =>
        prev.map((h) => (h.id === row.id ? { ...h, is_active: row.is_active } : h))
      );
    }
  };

  const onDeleteHoliday = async (row: HolidayRow) => {
    if (!hospitalId) return;

    // só deixa excluir custom (manual)
    if (row.scope !== 'custom') {
      alert('Somente feriados custom (manuais) podem ser excluídos.');
      return;
    }

    const confirmed = confirm(
      `Excluir definitivamente o feriado "${row.name}" (${row.holiday_date})?`
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('hospital_holidays')
        .delete()
        .eq('id', row.id)
        .eq('hospital_id', hospitalId);

      if (error) {
        console.error(error);
        setErrorMsg('Falha ao excluir feriado.');
        return;
      }

      await loadHolidays();
    } catch (e) {
      console.error(e);
      setErrorMsg('Falha ao excluir feriado.');
    }
  };

  // =========================================================
  // RENDER
  // =========================================================
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-[32px] border border-slate-100 bg-white px-6 py-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (!hospitalId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-[32px] border border-slate-100 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
          Erro: Hospital não identificado.
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
                MedTurn • Relatório de pagamento
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tighter text-slate-950">
                {hospitalName}
              </h1>

              <p className="mt-2 text-[11px] font-semibold text-slate-400">
                Logado como: {adminName}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95"
              >
                Voltar ao dashboard
              </button>

              <button
                onClick={() => router.push('/selecionar-hospital')}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-100 active:scale-95"
              >
                Trocar hospital
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-6 py-6 space-y-5">
        {errorMsg && (
          <div className="rounded-[28px] border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Controles do período */}
        <section className="rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
                Período
              </p>

              <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
                Período do relatório
              </h2>

              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Base 12h: Manhã/Tarde = 0.5 • Noite/24h = 1.0 • Prioridade: Feriado &gt; FDS &gt; Semana
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#40C0A2]"
              >
                {Array.from({ length: 12 }).map((_, i) => {
                  const m = i + 1;
                  return <option key={m} value={m}>{monthLabel(m)}</option>;
                })}
              </select>

              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-28 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#40C0A2]"
              />

              <button
                onClick={() => { loadReport(); loadHolidays(); }}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95"
              >
                Atualizar
              </button>

              <button
                onClick={onGeneratePDF}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800 active:scale-95"
              >
                Gerar PDF
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-3xl bg-slate-50 px-4 py-3 text-[11px] text-slate-500">
            Intervalo: <strong>{startDate}</strong> → <strong>{endDate}</strong>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* Relatório */}
          <section className="space-y-3">
            <div className="rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
                    Produção
                  </p>

                  <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
                    Relatório por médico
                  </h2>
                </div>

                <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black text-slate-500">
                  {reportLoading ? 'Carregando...' : `${reportRows.length} linhas`}
                </span>
              </div>

              <div className="mt-4 overflow-auto rounded-[28px] border border-slate-100">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-4 py-3">Médico</th>
                      <th className="px-4 py-3">Semana</th>
                      <th className="px-4 py-3">FDS</th>
                      <th className="px-4 py-3">Feriado</th>
                      <th className="px-4 py-3">Total</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {!reportLoading && reportRows.length === 0 && (
                      <tr>
                        <td className="px-4 py-5 text-slate-400" colSpan={5}>
                          Nenhum dado no período.
                        </td>
                      </tr>
                    )}

                    {reportRows.map((r) => (
                      <tr key={r.medico} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-800">{r.medico}</td>
                        <td className="px-4 py-3 text-slate-700">{r.semana}</td>
                        <td className="px-4 py-3 text-slate-700">{r.fds}</td>
                        <td className="px-4 py-3 text-slate-700">{r.feriado}</td>
                        <td className="px-4 py-3 font-black text-slate-950">{r.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 rounded-3xl bg-slate-50 px-4 py-3 text-[11px] leading-relaxed text-slate-500">
                * Etiquetas (PED/UTI/ELET) aparecem no PDF depois, mas não mudam cálculo por enquanto.
              </div>
            </div>
          </section>

          {/* Feriados */}
          <section className="space-y-4">
            <div className="rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
                Feriados
              </p>

              <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
                Feriados do hospital
              </h2>

              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Import Nacional / Estadual (opcional) + adição manual. Toggle ativo/inativo.
              </p>

              <div className="mt-5 space-y-4">
                {/* Import nacional */}
                <div className="flex items-center justify-between gap-3 rounded-3xl bg-slate-50 px-4 py-4">
                  <div>
                    <div className="text-xs font-black text-slate-800">Import nacional</div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      Carrega feriados nacionais do ano ({year}).
                    </div>
                  </div>

                  <button
                    onClick={onImportNational}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    Importar
                  </button>
                </div>

                {/* Import estadual */}
                {/*<div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-slate-700">Import estadual</div>
                    <div className="text-[11px] text-slate-500">Selecione o estado e importe ({year}).</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={uf}
                      onChange={(e) => setUf(e.target.value)}
                      className="text-xs px-2 py-2 rounded-lg border border-slate-300 bg-white"
                      title="UF"
                    >
                      {[
                        'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
                        'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
                        'SP','SE','TO'
                      ].map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>

                    <button
                      onClick={onImportState}
                      className="text-xs px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
                    >
                      Importar
                    </button>
                  </div>
                </div> */}

                {/* Adição manual */}
                <div className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="text-xs font-black text-slate-800">Adicionar manual</div>

                  <div className="mt-3 space-y-2">
                    <input
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Nome do feriado (ex: Carnaval)"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs outline-none focus:border-[#40C0A2]"
                    />

                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={manualDate}
                        onChange={(e) => setManualDate(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs outline-none focus:border-[#40C0A2]"
                      />
                      {/* Seletor removido para forçar sempre 'custom' */}
                    </div>

                    <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={manualActive}
                        onChange={(e) => setManualActive(e.target.checked)}
                      />
                      Ativo
                    </label>

                    <button
                      onClick={onAddManualHoliday}
                      disabled={!manualName.trim() || !manualDate}
                      className={
                        'w-full rounded-2xl border px-4 py-3 text-xs font-black ' +
                        (!manualName.trim() || !manualDate
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')
                      }
                    >
                      Adicionar
                    </button>

                    <div className="text-[10px] leading-relaxed text-slate-400">
                      * Escrita será ligada depois do fluxo de import (com dedupe e validação).
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista */}
            <div className="rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
                    Lista
                  </p>

                  <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">
                    Lista ({year})
                  </h3>
                </div>

                <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black text-slate-500">
                  {holidaysLoading ? 'Carregando...' : `${holidays.length} itens`}
                </span>
              </div>

              {!holidaysLoading && holidays.length === 0 && (
                <div className="mt-4 rounded-3xl bg-slate-50 px-4 py-4 text-[11px] text-slate-400">
                  Nenhum feriado cadastrado no ano.
                </div>
              )}

              {holidays.length > 0 && (
                <ul className="mt-4 max-h-[420px] space-y-2 overflow-auto pr-1">
                  {holidays.map((h) => (
                    <li key={h.id} className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3 text-[11px]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-black text-slate-800">
                            {h.name}
                          </div>

                          <div className="mt-1 font-semibold text-slate-500">
                            {h.holiday_date} • {scopeLabel(h)}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            onClick={() => onToggleHoliday(h)}
                            className={
                              'rounded-full border px-2.5 py-1 text-[10px] font-black ' +
                              (h.is_active
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-100 text-slate-500')
                            }
                            title="Ativar/Desativar"
                          >
                            {h.is_active ? 'Ativo' : 'Inativo'}
                          </button>

                          {h.scope === 'custom' && (
                            <button
                              onClick={() => onDeleteHoliday(h)}
                              className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-700 hover:bg-red-100"
                              title="Excluir"
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}