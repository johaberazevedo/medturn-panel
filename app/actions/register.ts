'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';

export async function registerUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const hospitalId = formData.get('hospitalId') as string;

  // SEGURANÇA: Fixamos o papel. Ninguém consegue criar admin por este form.
  const role = 'doctor';

  if (!email || !password || !hospitalId || !fullName) {
    return { error: 'Preencha todos os campos obrigatórios.' };
  }

  try {
    // 1. Criar o Login (Auth)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Já cria confirmado, sem precisar clicar no email
      user_metadata: { full_name: fullName }
    });

    if (authError) throw authError;
    const newUserId = authData.user.id;

    // 2. Garantir Perfil Público (Upsert previne erro se uma trigger já tiver criado)
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .upsert({ 
        id: newUserId, 
        email: email, 
        full_name: fullName 
      });

    if (profileError) throw profileError;

    // 3. Vincular ao Hospital
    const { error: linkError } = await supabaseAdmin
      .from('hospital_users')
      .insert({
        hospital_id: hospitalId,
        user_id: newUserId,
        role: role
      });

    if (linkError) throw linkError;

    // Atualiza o cache para o novo médico aparecer na lista imediatamente
    revalidatePath('/medicos');
    
    return { success: true };

  } catch (error: any) {
    console.error('Erro no cadastro:', error);
    // Mensagem amigável para duplicidade
    if (error.message?.includes('already registered') || error.msg?.includes('already registered')) {
        return { error: 'Este e-mail já possui cadastro no sistema.' };
    }
    return { error: error.message || 'Erro ao criar usuário.' };
  }
}