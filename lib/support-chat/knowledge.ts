export type SupportProduct = "medturn";

export type SupportIntent =
  | "triage"
  | "medturn_access"
  | "medturn_password"
  | "medturn_team"
  | "medturn_schedule"
  | "medturn_shift_swap"
  | "medturn_availability"
  | "medturn_notifications"
  | "medturn_financial"
  | "medturn_permissions"
  | "medturn_doctor_home"
  | "medturn_doctor_calendar"
  | "medturn_doctor_checkin"
  | "medturn_profile"
  | "medturn_public_access_request"
  | "medturn_admin_panel"
  | "medturn_admin_schedule"
  | "medturn_admin_edit_schedule"
  | "medturn_admin_scale_pdf"
  | "medturn_admin_daily_message"
  | "medturn_admin_send_notice"
  | "medturn_admin_checkin"
  | "medturn_admin_payment_report"
  | "medturn_admin_holidays"
  | "medturn_admin_swap_history"
  | "medturn_admin_swap_detail"
  | "medturn_admin_doctors"
  | "medturn_admin_conflicts"
  | "medturn_admin_pending"
  | "medturn_admin_multihospital"
  | "medturn_admin_switch_hospital"
  | "medturn_coordinator_schedule"
  | "human_support"
  | "fallback";

export type WeightedKeyword = {
  term: string;
  weight: number;
};

export type KnowledgeKeyword = string | WeightedKeyword;

export type KnowledgeItem = {
  intent: SupportIntent;
  product: SupportProduct;
  title: string;
  keywords: KnowledgeKeyword[];
  answer: string;
  diagnosticQuestions?: string[];
  nextActions?: string[];
  requiresHandoff?: boolean;
  severity?: "low" | "medium" | "high";
};

export const WHATSAPP_SUPPORT = "5571992288755";

export const HUMAN_SUPPORT_REPLY = `Se mesmo assim não resolver, entre em contato com o suporte pelo WhatsApp: ${WHATSAPP_SUPPORT}. Envie uma descrição curta do problema e, se possível, um print da tela.`;

export const INITIAL_REPLY =
  "Olá! Sou o Assistente MedTurn. Posso te ajudar com escala, plantões, trocas, avisos, check-in, financeiro e painel administrativo. Me diga o que aconteceu.";

export const SAFETY_FOOTER =
  "Não envie senha, PIN ou dados completos de pacientes pelo chat.";

