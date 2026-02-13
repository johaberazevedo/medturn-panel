import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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

type Body = {
  hospitalId: string;
  hospitalName?: string;
  year: number;
  month: number;
  startDate: string; // yyyy-mm-dd
  endDate: string;   // yyyy-mm-dd (next month start)
};

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

    // 2) Gera PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

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

    function drawHeader(page: any) {
      const yTop = pageHeight - margin;

      page.drawText(title, {
        x: margin,
        y: yTop - 18,
        size: 14,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      page.drawText(subtitle, {
        x: margin,
        y: yTop - 38,
        size: 11,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });

      page.drawText(periodLine, {
        x: margin,
        y: yTop - 55,
        size: 9,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });

      page.drawText(generatedAt, {
        x: margin,
        y: yTop - 68,
        size: 9,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });

      // Cabeçalho da tabela
      const y = yTop - headerH;

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
    let yCursor = drawHeader(page);

    const bottomLimit = margin + 50;

function fmt1(n: number | null | undefined) {
  const v = Number(n ?? 0);
  return v.toFixed(1);
}

function fmtPair(total: number | null | undefined, chief: number | null | undefined) {
  return `${fmt1(total)} (${fmt1(chief)})`;
}

    for (const r of rows) {
      if (yCursor < bottomLimit) {
        page = addPage();
        yCursor = drawHeader(page);
      }

      page.drawText(cropText(r.medico ?? 'Sem nome', 34), {
        x: col.medico,
        y: yCursor,
        size: 9,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });

      const semanaTxt = fmtPair(r.semana_unidades, r.semana_chefe_unidades);
const fdsTxt = fmtPair(r.fds_unidades, r.fds_chefe_unidades);
const feriadoTxt = fmtPair(r.feriado_unidades, r.feriado_chefe_unidades);
const totalTxt = fmt1(r.total_unidades);

page.drawText(semanaTxt, {
  x: col.semana,
  y: yCursor,
  size: 9,
  font,
  color: rgb(0.2, 0.2, 0.2),
});

page.drawText(fdsTxt, {
  x: col.fds,
  y: yCursor,
  size: 9,
  font,
  color: rgb(0.2, 0.2, 0.2),
});

page.drawText(feriadoTxt, {
  x: col.feriado,
  y: yCursor,
  size: 9,
  font,
  color: rgb(0.2, 0.2, 0.2),
});

page.drawText(totalTxt, {
  x: col.total,
  y: yCursor,
  size: 9,
  font: fontBold,
  color: rgb(0, 0, 0),
});

      yCursor -= rowH;
    }

    // rodapé (última página)
    page.drawLine({
      start: { x: margin, y: margin + 40 },
      end: { x: pageWidth - margin, y: margin + 40 },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.9),
    });

    page.drawText(
      'Obs: chefia é contabilizada dentro de cada categoria (entre parênteses). Etiquetas (PED/UTI/ELET) não alteram cálculo por enquanto.',
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