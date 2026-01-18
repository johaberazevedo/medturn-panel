'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';

export async function registerUser(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const fullName = (formData.get('fullName') as string)?.trim();
  const hospitalId = formData.get('hospitalId') as string;

  // SEGURANÇA: Fixamos o papel. Ninguém consegue criar admin por este form.
  const role = 'doctor';

  if (!email || !password || !hospitalId || !fullName) {
    return { error: 'Preencha todos os campos obrigatórios.' };
  }

  try {
    // 1) Criar o Login (Auth)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    // Se já existe, cai no fluxo de "vincular existente"
    if (authError) {
      const msg = (authError as any)?.message ?? '';
      if (msg.includes('already been registered') || msg.includes('already registered')) {
        // 1a) Buscar user_id pelo email na tabela pública users
        const { data: existingProfile, error: findError } = await supabaseAdmin
          .from('users')
          .select('id, email')
          .eq('email', email)
          .maybeSingle();

        if (findError) throw findError;

        if (!existingProfile?.id) {
          return {
            error:
              'Este e-mail já existe no sistema, mas não encontrei o perfil público correspondente. Verifique as triggers/tabela users.',
          };
        }

        const existingUserId = existingProfile.id;

        // 1b) Garantir perfil público (sem quebrar nada)
        const { error: profileError } = await supabaseAdmin
          .from('users')
          .upsert({
            id: existingUserId,
            email,
            full_name: fullName,
          });

        if (profileError) throw profileError;

        // 1c) Vincular ao hospital (idempotente)
        const { error: linkError } = await supabaseAdmin
          .from('hospital_users')
          .upsert(
            {
              hospital_id: hospitalId,
              user_id: existingUserId,
              role: role,
            },
            { onConflict: 'hospital_id,user_id' }
          );

        if (linkError) throw linkError;

        revalidatePath('/medicos');

        return { success: true, message: 'Usuário já existia e foi vinculado ao hospital.' };
      }

      // Se for outro erro de Auth, sobe
      throw authError;
    }

    const newUserId = authData.user.id;

    // 2) Garantir Perfil Público (Upsert previne erro se uma trigger já tiver criado)
    const { error: profileError } = await supabaseAdmin.from('users').upsert({
      id: newUserId,
      email: email,
      full_name: fullName,
    });

    if (profileError) throw profileError;

    // 3) Vincular ao Hospital (idempotente)
    const { error: linkError } = await supabaseAdmin
      .from('hospital_users')
      .upsert(
        {
          hospital_id: hospitalId,
          user_id: newUserId,
          role: role,
        },
        { onConflict: 'hospital_id,user_id' }
      );

    if (linkError) throw linkError;

    revalidatePath('/medicos');

    return { success: true };
  } catch (error: any) {
    console.error('Erro no cadastro:', error);
    return { error: error.message || 'Erro ao criar/vincular usuário.' };
  }
}