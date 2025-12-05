import { createClient } from '@supabase/supabase-js';

// ATENÇÃO: Este cliente tem permissão de ADMIN (Service Role).
// Só deve ser usado em Server Actions ou API Routes (Lado do Servidor).
// NUNCA importe isso em componentes com 'use client'.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltam as variáveis de ambiente do Supabase Admin (URL ou SERVICE_ROLE_KEY).');
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);