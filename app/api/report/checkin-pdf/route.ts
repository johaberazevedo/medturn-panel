import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

type RequestBody = {
  hospitalId?: string;
  year?: number;
  month?: number;
};

type PeriodKey = 'manha' | 'tarde' | 'noite';

type ShiftRow = {
  id: number;
  date: string;
  period: PeriodKey;
  doctor_user_id: string;
  is_chief: boolean;
  badge: string | null;
  users: { full_name: string | null } | null;
};

type CheckinRow = {
  shift_id: number;
  created_at: string;
  method: string | null;
  source: string | null;
  is_propagated: boolean | null;
};

type ReportRow = ShiftRow & {
  checkin: CheckinRow | null;
};

const PERIOD_ORDER: Record<PeriodKey, number> = {
  manha: 0,
  tarde: 1,
  noite: 2,
};

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function monthLabel(month: number) {
  const labels = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return labels[month - 1] ?? `Mês ${month}`;
}

function periodLabel(period: PeriodKey) {
  switch (period) {
    case 'manha': return 'Manhã';
    case 'tarde': return 'Tarde';
    case 'noite': return 'Noite';
  }
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function formatGeneratedDate(date: string) {
  return new Date(date).toLocaleString('pt-BR', {
    timeZone: 'America/Bahia',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function confirmationLabel(checkin: CheckinRow | null) {
  if (!checkin) return '-';
  if (checkin.is_propagated === true) return 'Check-in pelo aplicativo (continuidade)';

  switch (checkin.method?.toLowerCase()) {
    case 'manual':
      return 'Confirmado pela coordenação';
    case 'button':
      return 'Check-in pelo aplicativo';
    case 'gps':
      return 'Check-in pelo aplicativo com localização';
    default:
      return 'Forma de confirmação não identificada';
  }
}

function cropText(text: string, font: PDFFont, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;

  let cropped = text;
  while (cropped.length > 1 && font.widthOfTextAtSize(`${cropped}...`, size) > maxWidth) {
    cropped = cropped.slice(0, -1);
  }
  return `${cropped}...`;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;

    if (!token) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });
    }

    const body = (await req.json()) as RequestBody;
    const hospitalId = body.hospitalId?.trim();
    const year = Number(body.year);
    const month = Number(body.month);

    if (!hospitalId) {
      return NextResponse.json({ error: 'Hospital inválido.' }, { status: 400 });
    }
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Ano inválido.' }, { status: 400 });
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Mês inválido.' }, { status: 400 });
    }

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('hospital_users')
      .select('role, is_admin')
      .eq('user_id', user.id)
      .eq('hospital_id', hospitalId)
      .maybeSingle();

    if (membershipError) {
      console.error('Erro ao verificar permissão do relatório de check-ins:', membershipError);
      return NextResponse.json({ error: 'Não foi possível verificar sua permissão.' }, { status: 500 });
    }

    const isAdmin = membership?.is_admin === true || membership?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Sem permissão para este relatório.' }, { status: 403 });
    }

    const startDate = `${year}-${pad2(month)}-01`;
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const endDate = `${nextYear}-${pad2(nextMonth)}-01`;

    const { data: hospital, error: hospitalError } = await supabaseAdmin
      .from('hospitals')
      .select('name')
      .eq('id', hospitalId)
      .maybeSingle();

    if (hospitalError || !hospital) {
      return NextResponse.json({ error: 'Hospital não encontrado.' }, { status: 404 });
    }
    const hospitalName = hospital.name ?? 'Hospital';

    const { data: shiftData, error: shiftError } = await supabaseAdmin
      .from('shifts')
      .select('id, date, period, doctor_user_id, is_chief, badge, users(full_name)')
      .eq('hospital_id', hospitalId)
      .gte('date', startDate)
      .lt('date', endDate)
      .in('period', ['manha', 'tarde', 'noite'])
      .not('doctor_user_id', 'is', null)
      .order('date', { ascending: true });

    if (shiftError) {
      return NextResponse.json(
        { error: 'Falha ao carregar os plantões.', detail: shiftError.message },
        { status: 500 }
      );
    }

    const shifts = (shiftData ?? [])
      .map((raw) => ({
        ...raw,
        users: Array.isArray(raw.users) ? raw.users[0] : raw.users,
      }))
      .filter((shift) => (shift.badge ?? '').trim().slice(0, 4).toUpperCase() !== 'FERI') as ShiftRow[];
    const shiftIds = shifts.map((shift) => shift.id);

    let checkins: CheckinRow[] = [];
    if (shiftIds.length > 0) {
      const { data: checkinData, error: checkinError } = await supabaseAdmin
        .from('shift_checkins')
        .select('shift_id, created_at, method, source, is_propagated')
        .in('shift_id', shiftIds)
        .order('created_at', { ascending: true });

      if (checkinError) {
        return NextResponse.json(
          { error: 'Falha ao carregar os check-ins.', detail: checkinError.message },
          { status: 500 }
        );
      }
      checkins = (checkinData ?? []) as CheckinRow[];
    }

    const firstCheckinByShift = new Map<number, CheckinRow>();
    for (const checkin of checkins) {
      if (!firstCheckinByShift.has(checkin.shift_id)) {
        firstCheckinByShift.set(checkin.shift_id, checkin);
      }
    }

    const rows: ReportRow[] = shifts
      .map((shift) => ({
        ...shift,
        checkin: firstCheckinByShift.get(shift.id) ?? null,
      }))
      .sort((a, b) => {
        const dateComparison = a.date.localeCompare(b.date);
        if (dateComparison !== 0) return dateComparison;
        const periodComparison = PERIOD_ORDER[a.period] - PERIOD_ORDER[b.period];
        if (periodComparison !== 0) return periodComparison;
        return (a.users?.full_name ?? '').localeCompare(b.users?.full_name ?? '', 'pt-BR');
      });

    const scheduledCounts: Record<PeriodKey, number> = { manha: 0, tarde: 0, noite: 0 };
    const presentCounts: Record<PeriodKey, number> = { manha: 0, tarde: 0, noite: 0 };
    for (const row of rows) {
      scheduledCounts[row.period] += 1;
      if (row.checkin) presentCounts[row.period] += 1;
    }
    const totalPresent = rows.filter((row) => row.checkin !== null).length;
    const totalMissing = rows.length - totalPresent;

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const logoPath = path.join(process.cwd(), 'public', 'medturn-logo-rounded.png');
    const logo = await pdfDoc.embedPng(fs.readFileSync(logoPath));

    const pageWidth = 841.89;
    const pageHeight = 595.28;
    const margin = 38;
    const bottomLimit = 48;
    const rowHeight = 20;
    const groupHeaderHeight = 24;
    const columns = {
      doctor: { x: margin, width: 350 },
      chief: { x: 410, width: 55 },
      status: { x: 480, width: 95 },
      method: { x: 590, width: 210 },
    };

    let pageNumber = 0;

    function addPage(): { page: PDFPage; cursor: number } {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      pageNumber += 1;
      const logoHeight = 26;
      const logoWidth = logo.width * (logoHeight / logo.height);

      page.drawImage(logo, {
        x: margin,
        y: pageHeight - margin - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
      page.drawText('MedTurn', {
        x: margin + logoWidth + 9,
        y: pageHeight - margin - 16,
        size: 12,
        font: fontBold,
        color: rgb(0.06, 0.09, 0.16),
      });
      page.drawText('Relatório mensal de check-ins', {
        x: margin,
        y: pageHeight - 88,
        size: 16,
        font: fontBold,
        color: rgb(0.06, 0.09, 0.16),
      });
      page.drawText(hospitalName, {
        x: margin,
        y: pageHeight - 108,
        size: 11,
        font,
        color: rgb(0.22, 0.27, 0.34),
      });
      page.drawText(`Competência: ${monthLabel(month)} de ${year}`, {
        x: margin,
        y: pageHeight - 124,
        size: 9,
        font,
        color: rgb(0.39, 0.45, 0.55),
      });
      page.drawText(`Gerado em: ${formatGeneratedDate(new Date().toISOString())}`, {
        x: 610,
        y: pageHeight - 124,
        size: 8,
        font,
        color: rgb(0.39, 0.45, 0.55),
      });

      const summary = `Escalados: ${rows.length} | Com check-in: ${totalPresent} | Sem check-in: ${totalMissing}`;
      page.drawRectangle({
        x: margin,
        y: pageHeight - 158,
        width: pageWidth - margin * 2,
        height: 22,
        color: rgb(0.95, 0.97, 0.98),
      });
      page.drawText(summary, {
        x: margin + 10,
        y: pageHeight - 151,
        size: 9,
        font: fontBold,
        color: rgb(0.22, 0.27, 0.34),
      });

      const turnSummary =
        `Manhã: ${presentCounts.manha}/${scheduledCounts.manha} | ` +
        `Tarde: ${presentCounts.tarde}/${scheduledCounts.tarde} | ` +
        `Noite: ${presentCounts.noite}/${scheduledCounts.noite}`;
      page.drawText(turnSummary, {
        x: 540,
        y: pageHeight - 151,
        size: 8,
        font,
        color: rgb(0.39, 0.45, 0.55),
      });

      const headerY = pageHeight - 182;
      page.drawText('Plantonista', { x: columns.doctor.x, y: headerY, size: 8, font: fontBold });
      page.drawText('Chefia', { x: columns.chief.x, y: headerY, size: 8, font: fontBold });
      page.drawText('Presença', { x: columns.status.x, y: headerY, size: 8, font: fontBold });
      page.drawText('Forma de confirmação', { x: columns.method.x, y: headerY, size: 8, font: fontBold });
      page.drawLine({
        start: { x: margin, y: headerY - 6 },
        end: { x: pageWidth - margin, y: headerY - 6 },
        thickness: 1,
        color: rgb(0.82, 0.85, 0.88),
      });

      page.drawText(`Página ${pageNumber}`, {
        x: pageWidth - margin - 42,
        y: 24,
        size: 8,
        font,
        color: rgb(0.55, 0.6, 0.66),
      });

      return { page, cursor: headerY - 22 };
    }

    let { page, cursor } = addPage();

    if (rows.length === 0) {
      page.drawText('Nenhum plantonista escalado nesta competência.', {
        x: margin,
        y: cursor - 8,
        size: 10,
        font,
        color: rgb(0.39, 0.45, 0.55),
      });
    } else {
      let currentGroup = '';

      for (const row of rows) {
        const groupKey = `${row.date}:${row.period}`;
        const startsNewGroup = groupKey !== currentGroup;
        const requiredHeight = rowHeight + (startsNewGroup ? groupHeaderHeight : 0);

        if (cursor < bottomLimit + requiredHeight) {
          const nextPage = addPage();
          page = nextPage.page;
          cursor = nextPage.cursor;
          currentGroup = '';
        }

        if (groupKey !== currentGroup) {
          page.drawRectangle({
            x: margin,
            y: cursor - 5,
            width: pageWidth - margin * 2,
            height: 18,
            color: rgb(0.91, 0.96, 0.95),
          });
          page.drawText(`${formatDate(row.date)} - ${periodLabel(row.period)}`, {
            x: margin + 9,
            y: cursor,
            size: 9,
            font: fontBold,
            color: rgb(0.05, 0.38, 0.32),
          });
          cursor -= groupHeaderHeight;
          currentGroup = groupKey;
        }

        const values = [
          { text: row.users?.full_name || 'Sem nome', ...columns.doctor },
          { text: row.is_chief ? 'Sim' : '-', ...columns.chief },
          { text: row.checkin ? 'Fez check-in' : 'Não fez', ...columns.status },
          { text: confirmationLabel(row.checkin), ...columns.method },
        ];

        for (const value of values) {
          page.drawText(cropText(value.text, font, 8, value.width), {
            x: value.x,
            y: cursor,
            size: 8,
            font,
            color: row.checkin ? rgb(0.18, 0.22, 0.28) : rgb(0.72, 0.16, 0.2),
          });
        }
        page.drawLine({
          start: { x: margin, y: cursor - 6 },
          end: { x: pageWidth - margin, y: cursor - 6 },
          thickness: 0.5,
          color: rgb(0.92, 0.93, 0.95),
        });
        cursor -= rowHeight;
      }
    }

    const pdfBytes = await pdfDoc.save();
    const fileName = `medturn_checkins_${year}-${pad2(month)}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('Erro ao gerar relatório de check-ins:', error);
    return NextResponse.json(
      { error: 'Erro inesperado ao gerar o relatório.', detail },
      { status: 500 }
    );
  }
}
