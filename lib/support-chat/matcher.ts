import {
  HUMAN_SUPPORT_REPLY,
  INITIAL_REPLY,
  KNOWLEDGE_ITEMS,
  SAFETY_FOOTER,
  type KnowledgeItem,
  type KnowledgeKeyword,
  type SupportIntent,
  type SupportProduct,
} from "./knowledge";

export type SupportChatArea = "admin" | "doctor" | "coordinator" | "general";

export type SupportFlow =
  | "idle"
  | "medturn_access_awaiting_channel"
  | "medturn_access_awaiting_error"
  | "medturn_team_awaiting_account_check"
  | "medturn_schedule_awaiting_view"
  | "medturn_schedule_awaiting_date"
  | "medturn_swap_awaiting_status"
  | "medturn_checkin_awaiting_problem"
  | "medturn_admin_schedule_awaiting_action"
  | "medturn_admin_pdf_awaiting_issue"
  | "medturn_admin_payment_awaiting_issue"
  | "medturn_admin_message_awaiting_issue"
  | "medturn_admin_notice_awaiting_target"
  | "medturn_admin_doctors_awaiting_action";

export type SupportChatContext = {
  area?: SupportChatArea;
  activeFlow?: SupportFlow;
  collected?: Record<string, string>;
};

export type SupportChatResult = {
  reply: string;
  product: SupportProduct;
  intent: SupportIntent;
  requiresHandoff: boolean;
  confidence: number;
  matchedTitle?: string;
  matchedScore?: number;
  activeFlow: SupportFlow;
  collected?: Record<string, string>;
  supportSummary?: string;
};

type MatchedKnowledgeItem = {
  item: KnowledgeItem;
  score: number;
};

const HUMAN_KEYWORDS = [
  "humano",
  "atendente",
  "whatsapp",
  "zap",
  "suporte humano",
  "falar com alguem",
  "falar com alguém",
  "telefone",
];

const ADMIN_HINTS = [
  "admin",
  "administrativo",
  "painel",
  "dashboard",
  "coordenacao",
  "coordenação",
  "editar escala",
  "mensagem do plantao",
  "mensagem do plantão",
  "enviar aviso",
  "gerenciar medicos",
  "gerenciar médicos",
  "relatorio de pagamento",
  "relatório de pagamento",
  "conflitos",
  "pendencias",
  "pendências",
];

const GREETING_KEYWORDS = [
  "oi",
  "ola",
  "olá",
  "bom dia",
  "boa tarde",
  "boa noite",
  "e ai",
  "e aí",
  "fala",
  "opa",
];

const THANKS_KEYWORDS = [
  "obrigado",
  "obrigada",
  "valeu",
  "vlw",
  "show",
  "beleza",
  "blz",
  "perfeito",
  "entendi",
];

