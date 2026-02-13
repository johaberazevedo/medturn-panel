import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type BrasilApiHoliday = {
  date: string; // yyyy-mm-dd
  name: string;
  type?: string; // "national" etc (varia)
};

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const { hospitalId, year } = await req.json();

    if (!hospitalId || typeof hospitalId !== 'string') {
      return NextResponse.json({ error: 'hospitalId inválido' }, { status: 400 });
    }
    const y = Number(year);
    if (!y || y < 2000 || y > 2100) {
      return NextResponse.json({ error: 'year inválido' }, { status: 400 });
    }

    // 🔐 Use SERVICE ROLE no server (NUNCA no client)
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      requireEnv('NEXT_PUBLIC_SUPABASE_URL');

    const serviceRole =
      process.env.SUPABASE_SERVICE_ROLE_KEY || requireEnv('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false },
    });

    // 1) Busca feriados nacionais (BrasilAPI)
    const apiUrl = `https://brasilapi.com.br/api/feriados/v1/${y}`;
    const resp = await fetch(apiUrl, { cache: 'no-store' });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return NextResponse.json(
        { error: `Falha ao buscar BrasilAPI (${resp.status})`, detail: text },
        { status: 502 }
      );
    }

    const holidays = (await resp.json()) as BrasilApiHoliday[];
    if (!Array.isArray(holidays)) {
      return NextResponse.json({ error: 'Resposta inválida da BrasilAPI' }, { status: 502 });
    }

    // 2) Monta rows para hospital_holidays
    // Tabela: id, hospital_id, holiday_date, name, scope, uf, city, is_active, created_at
    const rows = holidays
      .filter((h) => typeof h?.date === 'string' && typeof h?.name === 'string')
      .map((h) => ({
        hospital_id: hospitalId,
        holiday_date: h.date,
        name: h.name,
        scope: 'national' as const,
        uf: null,
        city: null,
        is_active: true,
      }));

    if (rows.length === 0) {
      return NextResponse.json({ inserted: 0, updated: 0, total: 0 });
    }

    // 3) Upsert (dedupe seguro)
    // ⚠️ Isso assume que você tem UNIQUE em (hospital_id, holiday_date, name, scope).
    // Se não tiver, eu te mando o SQL do índice unique já já.
        const { data, error } = await supabase
      .from('hospital_holidays')
      .upsert(rows, {
  onConflict: 'hospital_id,holiday_date,name',
  ignoreDuplicates: false,
})
      .select('id');

    if (error) {
      console.error('[import-national] upsert error:', error);
      return NextResponse.json(
        { error: 'Falha no upsert hospital_holidays', detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      inserted: data?.length ?? 0,
      updated: 0, // Supabase não diferencia aqui; ok pra agora
      total: rows.length,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Erro inesperado', detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}