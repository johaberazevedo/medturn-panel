'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

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

  const [showForm, setShowForm] = useState(false);
  const [newDoctorEmail, setNewDoctorEmail] = useState('');
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorRole, setNewDoctorRole] = useState<'admin' | 'doctor' | 'coordenador'>('doctor');
  const [savingDoctor, setSavingDoctor] = useState(false);
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
      setDoctors(doctorsData as DoctorRow[]);
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

      const typedMembership = membership as Membership;
      setHospitalId(typedMembership.hospital_id);
      setHospitalName(typedMembership.hospitals?.name ?? 'Seu hospital');

      await reloadDoctors(typedMembership.hospital_id);
      setLoading(false);
    }

    loadDoctors();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  async function handleAddDoctor(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setActionMessage(null);

    if (!hospitalId) {
      setError('Hospital não identificado. Recarregue a página.');
      return;
    }

    if (!newDoctorEmail.trim()) {
      setError('Informe o e-mail do médico.');
      return;
    }

    setSavingDoctor(true);

    try {
      const { data: userRow, error: userLookupError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('email', newDoctorEmail.trim())
        .maybeSingle();

      if (userLookupError) {
        setError('Erro ao buscar usuário. Tente novamente.');
        setSavingDoctor(false);
        return;
      }

      if (!userRow) {
        setError('Usuário não encontrado. Crie o médico em Authentication → Users antes de vinculá-lo.');
        setSavingDoctor(false);
        return;
      }

      const userId = (userRow as any).id as string;

      if (newDoctorName.trim().length > 0) {
        await supabase
          .from('users')
          .update({ full_name: newDoctorName.trim() })
          .eq('id', userId);
      }

      const { error: insertError } = await supabase.from('hospital_users').insert({
        hospital_id: hospitalId,
        user_id: userId,
        role: newDoctorRole,
      });

      if (insertError) {
        if (insertError.message?.includes('duplicate key value')) {
          setError('Esse médico já está vinculado a este hospital.');
        } else {
          setError('Não foi possível vincular o médico. Verifique as permissões / RLS.');
        }
        setSavingDoctor(false);
        return;
      }

      await reloadDoctors(hospitalId);

      setActionMessage('Médico vinculado com sucesso.');
      setNewDoctorEmail('');
      setNewDoctorName('');
      setNewDoctorRole('doctor');
      setShowForm(false);
    } finally {
      setSavingDoctor(false);
    }
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
      'Remover este médico do hospital? Ele poderá ser vinculado novamente no futuro.'
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

          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 border rounded-lg hover:bg-slate-50 transition"
          >
            Sair
          </button>
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

            {showForm && (
              <form
                onSubmit={handleAddDoctor}
                className="mb-4 p-3 border rounded-lg bg-slate-50 space-y-3 text-xs"
              >
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="md:col-span-1">
                    <label className="block mb-1 font-medium">E-mail do médico</label>
                    <input
                      type="email"
                      className="w-full border rounded-lg px-2 py-1.5 text-xs"
                      value={newDoctorEmail}
                      onChange={(e) => setNewDoctorEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block mb-1 font-medium">Nome (opcional)</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-2 py-1.5 text-xs"
                      value={newDoctorName}
                      onChange={(e) => setNewDoctorName(e.target.value)}
                      placeholder="Como aparecerá na escala"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block mb-1 font-medium">Papel</label>
                    <select
                      className="w-full border rounded-lg px-2 py-1.5 text-xs"
                      value={newDoctorRole}
                      onChange={(e) =>
                        setNewDoctorRole(e.target.value as 'admin' | 'doctor' | 'coordenador')
                      }
                    >
                      <option value="doctor">Médico</option>
                      <option value="coordenador">Coordenador</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="submit"
                    disabled={savingDoctor}
                    className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white disabled:opacity-60"
                  >
                    {savingDoctor ? 'Salvando...' : 'Vincular médico'}
                  </button>
                  <p className="text-[11px] text-slate-500">
                    Antes, crie o médico em <span className="font-mono">Authentication → Users</span>.
                  </p>
                </div>
              </form>
            )}

            {error && (
              <p className="text-xs text-red-600 mb-2">
                {error}
              </p>
            )}

            {actionMessage && (
              <p className="text-xs text-emerald-700 mb-2">
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
                            {removingId === doctor.id ? 'Removendo...' : 'Remover'}
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
              Como este cadastro se conecta ao app
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>O médico é criado primeiro em <strong>Authentication → Users</strong> no Supabase.</li>
              <li>
                Aqui no painel, você vincula esse usuário ao hospital e define o papel
                (admin / coordenador / médico).
              </li>
              <li>Depois, no app iOS MedTurn, o médico entra com o e-mail e a senha cadastrados.</li>
              <li>A escala mensal e os plantões serão filtrados por este vínculo.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
