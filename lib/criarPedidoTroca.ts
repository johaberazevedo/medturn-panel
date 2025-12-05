import { supabase } from '@/lib/supabaseClient';

type CriarPedidoTrocaParams = {
  hospitalId: string;
  fromShiftId: number;
  targetUserId?: string | null;
  reason?: string | null;
};

export async function criarPedidoTroca({
  hospitalId,
  fromShiftId,
  targetUserId,
  reason,
}: CriarPedidoTrocaParams) {
  // pega o médico logado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Usuário não autenticado');
  }

  const { error } = await supabase.from('shift_swap_requests').insert({
    hospital_id: hospitalId,
    requester_user_id: user.id,
    from_shift_id: fromShiftId,
    target_user_id: targetUserId ?? null,
    reason: reason ?? null,
    // status, created_at, updated_at são automáticos
  });

  if (error) {
    throw new Error(`Erro ao criar pedido de troca: ${error.message}`);
  }
}
