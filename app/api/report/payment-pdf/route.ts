import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const runtime = 'nodejs';

import fs from 'fs';
import path from 'path';

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

type ReportRow = {
  medico: string;

  semana: string;
  fds: string;
  feriado: string;
  total: string;

  semana_unidades: number;
  semana_chefe_unidades: number;
  fds_unidades: number;
  fds_chefe_unidades: number;
  feriado_unidades: number;
  feriado_chefe_unidades: number;
  total_unidades: number;
};

type RequestBody = {
  hospitalId: string;
  hospitalName?: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
};

type PeriodKey = 'manha' | 'tarde' | 'noite';

type ShiftDetailRow = {
  id: number;
  date: string;
  period: PeriodKey;
  doctor_user_id: string;
  users: { full_name: string | null } | null;
};

type ShiftDetailByPeriod = Record<PeriodKey, string[]>;

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function monthLabel(m: number) {
  const labels = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ];
  return labels[m - 1] ?? `Mês ${m}`;
}

function isAllowedPeriod(period: string | null | undefined): period is PeriodKey {
  return period === 'manha' || period === 'tarde' || period === 'noite';
}

function periodDetailLabel(period: PeriodKey) {
  switch (period) {
    case 'manha':
      return 'Manhã';
    case 'tarde':
      return 'Tarde';
    case 'noite':
      return 'Noite';
  }
}

function dayOnly(dateStr: string) {
  return dateStr.slice(8, 10);
}