export const KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  {
    intent: "medturn_access",
    product: "medturn",
    title: "Acesso ao MedTurn",
    keywords: [
      { term: "nao consigo acessar", weight: 5 },
      { term: "não consigo acessar", weight: 5 },
      { term: "nao consigo entrar", weight: 5 },
      { term: "não consigo entrar", weight: 5 },
      { term: "problema de acesso", weight: 4 },
      { term: "acesso negado", weight: 4 },
      "acessar",
      "acesso",
      "login",
      "entrar",
      "site medturn",
      "app medturn",
    ],
    answer:
      "Para acesso ao MedTurn:\n\n1. Confira se está usando o e-mail correto.\n2. Tente acessar pelo app iOS ou pela versão web, conforme sua rotina.\n3. Se houver mensagem de erro, leia a mensagem e tente novamente.\n4. Se parecer problema de conta, equipe ou permissão, isso precisa de verificação humana.",
    diagnosticQuestions: [
      "Você está tentando acessar pelo app, pelo navegador ou pelo painel administrativo?",
    ],
    requiresHandoff: true,
  },
  {
    intent: "medturn_password",
    product: "medturn",
    title: "Esqueci a senha",
    keywords: [
      "senha",
      "esqueci minha senha",
      "recuperar senha",
      "resetar senha",
      "trocar senha",
    ],
    answer:
      "Se esqueceu a senha do MedTurn, use a opção de recuperação de senha na tela de login, quando disponível.\n\nNunca envie sua senha pelo chat. Se não receber o e-mail de recuperação ou se o acesso depender de liberação da equipe, o suporte humano precisa verificar.",
    requiresHandoff: true,
  },
  {
    intent: "medturn_team",
    product: "medturn",
    title: "Hospital ou equipe não aparece",
    keywords: [
      { term: "hospital nao aparece", weight: 5 },
      { term: "hospital não aparece", weight: 5 },
      { term: "equipe nao aparece", weight: 5 },
      { term: "equipe não aparece", weight: 5 },
      { term: "hospital sumiu", weight: 5 },
      { term: "sem hospital", weight: 4 },
      { term: "sem equipe", weight: 4 },
      "minha equipe",
      "meu hospital",
      "vinculo",
      "vínculo",
      "permissao",
      "permissão",
    ],
    answer:
      "No MedTurn, hospital ou equipe podem depender de vínculo e permissão.\n\nPrimeiro confira se você entrou com o e-mail correto. Se ainda não aparecer, isso provavelmente precisa de verificação da coordenação ou do suporte humano, porque o assistente não acessa usuários ou permissões reais.",
    diagnosticQuestions: [
      "Você já conferiu se entrou com o e-mail correto desse usuário?",
    ],
    requiresHandoff: true,
  },
  {
    intent: "medturn_schedule",
    product: "medturn",
    title: "Escala",
    keywords: [
      { term: "minha escala não aparece", weight: 5 },
      { term: "minha escala nao aparece", weight: 5 },
      { term: "plantão não aparece", weight: 5 },
      { term: "plantao nao aparece", weight: 5 },
      { term: "não vejo meu plantão", weight: 5 },
      { term: "nao vejo meu plantao", weight: 5 },
      { term: "sumiu a escala", weight: 5 },
      "escala",
      "calendario",
      "calendário",
      "minha escala",
      "meu plantao",
      "meu plantão",
    ],
    answer:
      "Para escala no MedTurn:\n\n1. Confira se está no hospital/equipe correta.\n2. Se for médico, abra “Minha Agenda” para ver o calendário mensal.\n3. Verifique mês, data e período do plantão.\n4. Atualize a tela ou feche e abra o app novamente.\n5. Se uma escala ou plantão real não aparece, isso precisa ser conferido pela coordenação ou pelo suporte humano.",
    diagnosticQuestions: [
      "Você está olhando pelo painel administrativo ou pela área do médico?",
    ],
    requiresHandoff: true,
  },
  {
    intent: "medturn_shift_swap",
    product: "medturn",
    title: "Troca de plantão",
    keywords: [
      { term: "troca de plantão", weight: 5 },
      { term: "troca de plantao", weight: 5 },
      { term: "não consigo trocar", weight: 5 },
      { term: "nao consigo trocar", weight: 5 },
      { term: "troca ficou pendente", weight: 5 },
      { term: "aguardando confirmação", weight: 5 },
      { term: "aguardando confirmacao", weight: 5 },
      { term: "em processo", weight: 4 },
      "trocar plantao",
      "trocar plantão",
      "solicitacao de troca",
      "solicitação de troca",
      "passar plantao",
      "passar plantão",
    ],
    answer:
      "Para troca de plantão no MedTurn:\n\n1. Abra o plantão desejado na agenda ou em “Propostas”.\n2. Escolha se quer anunciar para todos, enviar oferta direcionada ou aceitar uma oferta disponível.\n3. Depois de enviar ou aceitar, acompanhe o status.\n4. Em muitos fluxos, a troca fica aguardando confirmação da coordenação antes de alterar a escala.\n\nSe a opção não aparece, pode ser regra de permissão, plantão encerrado ou solicitação já em andamento.",
    diagnosticQuestions: [
      "A troca está pendente, aceita, recusada ou aguardando confirmação da coordenação?",
    ],
  },
  {
    intent: "medturn_availability",
    product: "medturn",
    title: "Disponibilidade",
    keywords: [
      "disponibilidade",
      "disponivel",
      "disponível",
      "indisponivel",
      "indisponível",
      "bloquear data",
    ],
    answer:
      "Na tela “Disponibilidade” do MedTurn, o médico seleciona o dia e marca manhã, tarde ou noite.\n\nTambém é possível ver plantonistas disponíveis em visão de Dia, 7 dias ou 30 dias. Se houver um colega disponível e você tiver plantão compatível na mesma data e período, pode oferecer seu plantão para ele.\n\nApós oferecer, a troca fica aguardando confirmação da coordenação.",
  },
  {
    intent: "medturn_notifications",
    product: "medturn",
    title: "Notificações",
    keywords: [
      "notificacao",
      "notificação",
      "notificacoes",
      "notificações",
      "push",
      "aviso",
      "alerta",
    ],
    answer:
      "Para notificações do MedTurn:\n\n1. Confira se as notificações estão permitidas no iOS.\n2. Abra o app para atualizar sua sessão.\n3. Verifique se a equipe usa esse tipo de aviso.\n4. Se apenas algumas notificações não chegam, pode depender da configuração da escala ou da coordenação.",
  },
  {
    intent: "medturn_financial",
    product: "medturn",
    title: "Relatório financeiro",
    keywords: [
      "financeiro",
      "relatorio financeiro",
      "relatório financeiro",
      "pagamento",
      "valor",
      "plantao pago",
      "plantão pago",
    ],
    answer:
      "Relatórios financeiros no MedTurn dependem dos plantões lançados, feriados configurados e permissões da equipe.\n\nNo painel admin, selecione mês e ano, clique em “Atualizar” e confira o relatório por médico. A tela usa a lógica indicada no painel: Manhã/Tarde = 0.5, Noite = 1.0, com prioridade Feriado > FDS > Semana.\n\nPara valores, plantões reais ou divergências de relatório, a coordenação ou suporte humano precisa verificar.",
    diagnosticQuestions: [
      "O problema é gerar relatório, conferir valores, atualizar dados ou configurar feriados?",
    ],
    requiresHandoff: true,
  },
  {
    intent: "medturn_permissions",
    product: "medturn",
    title: "Permissões",
    keywords: [
      "permissao",
      "permissão",
      "perfil",
      "administrador",
      "coordenador",
      "nao tenho acesso",
      "não tenho acesso",
      "bloqueado",
    ],
    answer:
      "No MedTurn, a tela exibida depende do perfil e do vínculo do usuário:\n\n1. Admin acessa o dashboard administrativo.\n2. Médico acessa o painel do médico.\n3. Coordenador pode acessar a escala diária em modo de leitura.\n\nSe uma função não aparece, confirme hospital ativo e perfil. Alterações de vínculo, acesso ou permissão precisam ser feitas pela coordenação ou avaliadas pelo suporte humano.",
    requiresHandoff: true,
  },
  {
    intent: "medturn_doctor_home",
    product: "medturn",
    title: "Painel do médico",
    keywords: [
      "painel do medico",
      "painel do médico",
      "proximo plantao",
      "próximo plantão",
      "atalhos rapidos",
      "atalhos rápidos",
      "minha agenda",
      "propostas",
      "oportunidades extras",
      "sair da conta",
    ],
    answer:
      "No painel do médico, o MedTurn mostra o próximo plantão, atalhos para “Minha Agenda”, “Disponibilidade” e “Propostas”, além do check-in quando estiver disponível para o dia.\n\nSe o próximo plantão não aparece, abra “Minha Agenda”, confira mês/data e confirme se está no hospital correto. Se o plantão real continuar ausente, a coordenação ou suporte humano precisa verificar a escala.",
    requiresHandoff: true,
  },
  {
    intent: "medturn_doctor_calendar",
    product: "medturn",
    title: "Agenda do médico",
    keywords: [
      "minha agenda",
      "meus plantoes",
      "meus plantões",
      "calendario do medico",
      "calendário do médico",
      "agenda completa",
      "aceitar oferta",
      "anunciar plantao",
      "anunciar plantão",
      "cancelar anuncio",
      "cancelar anúncio",
    ],
    answer:
      "Em “Minha Agenda”, o médico vê o calendário mensal com seus plantões, disponibilidades e trocas disponíveis.\n\nAo abrir um dia, pode ver equipe por período, aceitar ofertas, anunciar um plantão para todos, enviar oferta direcionada ou cancelar anúncio quando ainda permitido. Plantões encerrados ou com solicitação em andamento podem bloquear novas ações.",
  },
  {
    intent: "medturn_doctor_checkin",
    product: "medturn",
    title: "Check-in do médico",
    keywords: [
      "check-in",
      "checkin",
      "check in",
      "confirmar presenca",
      "confirmar presença",
      "check-in medico",
      "check-in médico",
      "checkin medico",
      "checkin médico",
      "meus plantoes hoje",
      "meus plantões hoje",
      "janela expirada",
      "ausente",
    ],
    answer:
      "O check-in do médico aparece quando o hospital usa controle de presença e há plantão do usuário no dia.\n\nSe o botão não aparece:\n1. Confira se existe plantão para hoje.\n2. Veja se o hospital usa check-in.\n3. Se aparecer “aguardando início”, tente no horário do plantão.\n4. Se aparecer “janela expirada”, a presença pode constar como ausente.\n\nSe deveria aparecer e não aparece, a coordenação precisa conferir a configuração do hospital.",
    diagnosticQuestions: [
      "O problema é botão ausente, janela expirada, presença não registrada ou confirmação manual?",
    ],
    requiresHandoff: true,
  },
  {
    intent: "medturn_profile",
    product: "medturn",
    title: "Perfil e troca de senha",
    keywords: [
      "perfil",
      "meu perfil",
      "trocar senha",
      "alterar senha",
      "atualizar senha",
      "nova senha",
      "confirmar senha",
      "ativar notificacoes",
      "ativar notificações",
    ],
    answer:
      "Na tela “Perfil”, o usuário pode ver dados da conta, hospitais/perfis vinculados, notificações e trocar a própria senha.\n\nPara trocar senha, informe a nova senha e confirme no segundo campo. Se não salvar, confira se a senha tem o tamanho mínimo e se os dois campos coincidem. Nunca envie sua senha pelo chat.",
  },
  {
    intent: "medturn_public_access_request",
    product: "medturn",
    title: "Solicitar acesso ou implantação",
    keywords: [
      "solicitar acesso",
      "pedir acesso",
      "nao tenho conta",
      "não tenho conta",
      "solicitar implantacao",
      "solicitar implantação",
      "implantar medturn",
      "implantacao do medturn",
      "implantação do medturn",
      "criar credenciais",
    ],
    answer:
      "O MedTurn tem páginas públicas para solicitar acesso ou solicitar implantação em um hospital.\n\nPara acesso individual, normalmente o coordenador ou admin cria as credenciais. Para implantação, a solicitação gera uma mensagem para contato com a equipe pelo e-mail oficial. Se você já deveria ter acesso e não consegue entrar, isso precisa ser verificado pela coordenação ou suporte humano.",
    requiresHandoff: true,
  },
  {
    intent: "medturn_admin_panel",
    product: "medturn",
    title: "Painel administrativo MedTurn",
    keywords: [
      "painel administrativo",
      "dashboard administrativo",
      "dashboard do medturn",
      "painel medturn",
      "rotina da coordenacao",
      "rotina da coordenação",
      "acoes rapidas",
      "ações rápidas",
      "admin medturn",
    ],
    answer:
      "No painel administrativo do MedTurn, a coordenação encontra a rotina principal do hospital:\n\n1. Escala mensal: visualizar, editar plantões e baixar PDF.\n2. Mensagem do plantão: gerar texto diário por turno.\n3. Enviar aviso: comunicar um usuário ou todos do hospital.\n4. Relatório de pagamento: conferir produção, PDF e feriados.\n5. Histórico de trocas: auditar trocas realizadas, pendentes e não realizadas.\n6. Gerenciar médicos: organizar usuários vinculados.\n7. Ver conflitos: identificar sobreposição entre hospitais.\n8. Check-in: acompanhar presença, quando habilitado.\n\nO assistente orienta o uso do painel, mas não acessa dados reais do sistema.",
  },
  {
    intent: "medturn_admin_schedule",
    product: "medturn",
    title: "Escala mensal no painel",
    keywords: [
      { term: "escala", weight: 4 },
      { term: "escalas", weight: 4 },
      { term: "escala mensal", weight: 5 },
      { term: "ver escala", weight: 5 },
      { term: "organizar escala", weight: 4 },
      { term: "montar escala", weight: 4 },
      { term: "plantão na escala", weight: 4 },
      { term: "plantao na escala", weight: 4 },
      "editar escala",
      "abrir escala",
    ],
    answer:
      "No painel administrativo, use “Ver escala” ou “Escala mensal” para visualizar o mês do hospital selecionado.\n\nA tela mostra contadores por período: manhã até 8, tarde até 8 e noite até 4. O admin pode trocar hospital, navegar entre meses, baixar PDF e abrir um dia para edição.\n\nPara montar escala, confira também disponibilidades recentes, pendências de troca e conflitos.",
    diagnosticQuestions: [
      "Você quer visualizar a escala, editar um dia, baixar PDF ou conferir uma data específica?",
    ],
  },
  {
    intent: "medturn_admin_edit_schedule",
    product: "medturn",
    title: "Editar plantões do dia",
    keywords: [
      { term: "edição", weight: 4 },
      { term: "edicao", weight: 4 },
      { term: "editar", weight: 4 },
      { term: "editar plantão", weight: 5 },
      { term: "editar plantao", weight: 5 },
      { term: "salvar escala", weight: 5 },
      { term: "não consigo salvar", weight: 5 },
      { term: "nao consigo salvar", weight: 5 },
      { term: "adicionar vaga", weight: 4 },
      { term: "remover vaga", weight: 4 },
      "editar plantoes",
      "editar plantões",
      "salvar alteracoes",
      "salvar alterações",
      "limpar escala",
      "copiar escala",
      "chefe de plantao",
      "chefe de plantão",
      "badge",
      "etiqueta",
    ],
    answer:
      "Na edição do dia, o admin organiza médicos por manhã, tarde e noite.\n\nPode selecionar médicos, marcar chefe de plantão, adicionar badge curto, adicionar/remover vagas, limpar a escala do dia, copiar para outra data e salvar alterações.\n\nSe não conseguir salvar, confira se está como admin do hospital, se há médico selecionado nas vagas desejadas e tente abrir a data novamente. Se persistir, suporte humano precisa verificar permissão ou erro do sistema.",
    diagnosticQuestions: [
      "Qual ação falhou: salvar, adicionar/remover vaga, copiar escala, limpar dia ou marcar chefe de plantão?",
    ],
    requiresHandoff: true,
  },
  {
    intent: "medturn_admin_scale_pdf",
    product: "medturn",
    title: "PDF da escala",
    keywords: [
      { term: "pdf", weight: 5 },
      { term: "baixar pdf", weight: 5 },
      { term: "pdf da escala", weight: 5 },
      { term: "gerar pdf da escala", weight: 5 },
      { term: "exportar escala", weight: 4 },
      { term: "escala em pdf", weight: 5 },
      { term: "falha ao gerar pdf da escala", weight: 5 },
      { term: "erro ao gerar pdf", weight: 5 },
      { term: "pdf não gera", weight: 5 },
      { term: "pdf nao gera", weight: 5 },
      { term: "não consigo baixar pdf", weight: 5 },
      { term: "nao consigo baixar pdf", weight: 5 },
    ],
    answer:
      "Na tela “Escala mensal”, o botão “Baixar PDF” gera o PDF da escala do mês e hospital selecionados.\n\nSe falhar, tente novamente após atualizar a tela. Se continuar falhando, envie a mensagem de erro ou print para o suporte humano, porque pode depender da geração do arquivo ou dos dados da escala.",
    diagnosticQuestions: [
      "Você quer baixar o PDF da escala ou está dando erro ao gerar o arquivo?",
    ],
    requiresHandoff: true,
  },
  {
    intent: "medturn_admin_daily_message",
    product: "medturn",
    title: "Mensagem do plantão",
    keywords: [
      { term: "mensagem", weight: 4 },
      { term: "mensagem do plantao", weight: 5 },
      { term: "mensagem do plantão", weight: 5 },
      { term: "gerar mensagem", weight: 5 },
      { term: "copiar mensagem", weight: 4 },
      { term: "mensagem veio vazia", weight: 5 },
      { term: "mensagem não gerou", weight: 5 },
      { term: "mensagem nao gerou", weight: 5 },
      "texto diario",
      "texto diário",
      "plantonistas separados por turno",
      "grupo da equipe",
    ],
    answer:
      "No painel administrativo, “Mensagem do plantão” gera automaticamente um texto diário com os plantonistas separados por turno.\n\nPasso a passo:\n1. Abra “Mensagem do plantão”.\n2. Escolha a data.\n3. Clique em “Gerar mensagem”.\n4. Revise o texto, porque ele é editável.\n5. Clique em “Copiar mensagem” e envie no grupo da equipe.\n\nSe a mensagem não gerar, confirme se há escala cadastrada para a data selecionada.",
    diagnosticQuestions: [
      "O problema é gerar a mensagem, copiar o texto ou a mensagem veio vazia?",
    ],
  },
  {
    intent: "medturn_admin_send_notice",
    product: "medturn",
    title: "Enviar aviso administrativo",
    keywords: [
      { term: "aviso", weight: 4 },
      { term: "avisos", weight: 4 },
      { term: "enviar aviso", weight: 5 },
      { term: "aviso administrativo", weight: 5 },
      { term: "mandar notificação", weight: 5 },
      { term: "mandar notificacao", weight: 5 },
      { term: "notificar médico", weight: 4 },
      { term: "notificar medico", weight: 4 },
      "enviar para todos",
      "enviar para um usuario",
      "enviar para um usuário",
      "titulo do aviso",
      "título do aviso",
    ],
    answer:
      "No painel administrativo, use “Enviar aviso” para mandar uma comunicação a um usuário específico ou a todos os usuários do hospital.\n\nPasso a passo:\n1. Clique em “Enviar aviso”.\n2. Preencha o título e a mensagem.\n3. Escolha se será para um usuário ou para todos do hospital.\n4. Se for um usuário, selecione o destinatário.\n5. Clique em “Enviar aviso”.\n\nSe a lista de usuários não carregar, tente fechar e abrir o modal novamente ou atualizar o painel.",
    diagnosticQuestions: [
      "O aviso é para todos do hospital ou para um usuário específico?",
    ],
  },
  {
    intent: "medturn_admin_checkin",
    product: "medturn",
    title: "Check-in",
    keywords: [
      { term: "checkin", weight: 5 },
      { term: "check-in", weight: 5 },
      { term: "check in", weight: 5 },
      "abrir check-in",
      "abrir checkin",
    ],
    answer:
      "No painel administrativo, “Check-in” permite acompanhar presença dos plantonistas do dia.\n\nO admin pode ativar/desativar o controle de presença do hospital, salvar a configuração, escolher a data, ver status por período e confirmar presença manualmente quando necessário.\n\nSe a tela vier vazia, confirme hospital ativo, data e se há plantões cadastrados. Se a configuração não salvar, suporte humano precisa verificar.",
    diagnosticQuestions: [
      "O problema é tela vazia, configuração que não salva, presença ausente ou confirmação manual?",
    ],
    requiresHandoff: true,
  },
  {
    intent: "medturn_admin_payment_report",
    product: "medturn",
    title: "Relatório de pagamento",
    keywords: [
      { term: "relatorio", weight: 4 },
      { term: "relatório", weight: 4 },
      { term: "financeiro", weight: 4 },
      { term: "pagamento", weight: 4 },
      { term: "relatorio de pagamento", weight: 5 },
      { term: "relatório de pagamento", weight: 5 },
      { term: "não aparece pagamento", weight: 5 },
      { term: "nao aparece pagamento", weight: 5 },
      { term: "divergencia de valor", weight: 5 },
      { term: "divergência de valor", weight: 5 },
      { term: "fechamento do mes", weight: 4 },
      { term: "fechamento do mês", weight: 4 },
      "calcular turnos",
      "turnos do mes",
      "turnos do mês",
      "feriados da producao",
      "feriados da produção",
    ],
    answer:
      "No painel administrativo, “Relatório de pagamento” permite selecionar mês/ano, atualizar dados, gerar PDF e consultar produção por médico.\n\nA tela indica a base de cálculo: Manhã/Tarde = 0.5, Noite = 1.0, com prioridade Feriado > FDS > Semana. Etiquetas como PED, UTI e ELET aparecem no PDF, mas não mudam o cálculo por enquanto.\n\nPara divergências de valores, plantões reais ou dados financeiros, a coordenação/suporte humano precisa verificar no sistema.",
    diagnosticQuestions: [
      "O problema é gerar PDF, atualizar dados, feriados ou divergência de valores/plantões?",
    ],
    requiresHandoff: true,
  },
  {
    intent: "medturn_admin_holidays",
    product: "medturn",
    title: "Feriados no relatório",
    keywords: [
      { term: "feriado", weight: 4 },
      { term: "feriados", weight: 4 },
      "feriados do hospital",
      "importar feriados",
      "import nacional",
      "feriado manual",
      "adicionar feriado",
      "excluir feriado",
      "ativar feriado",
      "desativar feriado",
    ],
    answer:
      "Na tela “Relatório de pagamento”, o admin também gerencia feriados do hospital.\n\nÉ possível importar feriados nacionais, adicionar feriado manual, ativar/desativar feriados e excluir apenas feriados manuais/custom. Como feriados podem alterar o fechamento, confira mês, ano e hospital antes de gerar o PDF.",
  },
  {
    intent: "medturn_admin_swap_history",
    product: "medturn",
    title: "Histórico de trocas",
    keywords: [
      "historico de trocas",
      "histórico de trocas",
      "trocas realizadas",
      "trocas pendentes",
      "trocas nao realizadas",
      "trocas não realizadas",
      "auditoria de trocas",
      "log de trocas",
    ],
    answer:
      "No painel administrativo, “Histórico de trocas” permite consultar trocas realizadas, pendentes e não realizadas por mês.\n\nEsse caminho é útil quando a coordenação precisa revisar o que aconteceu com uma solicitação, acompanhar pendências ou conferir o histórico da rotina de trocas.",
  },
  {
    intent: "medturn_admin_swap_detail",
    product: "medturn",
    title: "Detalhe da solicitação de troca",
    keywords: [
      "detalhe da solicitacao",
      "detalhe da solicitação",
      "solicitacao especifica",
      "solicitação específica",
      "confirmar solicitacao",
      "confirmar solicitação",
      "aprovar troca",
      "rejeitar troca",
      "plantao original",
      "plantão original",
      "medico escalado atual",
      "médico escalado atual",
    ],
    answer:
      "No detalhe da solicitação de troca, a coordenação vê o plantão original, o médico escalado atual, quem solicitou, o alvo da troca e as ações disponíveis.\n\nQuando um médico aceita uma oferta, muitas vezes ainda falta confirmação da coordenação para efetivar a alteração na escala. Se uma solicitação não aparece ou abre no hospital errado, pode ser vínculo/permissão e precisa de verificação humana.",
    requiresHandoff: true,
  },
  {
    intent: "medturn_admin_doctors",
    product: "medturn",
    title: "Gerenciar médicos",
    keywords: [
      { term: "médicos", weight: 4 },
      { term: "medicos", weight: 4 },
      { term: "médico", weight: 3 },
      { term: "medico", weight: 3 },
      { term: "gerenciar médicos", weight: 5 },
      { term: "gerenciar medicos", weight: 5 },
      { term: "adicionar médico", weight: 5 },
      { term: "adicionar medico", weight: 5 },
      { term: "remover vínculo", weight: 5 },
      { term: "remover vinculo", weight: 5 },
      { term: "importar usuários", weight: 4 },
      { term: "importar usuarios", weight: 4 },
      "medicos vinculados",
      "médicos vinculados",
      "usuarios vinculados",
      "usuários vinculados",
      "organizar usuarios",
      "organizar usuários",
      "cadastro de medicos",
      "cadastro de médicos",
    ],
    answer:
      "No painel administrativo, “Gerenciar médicos” permite listar médicos vinculados, adicionar médico, editar dados, remover vínculo, vincular médico a outro hospital e importar usuários de outro hospital.\n\nAo cadastrar médico, ele pode acessar com senha provisória conforme a rotina configurada. Alterações de vínculo, acesso e permissão devem ser feitas apenas por quem tem autorização no painel.",
    diagnosticQuestions: [
      "Você quer adicionar, editar, remover vínculo, vincular a outro hospital ou importar usuários?",
    ],
    requiresHandoff: true,
  },
  {
    intent: "medturn_admin_conflicts",
    product: "medturn",
    title: "Conflitos de escala",
    keywords: [
      { term: "conflito", weight: 4 },
      { term: "conflitos", weight: 4 },
      { term: "ver conflitos", weight: 5 },
      { term: "conflito de escala", weight: 5 },
      { term: "médico em mais de um hospital", weight: 5 },
      { term: "medico em mais de um hospital", weight: 5 },
      { term: "sobreposição", weight: 4 },
      { term: "sobreposicao", weight: 4 },
      "medico escalado em mais de um hospital",
      "médico escalado em mais de um hospital",
      "mesmo periodo",
      "mesmo período",
    ],
    answer:
      "No painel administrativo, “Ver conflitos” ajuda a identificar médicos escalados em mais de um hospital no mesmo período.\n\nQuando houver conflitos, o card de prioridade pode destacar a pendência. Abra “Ver conflitos”, confira o mês/período indicado e ajuste a escala conforme a rotina da coordenação.",
  },
  {
    intent: "medturn_admin_pending",
    product: "medturn",
    title: "Central de pendências",
    keywords: [
      { term: "trocas", weight: 4 },
      { term: "troca", weight: 4 },
      { term: "central de pendências", weight: 5 },
      { term: "central de pendencias", weight: 5 },
      { term: "troca aguardando confirmação", weight: 5 },
      { term: "troca aguardando confirmacao", weight: 5 },
      { term: "confirmar troca", weight: 5 },
      { term: "ver detalhes", weight: 4 },
      "pendencias",
      "pendências",
      "solicitacoes de troca",
      "solicitações de troca",
      "aguardando confirmacao",
      "aguardando confirmação",
      "oferta direcionada",
      "atualizar painel",
    ],
    answer:
      "Na Central de pendências do painel MedTurn, a coordenação acompanha solicitações de troca e disponibilidades recentes.\n\nPara trocas:\n1. Veja o status da solicitação.\n2. Se aparecer “aguardando confirmação”, abra “Ver detalhes”.\n3. Confirme ou acompanhe conforme a regra da equipe.\n\nPara atualizar os dados, use o botão “Atualizar”. O assistente não confirma trocas nem consulta dados reais.",
    diagnosticQuestions: [
      "A troca está pendente, aceita, em processo, recusada ou não aparece na central?",
    ],
  },
  {
    intent: "medturn_admin_multihospital",
    product: "medturn",
    title: "Pendências em outros hospitais",
    keywords: [
      "multihospital",
      "multi hospital",
      "outros hospitais",
      "pendencias em outros hospitais",
      "pendências em outros hospitais",
      "abrir outro hospital",
      "trocas em outro hospital",
    ],
    answer:
      "No painel administrativo, a área “Multihospital” mostra pendências em outros hospitais aos quais a admin tem acesso.\n\nEla destaca trocas já aceitas por outro médico e que ainda aguardam confirmação. Use “Abrir” para trocar temporariamente o hospital ativo e conferir a pendência no painel correspondente.",
  },
  {
    intent: "medturn_admin_switch_hospital",
    product: "medturn",
    title: "Trocar hospital",
    keywords: [
      { term: "hospital", weight: 3 },
      { term: "hospitais", weight: 3 },
      { term: "trocar hospital", weight: 5 },
      "hospital selecionado",
      "selecionar hospital",
      "hospital ativo",
      "hospital nao identificado",
      "hospital não identificado",
      "abrindo hospital",
    ],
    answer:
      "No painel administrativo, “Trocar hospital” permite selecionar outro hospital vinculado ao usuário.\n\nSe aparecer “Hospital não identificado”, volte para a seleção de hospital e escolha novamente. Se o hospital esperado não aparece, pode ser vínculo/permissão e precisa ser conferido por suporte humano ou pela coordenação responsável.",
    requiresHandoff: true,
  },
  {
    intent: "medturn_coordinator_schedule",
    product: "medturn",
    title: "Escala diária do coordenador",
    keywords: [
      "coordenador",
      "escala diaria",
      "escala diária",
      "modo leitura",
      "ontem hoje amanha",
      "ontem hoje amanhã",
      "visualizacao rapida",
      "visualização rápida",
    ],
    answer:
      "O perfil coordenador pode acessar a escala diária em modo de leitura. A tela permite escolher hospital e data, usar atalhos Ontem, Hoje e Amanhã, e ver os profissionais escalados por manhã, tarde e noite.\n\nCoordenador sem perfil admin não edita escala nessa tela. Se precisar editar, a permissão deve ser conferida pela coordenação/admin responsável.",
    requiresHandoff: true,
  },
];
