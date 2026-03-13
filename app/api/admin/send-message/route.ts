import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type Body = {
  hospitalId?: string;
  title?: string;
  message?: string;
  mode?: 'all' | 'single';
  targetUserId?: string;
};

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado.' },
        { status: 401 }
      );
    }

    // ✅ Valida o usuário logado pelo token do Supabase
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Sessão inválida.' },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Body;

    const hospitalId = body.hospitalId?.trim();
    const title = body.title?.trim();
    const message = body.message?.trim();
    const mode = body.mode ?? 'all';
    const targetUserId = body.targetUserId?.trim();

    if (!hospitalId || !title || !message) {
      return NextResponse.json(
        { error: 'Preencha hospital, título e mensagem.' },
        { status: 400 }
      );
    }

    // ✅ Verifica se o remetente é admin daquele hospital
    const { data: membership, error: memErr } = await supabaseAdmin
      .from('hospital_users')
      .select('role, is_admin')
      .eq('user_id', user.id)
      .eq('hospital_id', hospitalId)
      .maybeSingle();

    if (memErr) {
      console.error('Erro ao verificar permissão:', memErr);
      return NextResponse.json(
        { error: 'Erro ao verificar permissão do remetente.' },
        { status: 500 }
      );
    }

    const isAllowed =
      membership?.is_admin === true ||
      membership?.role === 'admin' ||
      membership?.role === 'coordenador';

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Sem permissão para enviar avisos neste hospital.' },
        { status: 403 }
      );
    }

    let userIds: string[] = [];

    if (mode === 'single') {
      if (!targetUserId) {
        return NextResponse.json(
          { error: 'Selecione um médico.' },
          { status: 400 }
        );
      }

      // ✅ Valida se o alvo pertence ao hospital e é médico
      const { data: targetMem, error: targetMemError } = await supabaseAdmin
  .from('hospital_users')
  .select('user_id, role')
  .eq('hospital_id', hospitalId)
  .eq('user_id', targetUserId)
  .maybeSingle();

if (targetMemError) {
  console.error('Erro ao validar destinatário alvo:', targetMemError);
  return NextResponse.json(
    { error: 'Erro ao validar usuário selecionado.' },
    { status: 500 }
  );
}

if (!targetMem || !['doctor', 'admin'].includes(targetMem.role)) {
  return NextResponse.json(
    { error: 'Usuário alvo inválido para este hospital.' },
    { status: 400 }
  );
}

userIds = [targetUserId];
    } else {
      // ✅ Busca todos os médicos do hospital
            const { data: recipients, error: recipientsError } = await supabaseAdmin
        .from('hospital_users')
        .select('user_id, role')
        .eq('hospital_id', hospitalId)
        .in('role', ['doctor', 'admin']);

      if (recipientsError) {
        console.error('Erro ao buscar destinatários:', recipientsError);
        return NextResponse.json(
          { error: 'Erro ao buscar usuários do hospital.' },
          { status: 500 }
        );
      }

      userIds = [
        ...new Set((recipients ?? []).map((d) => d.user_id).filter(Boolean)),
      ];
    }

    if (userIds.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum destinatário encontrado.' },
        { status: 400 }
      );
    }

    const rows = userIds.map((uid) => ({
      user_id: uid,
      title,
      body: message,
      type: 'admin_message',
      is_read: false,
      related_id: null,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(rows);

    if (insertError) {
      console.error('Erro ao inserir notificações:', insertError);
      return NextResponse.json(
        { error: 'Erro ao enviar notificações.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sent: rows.length,
    });
  } catch (error: any) {
    console.error('Erro ao enviar aviso:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno.' },
      { status: 500 }
    );
  }
}