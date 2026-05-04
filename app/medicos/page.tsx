'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { registerUser } from '@/app/actions/register';

type DoctorRow = {
  id: number; // ID do vínculo (hospital_users)
  role: 'admin' | 'doctor' | 'coordenador';
  created_at: string;
  users: {
    id: string; // UUID do usuário (NECESSÁRIO PARA UPDATE)
    full_name: string | null;
    email: string | null;
  } | null;
};

type HospitalRow = {
  id: string;
  name: string | null;
};

export default function MedicosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hospitalName, setHospitalName] = useState<string>('Seu hospital');
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Estados do Formulário de Cadastro (Novo)
  const [showForm, setShowForm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Estados de Ação na Tabela
  const [savingChangeId, setSavingChangeId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  // --- NOVOS ESTADOS PARA EDIÇÃO ---
  const [editingDoctor, setEditingDoctor] = useState<DoctorRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // --- NOVOS ESTADOS: VINCULAR EM OUTRO HOSPITAL ---
  const [linkingDoctor, setLinkingDoctor] = useState<DoctorRow | null>(null);
  const [linkToHospitalId, setLinkToHospitalId] = useState<string>('');
  const [linkingToOther, setLinkingToOther] = useState(false);

  // =========================
  // IMPORTAR MÉDICOS (NOVO)
  // =========================
  const [myRole, setMyRole] = useState<DoctorRow['role'] | null>(null);
  const [hospitals, setHospitals] = useState<HospitalRow[]>([]);
  const [importFromHospitalId, setImportFromHospitalId] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);

  async function reloadDoctors(hId: string) {
    const { data: doctorsData, error: doctorsError } = await supabase
      .from('hospital_users')
      .select('id, role, created_at, users(id, full_name, email)')
      .eq('hospital_id', hId)
      .order('role', { ascending: true });

    if (doctorsError) {
      setError('Não foi possível carregar a lista de médicos.');
    } else if (doctorsData) {
      const formatted = doctorsData.map((d: any) => ({
        ...d,
        users: Array.isArray(d.users) ? d.users[0] : d.users,
      }));
      setDoctors(formatted as DoctorRow[]);
    }
  }

  async function loadHospitalsList() {
    const { data, error } = await supabase
      .from('hospitals')
      .select('id, name')
      .order('name', { ascending: true });

    if (!error && data) {
      setHospitals(data as HospitalRow[]);
    }
  }

  useEffect(() => {
    async function loadDoctors() {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push('/login');
        return;
      }

      const storedHospitalId =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('activeHospitalId')
          : null;

      if (!storedHospitalId) {
        router.push('/selecionar-hospital');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      setUserName(profile?.full_name ?? user.email ?? 'Usuário');

      // Hospital selecionado (nome)
      const { data: hosp, error: hospError } = await supabase
        .from('hospitals')
        .select('id, name')
        .eq('id', storedHospitalId)
        .maybeSingle();

      if (hospError || !hosp) {
        setError('Não foi possível identificar o hospital selecionado.');
        setLoading(false);
        return;
      }

      setHospitalId(hosp.id);
      setHospitalName(hosp.name ?? 'Seu hospital');

      // Meu papel nesse hospital (pra liberar importação só pra admin/coordenador)
      const { data: me, error: meErr } = await supabase
        .from('hospital_users')
        .select('role')
        .eq('hospital_id', hosp.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!meErr && me?.role) {
        setMyRole(me.role as DoctorRow['role']);
      } else {
        setMyRole(null);
      }

      await reloadDoctors(hosp.id);
      await loadHospitalsList();

      setLoading(false);
    }

    loadDoctors();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  // Cadastro de Novo Médico
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);
    setActionMessage(null);

    const formData = new FormData(event.currentTarget);
    if (hospitalId) {
      formData.append('hospitalId', hospitalId);
    }

    const result = await registerUser(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setActionMessage('Médico cadastrado e vinculado com sucesso!');
      setShowForm(false);
      if (hospitalId) await reloadDoctors(hospitalId);
    }
    setIsPending(false);
  }

  async function handleChangeRole(doctorId: number, newRole: DoctorRow['role']) {
    if (!hospitalId) return;

    setError(null);
    setActionMessage(null);
    setSavingChangeId(doctorId);

    // Sincronização automática: se for admin no texto, é admin no booleano
    const isAdmin = newRole === 'admin';

    const { data, error: updateError } = await supabase
      .from('hospital_users')
      .update({
        role: newRole,
        is_admin: isAdmin,
      })
      .eq('id', doctorId)
      .select('id'); // Retorna o ID se o bouncer (RLS) permitir a escrita

    if (updateError) {
      console.error('Erro técnico:', updateError);
      setError('Erro ao atualizar: ' + updateError.message);
      setSavingChangeId(null);
      return;
    }

    // Se data vier vazio, o banco ignorou o comando por falta de permissão (RLS)
    if (!data || data.length === 0) {
      setError('Ação bloqueada pelo banco. Verifique se você tem permissão neste hospital.');
      setSavingChangeId(null);
      return;
    }

    await reloadDoctors(hospitalId);
    setActionMessage('Papel e permissões sincronizados com sucesso!');
    setSavingChangeId(null);
  }

  async function handleRemoveDoctor(doctorId: number) {
    if (!hospitalId) return;
    const confirmDelete = window.confirm(
      'Remover este médico do hospital? Ele perderá acesso ao painel deste hospital.'
    );
    if (!confirmDelete) return;

    setError(null);
    setActionMessage(null);
    setRemovingId(doctorId);

    try {
      const { error: deleteError } = await supabase
        .from('hospital_users')
        .delete()
        .eq('id', doctorId);

      if (deleteError) {
        setError('Não foi possível remover o médico.');
        return;
      }

      await reloadDoctors(hospitalId);
      setActionMessage('Médico removido do hospital.');
    } finally {
      setRemovingId(null);
    }
  }

  // --- NOVA FUNÇÃO: Abrir Modal de Edição ---
  function openEditModal(doctor: DoctorRow) {
    setEditingDoctor(doctor);
    setEditName(doctor.users?.full_name || '');
    setEditEmail(doctor.users?.email || '');
    setError(null);
    setActionMessage(null);
  }

  async function handleUpdateDoctor(e: FormEvent) {
    e.preventDefault();
    if (!editingDoctor || !editingDoctor.users?.id || !hospitalId) return;

    setIsUpdating(true);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: editName,
      })
      .eq('id', editingDoctor.users.id);

    if (updateError) {
      setError('Erro ao atualizar dados: ' + updateError.message);
      setIsUpdating(false);
      return;
    }

    await reloadDoctors(hospitalId);
    setActionMessage('Dados do médico atualizados com sucesso!');
    setEditingDoctor(null);
    setIsUpdating(false);
  }

  // =========================
  // VINCULAR EM OUTRO HOSPITAL
  // =========================
  function openLinkModal(doctor: DoctorRow) {
    setLinkingDoctor(doctor);
    setLinkToHospitalId('');
    setError(null);
    setActionMessage(null);
  }

  async function handleLinkDoctorToOtherHospital() {
    // 1. Validações iniciais (Mantidas iguais)
    if (!hospitalId || !linkingDoctor?.users?.id) return;

    setError(null);
    setActionMessage(null);

    // Só admin/coordenador pode vincular
    if (!(myRole === 'admin' || myRole === 'coordenador')) {
      setError('Apenas Administrador ou Coordenador pode vincular médicos em outro hospital.');
      return;
    }

    if (!linkToHospitalId) {
      setError('Selecione o hospital destino.');
      return;
    }

    if (linkToHospitalId === hospitalId) {
      setError('Escolha um hospital destino diferente do hospital atual.');
      return;
    }

    setLinkingToOther(true);

    // 2. AQUI ENTRA O PATCH (Substituindo o .insert pelo .rpc)
    try {
      const { error: rpcError } = await supabase.rpc('link_doctor_securely', {
        target_hospital_id: linkToHospitalId,
        target_user_id: linkingDoctor.users.id,
        target_role: linkingDoctor.role, // Mantém o mesmo papel atual
      });

      if (rpcError) {
        const msg = (rpcError as any)?.message ?? 'Erro ao vincular.';
        const lower = String(msg).toLowerCase();

        // Tratamento para duplicidade
        if (lower.includes('duplicate') || lower.includes('unique') || lower.includes('violate')) {
          setError('Esse médico já está vinculado ao hospital destino.');
          return;
        }

        setError('Não foi possível vincular: ' + msg);
        return;
      }

      // Sucesso
      const targetName =
        hospitals.find((h) => h.id === linkToHospitalId)?.name ?? 'hospital destino';

      setActionMessage(`Médico vinculado com sucesso em "${targetName}".`);
      setLinkingDoctor(null);
      setLinkToHospitalId('');
    } catch (err: any) {
      setError('Erro inesperado: ' + (err.message || String(err)));
    } finally {
      setLinkingToOther(false);
    }
  }

  // =========================
  // IMPORTAR (AÇÃO)
  // =========================
  async function handleImportAllFromHospital() {
    if (!hospitalId) return;

    setImportErr(null);
    setImportMsg(null);

    // Só admin/coordenador pode disparar
    if (!(myRole === 'admin' || myRole === 'coordenador')) {
      setImportErr('Apenas Administrador ou Coordenador pode importar médicos.');
      return;
    }

    if (!importFromHospitalId) {
      setImportErr('Selecione o hospital de origem.');
      return;
    }

    if (importFromHospitalId === hospitalId) {
      setImportErr('Escolha um hospital de origem diferente do hospital atual.');
      return;
    }

    const fromName =
      hospitals.find((h) => h.id === importFromHospitalId)?.name ?? 'hospital de origem';

    const ok = window.confirm(
      `Importar TODOS os usuários (médicos, coordenadores e admins) de "${fromName}" para "${hospitalName}"?\n\nIsso NÃO apaga ninguém. Apenas cria vínculos que faltam e atualiza vínculos existentes.`
    );
    if (!ok) return;

    setImporting(true);

    try {
      const { data, error } = await supabase.rpc('copy_hospital_users_hu_safe', {
        p_from_hospital_id: importFromHospitalId,
        p_to_hospital_id: hospitalId,
      });

      if (error) {
        // Se a RPC ainda não existir, cai aqui
        setImportErr(`Erro ao importar: ${error.message}`);
        return;
      }

      // data geralmente vem como array com 1 linha, mas pode variar
      const row = Array.isArray(data) ? data[0] : data;
      const inserted = row?.inserted_count ?? 0;
      const updated = row?.updated_count ?? 0;

      setImportMsg(`Importação concluída. Novos vínculos: ${inserted}. Atualizados: ${updated}.`);
      await reloadDoctors(hospitalId);
    } catch (e: any) {
      setImportErr(`Erro inesperado ao importar: ${e?.message ?? String(e)}`);
    } finally {
      setImporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-[32px] border border-slate-100 bg-white px-6 py-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Carregando médicos do hospital...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50">
      {/* MODAL: VINCULAR EM OUTRO HOSPITAL */}
      {linkingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[34px] bg-white p-6 shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
              Multihospital
            </p>

            <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">
              Vincular em outro hospital
            </h3>

            <p className="mt-2 text-xs text-slate-500">
              Médico:{' '}
              <span className="font-semibold text-slate-700">
                {linkingDoctor.users?.full_name ?? 'Sem nome'}
              </span>
            </p>

            <label className="mt-5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
              Hospital destino
            </label>

            <select
              value={linkToHospitalId}
              onChange={(e) => setLinkToHospitalId(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#40C0A2]"
              disabled={linkingToOther}
            >
              <option value="">Selecione...</option>
              {hospitals
                .filter((h) => h.id !== hospitalId)
                .map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name ?? h.id}
                  </option>
                ))}
            </select>

            <div className="flex justify-end gap-2 pt-5">
              <button
                type="button"
                onClick={() => setLinkingDoctor(null)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-100"
                disabled={linkingToOther}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleLinkDoctorToOtherHospital}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800 disabled:opacity-50"
                disabled={linkingToOther || !linkToHospitalId}
              >
                {linkingToOther ? 'Vinculando...' : 'Vincular'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO (OVERLAY) */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[34px] bg-white p-6 shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
              Cadastro
            </p>

            <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">
              Editar médico
            </h3>

            <form onSubmit={handleUpdateDoctor} className="mt-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Nome completo
                </label>

                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#40C0A2]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  E-mail
                </label>

                <input
                  type="email"
                  value={editEmail}
                  disabled
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500"
                />

                <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                  * E-mail apenas para o registro visual. O login do usuário pode permanecer o original,
                  em caso de dificuldades, considere recriar o usuário.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-100"
                  disabled={isUpdating}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800 disabled:opacity-50"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                MedTurn • Equipe
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tighter text-slate-950">
                Médicos do hospital
              </h1>

              <p className="mt-2 text-[11px] font-semibold text-slate-400">
                {hospitalName} {userName ? `• Logado como ${userName}` : ''}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95"
              >
                Dashboard
              </button>

              <button
                onClick={() => router.push('/escala')}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95"
              >
                Escala mensal
              </button>

              <button
                onClick={() => router.push('/perfil')}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-100 active:scale-95"
              >
                Meu perfil
              </button>

              <button
                onClick={handleLogout}
                className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-red-700 hover:bg-red-100 active:scale-95"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-[1500px] px-6 py-6 space-y-5">
          <section className="rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
                  Equipe
                </p>

                <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">
                  Médicos vinculados
                </h2>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Hospital: <span className="text-slate-500">{hospitalName}</span>
                </p>
              </div>

              <button
                onClick={() => {
                  setShowForm((prev) => !prev);
                  setError(null);
                  setActionMessage(null);
                }}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800 active:scale-95"
              >
                {showForm ? 'Cancelar' : 'Adicionar médico'}
              </button>
            </div>

            {/* FORMULÁRIO BLINDADO (NOVO USUÁRIO) */}
            {showForm && (
              <form
                onSubmit={onSubmit}
                className="mb-5 space-y-4 rounded-[28px] border border-slate-100 bg-slate-50 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
                      Novo cadastro
                    </p>

                    <h3 className="mt-1 text-base font-black text-slate-950">
                      Cadastrar novo médico
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-2xl bg-white px-3 py-2 text-[10px] font-black text-slate-500 shadow-sm hover:bg-slate-100"
                  >
                    Fechar
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Nome completo
                    </label>

                    <input
                      name="fullName"
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#40C0A2]"
                      placeholder="Ex: Dr. João Silva"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      E-mail de acesso
                    </label>

                    <input
                      name="email"
                      type="email"
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#40C0A2]"
                      placeholder="medico@hospital.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Senha provisória
                    </label>

                    <input
                      name="password"
                      type="text"
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#40C0A2]"
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2 md:flex-row md:items-center md:justify-end">
                  <span className="text-[10px] text-slate-400">
                    * O usuário será criado com perfil de <strong>Médico</strong>.
                  </span>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {isPending ? 'Criando cadastro...' : 'Cadastrar médico'}
                  </button>
                </div>
              </form>
            )}

            {error && (
              <div className="mb-4 rounded-[24px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {actionMessage && (
              <div className="mb-4 rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {actionMessage}
              </div>
            )}

            {doctors.length === 0 ? (
              <div className="rounded-[28px] bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
                Ainda não há médicos vinculados a este hospital.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[28px] border border-slate-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">E-mail</th>
                      <th className="px-4 py-3">Papel</th>
                      <th className="px-4 py-3">Desde</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {doctors.map((doctor) => (
                      <tr key={doctor.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {doctor.users?.full_name || 'Sem nome'}
                        </td>

                        <td className="px-4 py-3 text-slate-500">
                          {doctor.users?.email}
                        </td>

                        <td className="px-4 py-3">
                          <select
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#40C0A2]"
                            value={doctor.role}
                            onChange={(e) =>
                              handleChangeRole(doctor.id, e.target.value as DoctorRow['role'])
                            }
                            disabled={savingChangeId === doctor.id}
                          >
                            <option value="doctor">Médico</option>
                            <option value="coordenador">Coordenador</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </td>

                        <td className="px-4 py-3 text-xs font-semibold text-slate-400">
                          {new Date(doctor.created_at).toLocaleDateString('pt-BR')}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openLinkModal(doctor)}
                              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              disabled={!(myRole === 'admin' || myRole === 'coordenador')}
                              title={!(myRole === 'admin' || myRole === 'coordenador') ? 'Sem permissão' : 'Vincular em outro hospital'}
                            >
                              Vincular
                            </button>

                            <button
                              onClick={() => openEditModal(doctor)}
                              className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-black text-blue-700 hover:bg-blue-100"
                            >
                              Editar
                            </button>

                            <button
                              onClick={() => handleRemoveDoctor(doctor.id)}
                              disabled={removingId === doctor.id}
                              className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-[11px] font-black text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              {removingId === doctor.id ? '...' : 'Remover'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-[34px] border border-slate-100 bg-white p-5 text-xs text-slate-600 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#40C0A2]">
              Guia operacional
            </p>

            <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">
              Dica de gestão
            </h3>

            <ul className="mt-4 list-disc space-y-1.5 pl-4 text-[11px] leading-relaxed text-slate-600">
              <li>
                Ao cadastrar um médico, ele já poderá fazer login imediatamente com a senha provisória.
              </li>

              <li>
                Você pode promover um médico a <strong>Administrador</strong> mudando o papel dele na tabela acima.
              </li>

              <li>
                Use o botão <strong>Editar</strong> para corrigir nomes digitados incorretamente.
              </li>
            </ul>
          </section>

          {/* ========================= */}
          {/* IMPORTAR MÉDICOS (NO FINAL) — DESATIVADO TEMPORARIAMENTE */}
          {/* ========================= */}
          {false && (
            <section className="rounded-[34px] border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Importar usuários de outro hospital</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Isso copia <strong>todos</strong> os vínculos do hospital de origem para este hospital
                    (médicos, coordenadores e admins). Depois você remove quem não quiser.
                  </p>
                </div>

                <span className="rounded-full border bg-slate-50 px-2 py-1 text-[10px] text-slate-600">
                  Permissão: {myRole ?? '—'}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 items-end gap-3 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Hospital de origem
                  </label>
                  <select
                    value={importFromHospitalId}
                    onChange={(e) => {
                      setImportFromHospitalId(e.target.value);
                      setImportErr(null);
                      setImportMsg(null);
                    }}
                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                    disabled={!(myRole === 'admin' || myRole === 'coordenador') || importing}
                  >
                    <option value="">Selecione...</option>
                    {hospitals
                      .filter((h) => h.id !== hospitalId)
                      .map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name ?? h.id}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Dica: se você não achar o hospital aqui, confira se ele existe na tabela <code>hospitals</code>.
                  </p>
                </div>

                <button
                  onClick={handleImportAllFromHospital}
                  disabled={
                    importing ||
                    !(myRole === 'admin' || myRole === 'coordenador') ||
                    !importFromHospitalId
                  }
                  className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {importing ? 'Importando...' : 'Importar tudo'}
                </button>
              </div>

              {importErr && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {importErr}
                </div>
              )}
              {importMsg && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {importMsg}
                </div>
              )}

              {!(myRole === 'admin' || myRole === 'coordenador') && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Você não tem permissão para importar. Apenas <strong>Administrador</strong> ou <strong>Coordenador</strong>.
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}