import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import chromium from '@sparticuz/chromium';
import puppeteerCore from 'puppeteer-core';
import puppeteer from 'puppeteer'; // 👈 DEV (Mac)
export const runtime = 'nodejs';
import fs from 'fs';
import path from 'path';

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

type Body = {
  hospitalId: string;
  hospitalName?: string;
  year: number;
  month: number;     // 1..12
  startDate: string; // yyyy-mm-dd
  endDate: string;   // yyyy-mm-dd (next month start)
};

type ShiftRow = {
  id?: number;
  date: string;
  period: 'manha' | 'tarde' | 'noite' | '24h' | string;
  is_chief: boolean | null;
  badge: string | null;
  users: { full_name: string | null } | { full_name: string | null }[] | null;
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function monthLabelPT(year: number, month1to12: number) {
  const d = new Date(year, month1to12 - 1, 1);
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function escapeHtml(s: string) {
  return (s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


type PeriodKey = 'manha' | 'tarde' | 'noite' | '24h';

function isPeriodKey(p: any): p is PeriodKey {
  return p === 'manha' || p === 'tarde' || p === 'noite' || p === '24h';
}
// Sunday=0 ... Saturday=6
function getDaysMatrix(year: number, monthIndex0: number) {
  const first = new Date(year, monthIndex0, 1);
  const last = new Date(year, monthIndex0 + 1, 0);

  const matrix: (number | null)[][] = [];
  let week: (number | null)[] = [];

  const weekdayOfFirst = first.getDay(); // 0..6

  for (let i = 0; i < weekdayOfFirst; i++) week.push(null);

  for (let day = 1; day <= last.getDate(); day++) {
    week.push(day);
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
  }
  while (week.length < 7) week.push(null);
  matrix.push(week);

  return matrix;
}

const PERIODS: Array<{
  key: 'manha' | 'tarde' | 'noite' | '24h';
  label: string;
  short: string;
  maxDoctors: number;
  theme: 'manha' | 'tarde' | 'noite' | 'h24';
}> = [
  { key: 'manha', label: 'MANHÃ', short: 'M', maxDoctors: 6, theme: 'manha' },
  { key: 'tarde', label: 'TARDE', short: 'T', maxDoctors: 6, theme: 'tarde' },
  { key: 'noite', label: 'NOITE', short: 'N', maxDoctors: 3, theme: 'noite' },
  { key: '24h', label: '24H', short: '24H', maxDoctors: 6, theme: 'h24' },
];

function countClass(count: number, max: number) {
  if (count === 0) return 'badge red';
  if (count < max) return 'badge amber';
  return 'badge green';
}

function buildHtml(opts: {
  hospitalName: string;
  titleMonth: string;
  year: number;
  month1to12: number;
  shifts: ShiftRow[];
  logoBase64: string;
}) {
  const { hospitalName, titleMonth, year, month1to12, shifts, logoBase64 } = opts;
  const monthIndex0 = month1to12 - 1;

  // Index shifts by date
  const byDate = new Map<string, ShiftRow[]>();
  for (const s of shifts) {
    const arr = byDate.get(s.date) ?? [];
    arr.push(s);
    byDate.set(s.date, arr);
  }

  const matrix = getDaysMatrix(year, monthIndex0);

  const weekHeader = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
    .map((d) => `<div class="dow">${d}</div>`)
    .join('');

  const weeksHtml = matrix
    .map((week) => {
      const daysHtml = week
        .map((day) => {
          if (day === null) {
            return `<div class="cell empty"></div>`;
          }

          const iso = `${year}-${pad2(month1to12)}-${pad2(day)}`;
          const dayShifts = (byDate.get(iso) ?? []).map((s) => {
  const u = Array.isArray((s as any).users) ? (s as any).users[0] : (s as any).users;

  return {
    date: (s as any).date as string,
    period: (s as any).period as string,
    is_chief: !!(s as any).is_chief,
    badge: String((s as any).badge ?? '').trim(),
    name: (u as any)?.full_name ?? 'Sem nome',
  };
});

          // counts
          const counts: Record<'manha' | 'tarde' | 'noite' | '24h', number> = {
            manha: 0,
            tarde: 0,
            noite: 0,
            '24h': 0,
          };
          for (const s of dayShifts) {
  if (isPeriodKey(s.period)) {
    counts[s.period] += 1;
  }
}


          const groups = PERIODS.map((p) => {
            const list = dayShifts
              .filter((s) => s.period === p.key)
              .sort((a, b) => {
                // CH first
                if (a.is_chief && !b.is_chief) return -1;
                if (!a.is_chief && b.is_chief) return 1;
                // has badge next
                const aHas = !!a.badge;
                const bHas = !!b.badge;
                if (aHas && !bHas) return -1;
                if (!aHas && bHas) return 1;
                return 0;
              });

            if (list.length === 0) return '';

            const items = list
              .map((s) => {
                const chips: string[] = [];
                if (s.badge) chips.push(`<span class="chip blue">${escapeHtml(s.badge.slice(0, 4).toUpperCase())}</span>`);
                if (s.is_chief) chips.push(`<span class="chip ch">CH</span>`);
                return `
                  <div class="person">
                    <div class="person-name">${escapeHtml(s.name)}</div>
                    <div class="chips">${chips.join('')}</div>
                  </div>
                `;
              })
              .join('');

            return `
              <div class="group">
                <div class="group-head ${p.theme}">${p.label}</div>
                <div class="group-body">
                  ${items}
                </div>
              </div>
            `;
          }).join('');

          return `
            <div class="cell">
              <div class="day-top">
  <div class="day-num">${day}</div>
</div>
              <div class="day-groups">
                ${groups || `<div class="empty-day">—</div>`}
              </div>
            </div>
          `;
        })
        .join('');

      return `<div class="week">${daysHtml}</div>`;
    })
    .join('');

  const css = `
    @page { size: A4 landscape; margin: 6mm; }
* { box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  color: #0f172a;
}

.header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom: 6px;
}

.header .left{
  display:flex;
  align-items:center;
  gap:10px;
  min-width: 0;
}

.logo{
  height:28px;
  width:auto;
  border-radius: 6px;
}

.brand{
  display:flex;
  flex-direction:column;
  line-height:1;
}

.brand-name{
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .04em;
  color:#0f172a;
}

.brand-tag{
  font-size: 8px;
  color:#64748b;
  font-weight: 600;
  margin-top: 2px;
}

.header-text{
  display:flex;
  flex-direction:column;
  min-width: 0;
}

.title { font-size: 14px; font-weight: 800; }
.sub { font-size: 10px; color:#475569; margin-top: 1px; }
.meta { font-size: 9px; color:#64748b; text-align:right; }

.calendar { width:100%; }

/* ✅ estabilidade de layout do print */
html, body { height: auto; }

.dow-row {
  display:grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;
}

.dow {
  font-size: 9px;
  font-weight: 700;
  color:#475569;
  text-align:center;
}

.week {
  display:grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;

  /* ✅ nunca quebrar uma semana no meio */
  break-inside: avoid;
  page-break-inside: avoid;
}

/* ✅ evita o cabeçalho dos dias (Dom..Sab) ficar sozinho no fim da página */
.dow-row{
  break-after: avoid;
  page-break-after: avoid;
}

.cell {
  border:1px solid #e2e8f0;
  background:white;
  border-radius: 8px;
  padding: 4px;
  min-height: 86px;
  overflow: hidden;
}

.cell.empty { border: 0; background: transparent; }

.day-top {
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  margin-bottom: 3px;
}

.day-num { font-weight: 900; font-size: 11px; width: 16px; }

.day-groups { display:flex; flex-direction:column; gap: 3px; }

.group {
  border:1px solid #e2e8f0;
  border-radius: 6px;
  overflow:hidden;
  background:#fff;
}

.group-head {
  font-size: 8px;
  font-weight: 900;
  padding: 2px 4px;
  letter-spacing: .08em;
  text-transform: uppercase;
  border-bottom:1px solid #e2e8f0;
}

.group-head.manha { background:#ecfdf5; color:#065f46; }
.group-head.tarde { background:#eff6ff; color:#1e40af; }
.group-head.noite { background:#f5f3ff; color:#5b21b6; }
.group-head.h24 { background:#fff7ed; color:#9a3412; }

.group-body {
  padding: 3px 4px;
  display:flex;
  flex-direction:column;
  gap: 2px;
}

.person{
  display:flex;
  justify-content:space-between;
  gap: 4px;
  align-items:flex-start;
  min-width: 0;
}

.person-name{
  font-size: 9px;
  font-weight: 600;
  color:#0f172a;
  flex: 1;
  min-width: 0;
  line-height: 1.1;

  white-space: normal;         /* permite quebrar */
  overflow: hidden;            /* corta só se passar de 2 linhas */
  text-overflow: clip;         /* sem "..." */
  word-break: break-word;      /* quebra palavras longas */
  overflow-wrap: anywhere;     /* garante que não estoura */

  display: -webkit-box;        /* clamp */
  -webkit-line-clamp: 2;       /* ✅ no máx 2 linhas */
  -webkit-box-orient: vertical;
}

.chips { display:flex; gap: 3px; flex-shrink:0; }

.chip {
  font-size: 8px;
  font-weight: 900;
  padding: 1px 4px;
  border-radius: 4px;
  border:1px solid;
  line-height:1;
}

.chip.blue { background:#eff6ff; color:#1d4ed8; border-color:#bfdbfe; }
.chip.ch { background:#0f172a; color:white; border-color:#0f172a; }

.empty-day { font-size: 10px; color:#94a3b8; padding: 4px; }

    /* Evita cortar cards e grupos no meio ao quebrar página */
  `;

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${css}</style>
</head>
<body>
  <div class="header">
  <div class="left">
  <img src="data:image/png;base64,${logoBase64}" class="logo" />

  <div class="brand">
    <div class="brand-name">MedTurn</div>
    <div class="brand-tag">Gestão inteligente de plantões</div>
  </div>

  <div class="header-text">
    <div class="title">Escala mensal</div>
    <div class="sub">${escapeHtml(hospitalName)} • ${escapeHtml(titleMonth)}</div>
  </div>
</div>

  <div class="meta">Gerado em: ${escapeHtml(new Date().toLocaleString('pt-BR'))}</div>
</div>

  <div class="calendar">
    <div class="dow-row">${weekHeader}</div>
    ${weeksHtml}
  </div>
</body>
</html>
  `;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const hospitalId = body?.hospitalId;
    const year = Number(body?.year);
    const month = Number(body?.month);
    const startDate = body?.startDate;
    const endDate = body?.endDate;

    if (!hospitalId || typeof hospitalId !== 'string') {
      return NextResponse.json({ error: 'hospitalId inválido' }, { status: 400 });
    }
    if (!year || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'year inválido' }, { status: 400 });
    }
    if (!month || month < 1 || month > 12) {
      return NextResponse.json({ error: 'month inválido' }, { status: 400 });
    }
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate/endDate inválidos' }, { status: 400 });
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      requireEnv('NEXT_PUBLIC_SUPABASE_URL');

    const serviceRole =
      process.env.SUPABASE_SERVICE_ROLE_KEY || requireEnv('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false },
    });

    // Nome do hospital confiável no server
    let serverHospitalName = body?.hospitalName ?? 'Hospital';
    try {
      const { data: hosp } = await supabase
        .from('hospitals')
        .select('name')
        .eq('id', hospitalId)
        .maybeSingle();
      if (hosp?.name) serverHospitalName = hosp.name;
    } catch {}

    // Carrega shifts do mês
    const { data, error } = await supabase
      .from('shifts')
      .select('date, period, is_chief, badge, users(full_name)')
      .eq('hospital_id', hospitalId)
      .gte('date', startDate)
      .lt('date', endDate);

    if (error) {
      return NextResponse.json(
        { error: 'Falha ao carregar escala', detail: error.message },
        { status: 500 }
      );
    }

    const shifts = (data ?? []) as ShiftRow[];

// 🔹 Converte logo para base64
const logoPath = path.join(process.cwd(), 'public', 'medturn-logo.png');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');
    const html = buildHtml({
  hospitalName: serverHospitalName,
  titleMonth: monthLabelPT(year, month),
  year,
  month1to12: month,
  shifts,
  logoBase64,
});

    let browser;

if (process.env.NODE_ENV === 'production') {
  // 🔥 Vercel (Linux)
  const executablePath = await chromium.executablePath();

  browser = await puppeteerCore.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  });
} else {
  // 🔥 Mac / Local
  browser = await puppeteer.launch({
    headless: true,
  });
}

try {
  const page = await browser.newPage();
  // viewport ajuda consistência do layout
  await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1 });

  await page.setContent(html, { waitUntil: 'load' });

  // garante fontes/layout
  await page.evaluate(() => (document as any).fonts?.ready?.catch?.(() => null));

  const pdfBytes = await page.pdf({
  format: 'A4',
  landscape: true,
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: '6mm', right: '6mm', bottom: '6mm', left: '6mm' },
});

  const fileName = `medturn_escala_${year}-${pad2(month)}.pdf`;

  // ✅ NextResponse quer BodyInit — Buffer é aceito
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
} finally {
  await browser.close();
}
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Erro inesperado', detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}