const SUMMARY_KEYWORDS = [
  "me diga o que entendeu",
  "diga o que entendeu",
  "o que voce entendeu",
  "o que você entendeu",
  "o que entendeu",
  "resuma",
  "resume",
  "resumo",
  "qual resumo",
  "me de um resumo",
  "me dê um resumo",
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(message: string, keywords: string[]) {
  return keywords.some((keyword) => message.includes(normalize(keyword)));
}

function isShortSocialMessage(message: string, keywords: string[]) {
  const words = message.split(" ").filter(Boolean);
  const wordCount = words.length;

  if (wordCount > 5) return false;

  return keywords.some((keyword) => {
    const normalizedKeyword = normalize(keyword);

    if (message === normalizedKeyword) return true;

    if (normalizedKeyword.includes(" ")) {
      return message.includes(normalizedKeyword);
    }

    return words.includes(normalizedKeyword);
  });
}

function getKeywordTerm(keyword: KnowledgeKeyword) {
  return typeof keyword === "string" ? keyword : keyword.term;
}

function getKeywordWeight(keyword: KnowledgeKeyword) {
  if (typeof keyword !== "string") return keyword.weight;

  const normalizedKeyword = normalize(keyword);
  return Math.max(1, normalizedKeyword.split(" ").length);
}

function scoreItem(message: string, item: KnowledgeItem) {
  return item.keywords.reduce((score, keyword) => {
    const normalizedKeyword = normalize(getKeywordTerm(keyword));

    if (message.includes(normalizedKeyword)) {
      return score + getKeywordWeight(keyword);
    }

    return score;
  }, 0);
}

function confidenceFromScore(score = 0) {
  if (score >= 5) return 0.9;
  if (score >= 3) return 0.65;
  if (score >= 1) return 0.4;
  return 0;
}

function isAdminIntent(intent: SupportIntent) {
  return intent.startsWith("medturn_admin_");
}

function findBestItem(
  message: string,
  area: SupportChatArea = "admin"
): MatchedKnowledgeItem | undefined {
  const scoredCandidates = KNOWLEDGE_ITEMS.map((item) => ({
    item,
    score: scoreItem(message, item),
  }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  if (area === "admin" || includesAny(message, ADMIN_HINTS)) {
    const best = scoredCandidates[0];
    const bestAdmin = scoredCandidates.find((candidate) =>
      isAdminIntent(candidate.item.intent)
    );

    if (bestAdmin && best && bestAdmin.score >= best.score - 1) {
      return bestAdmin;
    }

    return best;
  }

  return scoredCandidates[0];
}

function withSafetyFooter(reply: string) {
  if (reply.includes(SAFETY_FOOTER)) return reply;
  return `${reply}\n\n${SAFETY_FOOTER}`;
}

function shouldShowSafetyFooter(intent: SupportIntent) {
  return intent === "medturn_password" || intent === "medturn_profile";
}

function nextFlowForIntent(intent: SupportIntent): SupportFlow {
  switch (intent) {
    case "medturn_access":
      return "medturn_access_awaiting_channel";
    case "medturn_team":
      return "medturn_team_awaiting_account_check";
    case "medturn_schedule":
      return "medturn_schedule_awaiting_view";
    case "medturn_shift_swap":
    case "medturn_admin_pending":
      return "medturn_swap_awaiting_status";
    case "medturn_financial":
      return "medturn_admin_payment_awaiting_issue";
    case "medturn_doctor_checkin":
    case "medturn_admin_checkin":
      return "medturn_checkin_awaiting_problem";
    case "medturn_admin_schedule":
    case "medturn_admin_edit_schedule":
      return "medturn_admin_schedule_awaiting_action";
    case "medturn_admin_scale_pdf":
      return "medturn_admin_pdf_awaiting_issue";
    case "medturn_admin_payment_report":
      return "medturn_admin_payment_awaiting_issue";
    case "medturn_admin_daily_message":
      return "medturn_admin_message_awaiting_issue";
    case "medturn_admin_send_notice":
      return "medturn_admin_notice_awaiting_target";
    case "medturn_admin_doctors":
      return "medturn_admin_doctors_awaiting_action";
    default:
      return "idle";
  }
}

function buildSupportSummary({
  intent,
  title,
  rawMessage,
  collected,
  area,
}: {
  intent: SupportIntent;
  title: string;
  rawMessage: string;
  collected?: Record<string, string>;
  area?: SupportChatArea;
}) {
  return [
    "Resumo para suporte:",
    "Produto: MedTurn",
    `Área: ${area ?? "admin"}`,
    `Intenção detectada: ${title}`,
    `Problema relatado: "${rawMessage.trim() || "não informado"}"`,
    `Hospital informado: ${collected?.hospital ?? "não informado"}`,
    `E-mail informado: ${collected?.email ?? "não informado"}`,
    `Status informado: ${collected?.status ?? "não informado"}`,
    `Mensagem de erro: ${collected?.errorMessage ?? "não informada"}`,
    `Último passo tentado: ${collected?.lastStep ?? "não informado"}`,
    `Intent técnico: ${intent}`,
  ].join("\n");
}

function makeResult({
  reply,
  intent,
  requiresHandoff = false,
  confidence = 0,
  matchedTitle,
  matchedScore,
  activeFlow = "idle",
  collected,
  area,
  rawMessage = "",
}: {
  reply: string;
  intent: SupportIntent;
  requiresHandoff?: boolean;
  confidence?: number;
  matchedTitle?: string;
  matchedScore?: number;
  activeFlow?: SupportFlow;
  collected?: Record<string, string>;
  area?: SupportChatArea;
  rawMessage?: string;
}): SupportChatResult {
  const supportSummary =
    requiresHandoff || intent === "human_support"
      ? buildSupportSummary({
          intent,
          title: matchedTitle ?? "Suporte humano",
          rawMessage,
          collected,
          area,
        })
      : undefined;

  return {
    reply,
    product: "medturn",
    intent,
    requiresHandoff,
    confidence,
    matchedTitle,
    matchedScore,
    activeFlow,
    collected,
    supportSummary,
  };
}

function resolveActiveFlow(
  rawMessage: string,
  normalizedMessage: string,
  context?: SupportChatContext
): SupportChatResult | undefined {
  const activeFlow = context?.activeFlow ?? "idle";
  const area = context?.area ?? "admin";
  const collected = { ...(context?.collected ?? {}) };

  if (activeFlow === "idle") return undefined;

  switch (activeFlow) {
    case "medturn_access_awaiting_channel": {
      collected.channel = rawMessage.trim();
      return makeResult({
        reply:
          "Certo. Qual mensagem aparece quando você tenta acessar? Se não aparecer mensagem, me diga se a tela fica carregando, volta para o login ou mostra acesso negado.",
        intent: "medturn_access",
        confidence: 0.75,
        matchedTitle: "Acesso ao MedTurn",
        activeFlow: "medturn_access_awaiting_error",
        collected,
        area,
        rawMessage,
      });
    }

    case "medturn_access_awaiting_error": {
      collected.errorMessage = rawMessage.trim();
      return makeResult({
        reply:
          "Entendi. Primeiro confirme se o e-mail usado é o mesmo cadastrado no MedTurn. Depois tente sair e entrar novamente. Se a mensagem for de permissão, hospital ou conta não liberada, isso precisa ser conferido por alguém com acesso ao painel.",
        intent: "medturn_access",
        requiresHandoff: true,
        confidence: 0.75,
        matchedTitle: "Acesso ao MedTurn",
        activeFlow: "idle",
        collected,
        area,
        rawMessage,
      });
    }

    case "medturn_team_awaiting_account_check": {
      collected.emailChecked = rawMessage.trim();
      return makeResult({
        reply:
          "Se o e-mail estiver correto e mesmo assim o hospital/equipe não aparecer, o vínculo ou a permissão precisam ser conferidos no painel. O assistente não consegue consultar usuários reais, mas o próximo passo é validar se esse usuário está vinculado ao hospital certo.",
        intent: "medturn_team",
        requiresHandoff: true,
        confidence: 0.75,
        matchedTitle: "Hospital ou equipe não aparece",
        activeFlow: "idle",
        collected,
        area,
        rawMessage,
      });
    }

    case "medturn_schedule_awaiting_view": {
      collected.view = rawMessage.trim();
      const isAdminView = includesAny(normalizedMessage, [
        "admin",
        "painel",
        "dashboard",
        "coordenacao",
        "coordenação",
      ]);

      return makeResult({
        reply: isAdminView
          ? "No painel administrativo, abra Ver escala ou Escala mensal, confirme hospital ativo e mês selecionado. Se estiver procurando uma data específica, qual mês ou dia você está tentando conferir?"
          : "Na área do médico, abra Minha Agenda e confira mês, hospital e data. Qual mês ou dia você está tentando conferir?",
        intent: isAdminView ? "medturn_admin_schedule" : "medturn_schedule",
        confidence: 0.75,
        matchedTitle: isAdminView ? "Escala mensal no painel" : "Escala",
        activeFlow: "medturn_schedule_awaiting_date",
        collected,
        area,
        rawMessage,
      });
    }

    case "medturn_schedule_awaiting_date": {
      collected.date = rawMessage.trim();
      return makeResult({
        reply:
          "Boa. Agora atualize a tela e confira se o hospital ativo é o correto. Se a data continuar vazia, pode ser escala ainda não lançada, filtro de mês/hospital ou permissão. Para editar, use a tela de edição da escala; para apenas visualizar, volte para a escala mensal.",
        intent: area === "admin" ? "medturn_admin_schedule" : "medturn_schedule",
        confidence: 0.75,
        matchedTitle:
          area === "admin" ? "Escala mensal no painel" : "Escala",
        activeFlow: "idle",
        collected,
        area,
        rawMessage,
      });
    }

    case "medturn_swap_awaiting_status": {
      collected.status = rawMessage.trim();
      if (
        includesAny(normalizedMessage, [
          "aguardando confirmacao",
          "aguardando confirmação",
          "pendente",
        ])
      ) {
        return makeResult({
          reply:
            "Se a troca está aguardando confirmação, ela ainda precisa ser validada pela coordenação. No painel, abra a Central de pendências ou o Histórico de trocas, entre em Ver detalhes e confirme a solicitação quando estiver tudo certo.",
          intent: "medturn_admin_swap_detail",
          confidence: 0.8,
          matchedTitle: "Detalhe da solicitação de troca",
          activeFlow: "idle",
          collected,
          area,
          rawMessage,
        });
      }

      if (includesAny(normalizedMessage, ["aceita", "aceito", "em processo"])) {
        return makeResult({
          reply:
            "Quando a troca já foi aceita por outro médico e aparece em processo, normalmente ainda falta a confirmação da coordenação para alterar a escala. Abra os detalhes da solicitação e confirme a troca conforme a rotina da equipe.",
          intent: "medturn_admin_swap_detail",
          confidence: 0.8,
          matchedTitle: "Detalhe da solicitação de troca",
          activeFlow: "idle",
          collected,
          area,
          rawMessage,
        });
      }

      if (includesAny(normalizedMessage, ["recusada", "rejeitada", "negada"])) {
        return makeResult({
          reply:
            "Se a troca foi recusada, ela não deve alterar a escala. Nesse caso, o médico precisa fazer uma nova solicitação ou a coordenação deve ajustar manualmente a escala, se for necessário.",
          intent: "medturn_admin_swap_detail",
          confidence: 0.8,
          matchedTitle: "Detalhe da solicitação de troca",
          activeFlow: "idle",
          collected,
          area,
          rawMessage,
        });
      }

      if (
        includesAny(normalizedMessage, [
          "nao aparece",
          "não aparece",
          "sumiu",
          "nao achei",
          "não achei",
        ])
      ) {
        return makeResult({
          reply:
            "Se a troca não aparece, confira a Central de pendências, o Histórico de trocas e se o hospital ativo é o correto. Também vale atualizar o painel antes de concluir que a solicitação sumiu.",
          intent: "medturn_admin_pending",
          confidence: 0.8,
          matchedTitle: "Central de pendências",
          activeFlow: "idle",
          collected,
          area,
          rawMessage,
        });
      }

      return makeResult({
        reply:
          "Entendi. Em trocas, veja se a solicitação está pendente, aceita, recusada ou aguardando confirmação da coordenação. Se já foi aceita por outro médico mas a escala não mudou, abra os detalhes da solicitação no painel para confirmar a troca conforme a rotina da equipe.",
        intent: area === "admin" ? "medturn_admin_swap_detail" : "medturn_shift_swap",
        confidence: 0.75,
        matchedTitle:
          area === "admin"
            ? "Detalhe da solicitação de troca"
            : "Troca de plantão",
        activeFlow: "idle",
        collected,
        area,
        rawMessage,
      });
    }

    case "medturn_checkin_awaiting_problem": {
      collected.problem = rawMessage.trim();
      return makeResult({
        reply:
          "Para check-in, confira data, hospital ativo e se há plantão cadastrado naquele período. No painel, também confira se o controle de presença está habilitado. Se o problema for presença real ausente ou confirmação manual, a coordenação precisa revisar no painel.",
        intent: area === "doctor" ? "medturn_doctor_checkin" : "medturn_admin_checkin",
        confidence: 0.75,
        matchedTitle: area === "doctor" ? "Check-in do médico" : "Check-in",
        activeFlow: "idle",
        collected,
        area,
        rawMessage,
      });
    }

    case "medturn_admin_schedule_awaiting_action": {
      collected.lastStep = rawMessage.trim();
      if (
        includesAny(normalizedMessage, [
          "pdf",
          "baixar",
          "baixar pdf",
          "gerar pdf",
          "exportar",
          "arquivo",
        ])
      ) {
        return makeResult({
          reply:
            "Para baixar o PDF, abra a tela Escala mensal, confirme o hospital e o mês selecionados e clique em Baixar PDF. O arquivo gerado corresponde à escala daquele mês e hospital.",
          intent: "medturn_admin_scale_pdf",
          confidence: 0.8,
          matchedTitle: "PDF da escala",
          activeFlow: "idle",
          collected,
          area,
          rawMessage,
        });
      }

      if (
        includesAny(normalizedMessage, [
          "editar",
          "edicao",
          "edição",
          "dia",
          "salvar",
          "vaga",
          "remover",
          "adicionar",
          "copiar",
          "limpar",
          "chefe",
          "badge",
          "etiqueta",
        ])
      ) {
        return makeResult({
          reply:
            "Na edição da escala, confirme se o hospital e a data estão corretos, ajuste manhã/tarde/noite, salve alterações e depois volte para a escala mensal para conferir. Se a falha for ao salvar, remover vaga, copiar escala ou marcar chefe de plantão, tente repetir a ação e confira se o hospital ativo está correto.",
          intent: "medturn_admin_edit_schedule",
          confidence: 0.8,
          matchedTitle: "Editar plantões do dia",
          activeFlow: "idle",
          collected,
          area,
          rawMessage,
        });
      }

      if (
        includesAny(normalizedMessage, [
          "visualizar",
          "ver",
          "abrir",
          "conferir",
          "data",
          "mes",
          "mês",
          "escala",
        ])
      ) {
        return makeResult({
          reply:
            "Para visualizar a escala, abra Escala mensal, confirme o hospital ativo e selecione o mês desejado. Se uma data estiver vazia, pode ser escala ainda não lançada, filtro de hospital/mês ou permissão.",
          intent: "medturn_admin_schedule",
          confidence: 0.8,
          matchedTitle: "Escala mensal no painel",
          activeFlow: "idle",
          collected,
          area,
          rawMessage,
        });
      }

      return makeResult({
        reply:
          "Na Escala mensal, você pode visualizar o mês, abrir um dia para edição ou baixar o PDF. Confirme o hospital ativo e escolha o mês correto antes de seguir.",
        intent: "medturn_admin_schedule",
        confidence: 0.75,
        matchedTitle: "Escala mensal no painel",
        activeFlow: "idle",
        collected,
        area,
        rawMessage,
      });
    }

    case "medturn_admin_pdf_awaiting_issue": {
      collected.lastStep = rawMessage.trim();

      if (
        includesAny(normalizedMessage, [
          "erro",
          "falha",
          "nao gera",
          "não gera",
          "nao baixa",
          "não baixa",
          "não consigo",
          "nao consigo",
        ])
      ) {
        return makeResult({
          reply:
            "Entendi. Na tela Escala mensal, confirme se o hospital e o mês estão corretos, atualize a página e tente baixar o PDF novamente. Se continuar falhando, envie um print ou a mensagem de erro para o suporte, porque pode depender da geração do arquivo ou dos dados da escala.",
          intent: "medturn_admin_scale_pdf",
          requiresHandoff: true,
          confidence: 0.8,
          matchedTitle: "PDF da escala",
          activeFlow: "idle",
          collected,
          area,
          rawMessage,
        });
      }

      return makeResult({
        reply:
          "Para baixar o PDF, abra a tela Escala mensal, confirme o hospital e o mês selecionados e clique em Baixar PDF. O arquivo gerado corresponde à escala daquele mês e hospital.",
        intent: "medturn_admin_scale_pdf",
        confidence: 0.8,
        matchedTitle: "PDF da escala",
        activeFlow: "idle",
        collected,
        area,
        rawMessage,
      });
    }

    case "medturn_admin_payment_awaiting_issue": {
      collected.lastStep = rawMessage.trim();
      return makeResult({
        reply:
          "No relatório de pagamento, confira mês/ano, hospital ativo e feriados antes de gerar o PDF. Se a dúvida for divergência de valor ou plantão real, precisa de conferência humana no sistema, porque o chat não acessa dados financeiros reais.",
        intent: "medturn_admin_payment_report",
        requiresHandoff: true,
        confidence: 0.75,
        matchedTitle: "Relatório de pagamento",
        activeFlow: "idle",
        collected,
        area,
        rawMessage,
      });
    }

    case "medturn_admin_message_awaiting_issue": {
      collected.lastStep = rawMessage.trim();
      return makeResult({
        reply:
          "Para mensagem do plantão, escolha a data, gere o texto, revise e copie para o grupo. Se o texto vier vazio, normalmente é porque não há escala cadastrada para a data ou o hospital ativo não é o esperado.",
        intent: "medturn_admin_daily_message",
        confidence: 0.75,
        matchedTitle: "Mensagem do plantão",
        activeFlow: "idle",
        collected,
        area,
        rawMessage,
      });
    }

    case "medturn_admin_notice_awaiting_target": {
      collected.target = rawMessage.trim();
      return makeResult({
        reply:
          "Certo. Em Enviar aviso, preencha título e mensagem, escolha se vai para todos ou para um usuário específico e confirme o envio. Se for usuário específico e a lista não carregar, feche o modal, abra novamente e confira o hospital ativo.",
        intent: "medturn_admin_send_notice",
        confidence: 0.75,
        matchedTitle: "Enviar aviso administrativo",
        activeFlow: "idle",
        collected,
        area,
        rawMessage,
      });
    }

    case "medturn_admin_doctors_awaiting_action": {
      collected.lastStep = rawMessage.trim();
      return makeResult({
        reply:
          "Em Gerenciar médicos, você pode adicionar, editar, remover vínculo, vincular a outro hospital ou importar usuários. Se uma ação não aparece ou não salva, confira se você está no hospital correto e se tem permissão administrativa nele.",
        intent: "medturn_admin_doctors",
        requiresHandoff: true,
        confidence: 0.75,
        matchedTitle: "Gerenciar médicos",
        activeFlow: "idle",
        collected,
        area,
        rawMessage,
      });
    }

    default:
      return undefined;
  }
}

function fallbackReply(area: SupportChatArea) {
  if (area === "doctor") {
    return "Me diga em uma frase o que está acontecendo: agenda, disponibilidade, proposta, troca, check-in, notificações, perfil ou acesso.";
  }

  if (area === "coordinator") {
    return "Me diga em uma frase o que está acontecendo na escala do coordenador: hospital, data, visualização ou permissão.";
  }

  return "Me diga em uma frase qual ponto do painel MedTurn você quer resolver: escala, edição, PDF, mensagem do plantão, aviso, check-in, relatório, feriados, trocas, médicos, conflitos ou hospital.";
}

function socialReply(
  normalizedMessage: string,
  context?: SupportChatContext
): SupportChatResult | undefined {
  const area = context?.area ?? "admin";
  const collected = context?.collected;

  if (isShortSocialMessage(normalizedMessage, GREETING_KEYWORDS)) {
    return makeResult({
      reply:
        "Olá! Posso te ajudar com o MedTurn. Me diga qual ponto você quer resolver: escala, edição, PDF, mensagem do plantão, aviso, check-in, relatório, feriados, trocas, médicos, conflitos ou hospital.",
      intent: "triage",
      confidence: 1,
      activeFlow: "idle",
      collected,
      area,
    });
  }

  if (isShortSocialMessage(normalizedMessage, THANKS_KEYWORDS)) {
    return makeResult({
      reply:
        "Por nada! Se precisar, me diga qual ponto do MedTurn você quer resolver e eu te oriento passo a passo.",
      intent: "triage",
      confidence: 1,
      activeFlow: "idle",
      collected,
      area,
    });
  }

  if (includesAny(normalizedMessage, SUMMARY_KEYWORDS)) {
    return makeResult({
      reply:
        collected && Object.keys(collected).length > 0
          ? `Entendi até aqui:\n\n${buildSupportSummary({
              intent: "triage",
              title: "Resumo da conversa",
              rawMessage: "Pedido de resumo",
              collected,
              area,
            })}`
          : "Até aqui, entendi que você está usando o suporte do MedTurn no painel administrativo. Ainda não tenho um problema específico registrado nesta conversa. Me diga se a dúvida é sobre escala, edição, PDF, mensagem do plantão, aviso, check-in, relatório, feriados, trocas, médicos, conflitos ou hospital.",
      intent: "triage",
      confidence: 1,
      activeFlow: "idle",
      collected,
      area,
    });
  }

  return undefined;
}

export function getSupportReply(
  rawMessage: string,
  context?: SupportChatContext
): SupportChatResult {
  const normalizedMessage = normalize(rawMessage);
  const area = context?.area ?? "admin";

  if (!normalizedMessage) {
    return makeResult({
      reply: INITIAL_REPLY,
      intent: "triage",
      area,
      activeFlow: context?.activeFlow ?? "idle",
      collected: context?.collected,
      rawMessage,
    });
  }

  const flowResult = resolveActiveFlow(rawMessage, normalizedMessage, context);
  if (flowResult) return flowResult;

  if (includesAny(normalizedMessage, HUMAN_KEYWORDS)) {
    return makeResult({
      reply: HUMAN_SUPPORT_REPLY,
      intent: "human_support",
      requiresHandoff: true,
      confidence: 1,
      matchedTitle: "Suporte humano",
      activeFlow: "idle",
      collected: context?.collected,
      area,
      rawMessage,
    });
  }

  const socialResult = socialReply(normalizedMessage, context);
  if (socialResult) return socialResult;

  const item = findBestItem(normalizedMessage, area);

  if (item) {
    const confidence = confidenceFromScore(item.score);
    const nextFlow = nextFlowForIntent(item.item.intent);
    const diagnosticReply = item.item.diagnosticQuestions?.[0];
    const shouldAskDiagnostic = nextFlow !== "idle" && Boolean(diagnosticReply);
    const handoff = item.item.requiresHandoff ? `\n\n${HUMAN_SUPPORT_REPLY}` : "";

    const baseReply = shouldAskDiagnostic
      ? `Entendi. ${diagnosticReply}`
      : `${item.item.answer}${handoff}`;
    const reply = shouldShowSafetyFooter(item.item.intent)
      ? withSafetyFooter(baseReply)
      : baseReply;

    return makeResult({
      reply,
      intent: item.item.intent,
      requiresHandoff: Boolean(item.item.requiresHandoff),
      confidence,
      matchedTitle: item.item.title,
      matchedScore: item.score,
      activeFlow: shouldAskDiagnostic ? nextFlow : "idle",
      collected: context?.collected,
      area,
      rawMessage,
    });
  }

  return makeResult({
    reply: fallbackReply(area),
    intent: "fallback",
    activeFlow: "idle",
    collected: context?.collected,
    area,
    rawMessage,
  });
}
