'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
// Importamos a Server Action
import { registerUser } from '@/app/actions/register';

type Membership = {
  hospital_id: string;
  hospitals: {
    name: string | null;
  } | null;
};

type DoctorRow = {
  id: number;
  role: 'admin' | 'doctor' | 'coordenador';
  created_at: string;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
};

export default function MedicosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hospitalName, setHospitalName] = useState<string>('Seu hospital');
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Estados do Formulário de Cadastro
  const [showForm, setShowForm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [savingChangeId, setSavingChangeId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  async function reloadDoctors(hId: string) {
    const { data: doctorsData, error: doctorsError } = await supabase
      .from('hospital_users')
      .select('id, role, created_at, users(full_name, email)')
      .eq('hospital_id', hId)
      .order('role', { ascending: true });

    if (doctorsError) {
      setError('Não foi possível carregar a lista de médicos.');
    } else if (doctorsData) {
      // Correção de tipagem (Array -> Objeto)
      const formatted = doctorsData.map((d: any) => ({
        ...d,
        users: Array.isArray(d.users) ? d.users[0] : d.users
      }));
      setDoctors(formatted as DoctorRow[]);
    }
  }

  useEffect(() => {
    async function loadDoctors() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      setUserName(profile?.full_name ?? user.email ?? 'Usuário');

      const { data: membership, error: membershipError } = await supabase
        .from('hospital_users')
        .select('hospital_id, hospitals(name)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membershipError || !membership) {
        setError('Seu usuário não está vinculado a nenhum hospital.');
        setLoading(false);
        return;
      }

      // Correção de tipagem (Membership)
      const raw = membership as any;
      const hospData = raw.hospitals;
      const realName = Array.isArray(hospData) ? hospData[0]?.name : hospData?.name;

      setHospitalId(raw.hospital_id);
      setHospitalName(realName ?? 'Seu hospital');

      await reloadDoctors(raw.hospital_id);
      setLoading(false);
    }

    loadDoctors();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  // Nova função de submit usando Server Action
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
      // Recarrega a lista para mostrar o novo médico
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-600">Carregando médicos do hospital...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
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
            <span className="px-3 py-1 rounded-full bg-slate-900 text-white">
              Médicos
            </span>
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
                <h2 className="text-sm font-semibold text-slate-800">
                  Médicos do hospital
                </h2>
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

            {/* FORMULÁRIO BLINDADO */}
            {showForm && (
              <form onSubmit={onSubmit} className="mb-4 p-4 border rounded-lg bg-slate-50 space-y-3">
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
                    <label className="block text-xs font-medium mb-1 text-slate-600">Nome Completo</label>
                    <input 
                      name="fullName" 
                      required 
                      className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-200 outline-none" 
                      placeholder="Ex: Dr. João Silva" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">E-mail de Acesso</label>
                    <input 
                      name="email" 
                      type="email" 
                      required 
                      className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-slate-200 outline-none" 
                      placeholder="medico@hospital.com" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">Senha Provisória</label>
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
              <p className="text-sm text-slate-600">
                Ainda não há médicos vinculados a este hospital.
              </p>
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
                      <tr
                        key={doctor.id}
                        className="border-b last:border-0 hover:bg-slate-50"
                      >
                        <td className="py-2 pr-4">
                          {doctor.users?.full_name || 'Sem nome'}
                        </td>
                        <td className="py-2 pr-4 text-slate-600">
                          {doctor.users?.email}
                        </td>
                        <td className="py-2 pr-4">
                          <select
                            className="border rounded-lg px-2 py-1 text-xs"
                            value={doctor.role}
                            onChange={(e) =>
                              handleChangeRole(
                                doctor.id,
                                e.target.value as DoctorRow['role']
                              )
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
                          <button
                            onClick={() => handleRemoveDoctor(doctor.id)}
                            disabled={removingId === doctor.id}
                            className="text-[11px] px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {removingId === doctor.id ? '...' : 'Remover'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="bg-white rounded-xl shadow-sm p-4 text-xs text-slate-600">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">
              Dica de Gestão
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Ao cadastrar um médico, ele já poderá fazer login imediatamente com a senha provisória.
              </li>
              <li>
                Você pode promover um médico a <strong>Administrador</strong> mudando o papel dele na tabela acima.
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}