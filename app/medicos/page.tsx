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

    try {
      const { error: updateError } = await supabase
        .from('hospital_users')
        .update({ role: newRole })
        .eq('id', doctorId);

      if (updateError) {
        setError('Não foi possível atualizar o papel do médico.');
        return;
      }

      await reloadDoctors(hospitalId);
      setActionMessage('Papel atualizado com sucesso.');
    } finally {
      setSavingChangeId(null);
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-600">Carregando médicos do hospital...</p>
      </div>
    );
  }

  return (
  <div className="min-h-screen flex flex-col bg-slate-100 relative">

    {/* MODAL: VINCULAR EM OUTRO HOSPITAL */}
    {linkingDoctor && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
          <h3 className="text-lg font-bold mb-2 text-slate-800">Vincular em outro hospital</h3>
          <p className="text-xs text-slate-500 mb-4">
            Médico:{' '}
            <span className="font-medium">
              {linkingDoctor.users?.full_name ?? 'Sem nome'}
            </span>
          </p>

          <label className="block text-xs font-medium text-slate-600 mb-1">
            Hospital destino
          </label>

          <select
            value={linkToHospitalId}
            onChange={(e) => setLinkToHospitalId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
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

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setLinkingDoctor(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              disabled={linkingToOther}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleLinkDoctorToOtherHospital}
              className="px-4 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-4 text-slate-800">Editar Médico</h3>

            <form onSubmit={handleUpdateDoctor} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nome Completo
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  E-mail
                </label>
                <input
  type="email"
  value={editEmail}
  disabled
  className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-500"
 />
                <p className="text-[10px] text-slate-400 mt-1">
                  * E-mail apenas para o registro visual. O login do usuário pode
                  permanecer o original, em caso de dificuldades, considere recriar o usuário.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  disabled={isUpdating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg disabled:opacity-50"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="w-full border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">MedTurn – Painel do Hospital</h1>
            <p className="text-xs text-slate-500">
              Logado como <span className="font-medium">{userName}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => router.push('/perfil')}
              className="text-xs px-3 py-1.5 border rounded-lg hover:bg-slate-50 transition bg-white text-slate-700"
            >
              Meu Perfil
            </button>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 border rounded-lg hover:bg-red-50 transition bg-white text-red-600 border-red-200"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Navegação principal */}
        <nav className="border-t bg-slate-50">
          <div className="max-w-5xl mx-auto px-4 flex gap-3 py-2 text-xs">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-3 py-1 rounded-full border text-slate-700 hover:bg-white transition"
            >
              Dashboard
            </button>
            <span className="px-3 py-1 rounded-full bg-slate-900 text-white">Médicos</span>
            <button
              onClick={() => router.push('/escala')}
              className="px-3 py-1 rounded-full border text-slate-700 hover:bg-white transition"
            >
              Escala mensal
            </button>
          </div>
        </nav>
      </header>

      {/* Conteúdo */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
          <section className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Médicos do hospital</h2>
                <p className="text-xs text-slate-500">
                  Hospital: <span className="font-medium">{hospitalName}</span>
                </p>
              </div>

              <button
                onClick={() => {
                  setShowForm((prev) => !prev);
                  setError(null);
                  setActionMessage(null);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:opacity-90 transition"
              >
                {showForm ? 'Cancelar' : 'Adicionar médico'}
              </button>
            </div>

            {/* FORMULÁRIO BLINDADO (NOVO USUÁRIO) */}
            {showForm && (
              <form
                onSubmit={onSubmit}
                className="mb-4 p-4 border rounded-lg bg-slate-50 space-y-3"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-sm">Cadastrar Novo Médico</h3>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-[10px] text-slate-500 hover:text-slate-800"
                  >
                    Fechar
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      Nome Completo
                    </label>
                    <input
                      name="fullName"
                      required
                      className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-200 outline-none"
                      placeholder="Ex: Dr. João Silva"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      E-mail de Acesso
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-200 outline-none"
                      placeholder="medico@hospital.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      Senha Provisória
                    </label>
                    <input
                      name="password"
                      type="text"
                      required
                      className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-200 outline-none"
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2 items-center gap-3">
                  <span className="text-[10px] text-slate-400">
                    * O usuário será criado com perfil de <strong>Médico</strong>.
                  </span>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-slate-900 text-white text-xs px-4 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 font-medium transition-colors"
                  >
                    {isPending ? 'Criando cadastro...' : 'Cadastrar Médico'}
                  </button>
                </div>
              </form>
            )}

            {error && (
              <p className="text-xs text-red-600 mb-2 border border-red-100 bg-red-50 p-2 rounded">
                {error}
              </p>
            )}

            {actionMessage && (
              <p className="text-xs text-emerald-700 mb-2 border border-emerald-100 bg-emerald-50 p-2 rounded">
                {actionMessage}
              </p>
            )}

            {doctors.length === 0 ? (
              <p className="text-sm text-slate-600">Ainda não há médicos vinculados a este hospital.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-bottom">
                      <th className="py-2 pr-4">Nome</th>
                      <th className="py-2 pr-4">E-mail</th>
                      <th className="py-2 pr-4">Papel</th>
                      <th className="py-2 pr-4">Desde</th>
                      <th className="py-2 pr-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doctor) => (
                      <tr key={doctor.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="py-2 pr-4">{doctor.users?.full_name || 'Sem nome'}</td>
                        <td className="py-2 pr-4 text-slate-600">{doctor.users?.email}</td>
                        <td className="py-2 pr-4">
                          <select
                            className="border rounded-lg px-2 py-1 text-xs"
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
                        <td className="py-2 pr-4 text-xs text-slate-500">
                          {new Date(doctor.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-2 pr-4 text-right">
  <div className="flex justify-end gap-2">
    <button
      onClick={() => openLinkModal(doctor)}
      className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      disabled={!(myRole === 'admin' || myRole === 'coordenador')}
      title={!(myRole === 'admin' || myRole === 'coordenador') ? 'Sem permissão' : 'Vincular em outro hospital'}
    >
      Vincular
    </button>

    <button
      onClick={() => openEditModal(doctor)}
      className="text-[11px] px-2 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50"
    >
      Editar
    </button>

    <button
      onClick={() => handleRemoveDoctor(doctor.id)}
      disabled={removingId === doctor.id}
      className="text-[11px] px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
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

          <section className="bg-white rounded-xl shadow-sm p-4 text-xs text-slate-600">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Dica de Gestão</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Ao cadastrar um médico, ele já poderá fazer login imediatamente com a senha provisória.</li>
              <li>Você pode promover um médico a <strong>Administrador</strong> mudando o papel dele na tabela acima.</li>
              <li>Use o botão <strong>Editar</strong> para corrigir nomes digitados incorretamente.</li>
            </ul>
          </section>

          {/* ========================= */}
{/* IMPORTAR MÉDICOS (NO FINAL) — DESATIVADO TEMPORARIAMENTE */}
{/* ========================= */}
{false && (
  <section className="bg-white rounded-xl shadow-sm p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">Importar usuários de outro hospital</h3>
        <p className="text-xs text-slate-500 mt-1">
          Isso copia <strong>todos</strong> os vínculos do hospital de origem para este hospital
          (médicos, coordenadores e admins). Depois você remove quem não quiser.
        </p>
      </div>

      <span className="text-[10px] px-2 py-1 rounded-full border bg-slate-50 text-slate-600">
        Permissão: {myRole ?? '—'}
      </span>
    </div>

    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Hospital de origem
        </label>
        <select
          value={importFromHospitalId}
          onChange={(e) => {
            setImportFromHospitalId(e.target.value);
            setImportErr(null);
            setImportMsg(null);
          }}
          className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
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
        <p className="text-[10px] text-slate-400 mt-1">
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
        className="text-xs px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {importing ? 'Importando...' : 'Importar tudo'}
      </button>
    </div>

    {importErr && (
      <div className="mt-3 bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg text-xs">
        {importErr}
      </div>
    )}
    {importMsg && (
      <div className="mt-3 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-lg text-xs">
        {importMsg}
      </div>
    )}

    {!(myRole === 'admin' || myRole === 'coordenador') && (
      <div className="mt-3 bg-slate-50 text-slate-600 border border-slate-200 px-3 py-2 rounded-lg text-xs">
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