function emptyShiftDetail(): ShiftDetailByPeriod {
  return {
    manha: [],
    tarde: [],
    noite: [],
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;

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

    // (opcional) buscar nome do hospital no server pra ficar confiável
    let serverHospitalName = body?.hospitalName ?? 'Hospital';
    try {
      const { data: hosp } = await supabase
        .from('hospitals')
        .select('name')
        .eq('id', hospitalId)
        .maybeSingle();
      if (hosp?.name) serverHospitalName = hosp.name;
    } catch {}

    // 1) Busca dados do relatório (RPC)
    const { data, error } = await supabase.rpc('payment_report_month', {
      p_hospital_id: hospitalId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Falha ao carregar relatório (RPC)', detail: error.message },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as ReportRow[];

const { data: shiftData, error: shiftError } = await supabase
  .from('shifts')
  .select('id, date, period, doctor_user_id, users(full_name)')
  .eq('hospital_id', hospitalId)
  .gte('date', startDate)
  .lt('date', endDate)
  .in('period', ['manha', 'tarde', 'noite'])
  .not('doctor_user_id', 'is', null)
  .order('date', { ascending: true });

if (shiftError) {
  return NextResponse.json(
    { error: 'Falha ao carregar detalhamento dos plantões', detail: shiftError.message },
    { status: 500 }
  );
}

const detailsByDoctor = new Map<string, ShiftDetailByPeriod>();

for (const rawShift of (shiftData ?? []) as any[]) {
  const shift = {
    ...rawShift,
    users: Array.isArray(rawShift.users) ? rawShift.users[0] : rawShift.users,
  } as ShiftDetailRow;

  if (!isAllowedPeriod(shift.period)) continue;

  const doctorName = shift.users?.full_name ?? 'Sem nome';

  if (!detailsByDoctor.has(doctorName)) {
    detailsByDoctor.set(doctorName, emptyShiftDetail());
  }

  detailsByDoctor.get(doctorName)![shift.period].push(dayOnly(shift.date));
}

for (const detail of detailsByDoctor.values()) {
  detail.manha.sort();
  detail.tarde.sort();
  detail.noite.sort();
}

    // 2) Gera PDF
    const pdfDoc = await PDFDocument.create();
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

// ✅ Logo MedTurn (PNG em /public)
const logoPath = path.join(process.cwd(), 'public', 'medturn-logo-rounded.png');
const logoBytes = fs.readFileSync(logoPath);
const logoImg = await pdfDoc.embedPng(logoBytes);

// tamanho “fixo” (estilo do calendário)
const LOGO_H = 28; // points
const logoScale = LOGO_H / logoImg.height;
const LOGO_W = logoImg.width * logoScale;

    // ✅ A4 em paisagem (landscape)
const pageWidth = 841.89;  // A4 points (landscape width)
const pageHeight = 595.28; // A4 points (landscape height)
    const margin = 40;

    const headerH = 90;
    const rowH = 16;
    const tableTopGap = 20;

    const col = {
  medico: margin,
  semana: margin + 300,
  fds: margin + 455,
  feriado: margin + 575,
  total: margin + 720,
};

    const title = `Relatório de Pagamento — ${monthLabel(month)} ${year}`;
    const subtitle = serverHospitalName;
    const periodLine = `Periodo: ${startDate} - ${endDate}`;
    const generatedAt = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;

    function addPage() {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      return page;
    }

    function drawHeader(page: any, includeTableHeader = true) {
  const yTop = pageHeight - margin;

  // ✅ Brand: Logo + MedTurn
  const brandX = margin;
  const brandY = yTop - LOGO_H; // topo alinhado

  page.drawImage(logoImg, {
    x: brandX,
    y: brandY,
    width: LOGO_W,
    height: LOGO_H,
  });

  const brandTextX = brandX + LOGO_W + 10;
  page.drawText('MedTurn', {
    x: brandTextX,
    y: brandY + 10,  // alinhado visualmente
    size: 12,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16), // parecido com o #0f172a
  });

  page.drawText('Gestão inteligente de plantões', {
    x: brandTextX,
    y: brandY + 2,
    size: 8,
    font,
    color: rgb(0.39, 0.45, 0.55), // parecido com #64748b
  });

  // 🔹 Conteúdo do header começa mais abaixo
  const headerStartY = yTop - 18 - 10; // pequeno ajuste

  page.drawText(title, {
    x: margin,
    y: headerStartY - 18,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

      page.drawText(subtitle, {
  x: margin,
  y: headerStartY - 38,
  size: 11,
  font,
  color: rgb(0.15, 0.15, 0.15),
});

page.drawText(periodLine, {
  x: margin,
  y: headerStartY - 55,
  size: 9,
  font,
  color: rgb(0.35, 0.35, 0.35),
});

page.drawText(generatedAt, {
  x: margin,
  y: headerStartY - 68,
  size: 9,
  font,
  color: rgb(0.35, 0.35, 0.35),
});

      if (!includeTableHeader) {
        return headerStartY - 92;
      }

      // Cabeçalho da tabela
      const y = headerStartY - headerH;

      page.drawText('Médico', { x: col.medico, y, size: 9, font: fontBold });
      page.drawText('Semana (Total/Chefe)', { x: col.semana, y, size: 9, font: fontBold });
page.drawText('FDS (Total/chefe)', { x: col.fds, y, size: 9, font: fontBold });
page.drawText('Feriado (Total/Chefe)', { x: col.feriado, y, size: 9, font: fontBold });
      page.drawText('Total', { x: col.total, y, size: 9, font: fontBold });

      // linha
      page.drawLine({
        start: { x: margin, y: y - 6 },
        end: { x: pageWidth - margin, y: y - 6 },
        thickness: 1,
        color: rgb(0.85, 0.85, 0.85),
      });

      return y - tableTopGap;
    }

    function cropText(s: string, maxChars: number) {
      if (!s) return '';
      if (s.length <= maxChars) return s;
      return s.slice(0, maxChars - 1) + '…';
    }

    let page = addPage();
let yCursor = drawHeader(page, false);

const bottomLimit = margin + 50;

function fmt1(n: number | null | undefined) {
  const v = Number(n ?? 0);
  return v.toFixed(1);
}

function fmtPairWithChiefLabel(
  total: number | null | undefined,
  chief: number | null | undefined
) {
  return `${fmt1(total)} (${fmt1(chief)} CH)`;
}


    // 3) Detalhamento dos plantões por médico
    if (detailsByDoctor.size > 0) {

      page.drawText('Detalhamento dos plantões', {
        x: margin,
        y: yCursor,
        size: 12,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      yCursor -= 22;

      const detailPeriods: PeriodKey[] = ['manha', 'tarde', 'noite'];
const reportByDoctor = new Map(
  rows.map((r) => [r.medico ?? 'Sem nome', r])
);

const rowDoctorNames = rows.map((r) => r.medico ?? 'Sem nome');
const extraDoctorNames = Array.from(detailsByDoctor.keys()).filter(
  (name) => !rowDoctorNames.includes(name)
);

      const orderedDoctorNames = [...rowDoctorNames, ...extraDoctorNames].filter(
        (name, index, arr) => arr.indexOf(name) === index
      );

      for (const doctorName of orderedDoctorNames) {
        const detail = detailsByDoctor.get(doctorName);
        if (!detail) continue;

        const hasAnyShift = detailPeriods.some((period) => detail[period].length > 0);
        if (!hasAnyShift) continue;

        if (yCursor < bottomLimit + 76) {
          page = addPage();
          yCursor = drawHeader(page, false);
        }

        page.drawText(cropText(`${doctorName} - ${serverHospitalName}`, 90), {
  x: margin,
  y: yCursor,
  size: 9,
  font: fontBold,
  color: rgb(0.06, 0.09, 0.16),
});

yCursor -= 13;

const summary = reportByDoctor.get(doctorName);

if (summary) {
const summaryLine =
  `Semana: ${fmtPairWithChiefLabel(summary.semana_unidades, summary.semana_chefe_unidades)} • ` +
  `FDS: ${fmtPairWithChiefLabel(summary.fds_unidades, summary.fds_chefe_unidades)} • ` +
  `Feriado: ${fmtPairWithChiefLabel(summary.feriado_unidades, summary.feriado_chefe_unidades)} • ` +
  `Total: ${fmt1(summary.total_unidades)}`;

  page.drawText(cropText(summaryLine, 125), {
    x: margin + 12,
    y: yCursor,
    size: 8,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  yCursor -= 12;
}

page.drawText('Detalhamento:', {
          x: margin + 12,
          y: yCursor,
          size: 8,
          font: fontBold,
          color: rgb(0.25, 0.25, 0.25),
        });

        yCursor -= 11;

        for (const period of detailPeriods) {
          const days = detail[period];
          if (days.length === 0) continue;

          const line = `${periodDetailLabel(period)}: ${days.join(', ')}`;

          page.drawText(cropText(line, 120), {
            x: margin + 12,
            y: yCursor,
            size: 8,
            font,
            color: rgb(0.25, 0.25, 0.25),
          });

          yCursor -= 11;
        }

        yCursor -= 8;
      }
    }

    // rodapé (última página)
    page.drawLine({
      start: { x: margin, y: margin + 40 },
      end: { x: pageWidth - margin, y: margin + 40 },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText(
      'Obs: chefia é contabilizada dentro de cada categoria (entre parênteses). Etiquetas (PED/UTI/ELET) não alteram cálculo, sendo somente informativas.',
      { x: margin, y: margin + 24, size: 8, font, color: rgb(0.35, 0.35, 0.35) }
    );

    const pdfBytes = await pdfDoc.save();

    const fileName = `medturn_relatorio_${year}-${pad2(month)}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Erro inesperado', detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}