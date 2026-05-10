import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  Users,
  Lock,
  Bell,
  CalendarDays,
  Repeat,
  ClipboardList,
  Clock,
  AlertTriangle,
  Database,
  Mail,
  Scale,
} from 'lucide-react';

export const metadata = {
  title: 'Termos de Uso | MedTurn',
  description:
    'Termos de Uso do MedTurn para médicos, coordenadores, administradores e demais usuários autorizados da plataforma.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-600 font-sans selection:bg-blue-100">
      {/* Navbar Simplificada */}
      <nav className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center text-slate-500 hover:text-blue-600 transition-colors font-medium text-sm group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar para o Site
        </Link>

        <span className="font-bold text-blue-600 text-lg tracking-tight">
          MedTurn
        </span>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pb-20">
        {/* Cabeçalho */}
        <div className="text-center mb-12 mt-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-6 shadow-sm">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Termos de Uso
          </h1>

          <p className="text-slate-500 text-lg">
            Condições de acesso e uso da plataforma MedTurn.
          </p>

          <div className="mt-4 inline-block px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-500 shadow-sm">
            Última atualização: 10 de maio de 2026
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-100">
            <Section
              number="01"
              title="Aceite dos termos"
              icon={<ShieldCheck className="w-5 h-5" />}
            >
              <p>
                Estes Termos de Uso regulam o acesso e a utilização da
                plataforma <strong>MedTurn</strong>, incluindo seu aplicativo
                iOS, sua versão web responsiva e demais interfaces digitais
                disponibilizadas aos usuários autorizados.
              </p>

              <p className="mt-4">
                Ao baixar, acessar, realizar login ou utilizar o MedTurn, o
                usuário declara que leu, compreendeu e concorda com estes
                Termos de Uso e com a Política de Privacidade aplicável,
                observadas as regras e permissões definidas pela contratante.
              </p>
            </Section>

            <Section
              number="02"
              title="Definições"
              icon={<ClipboardList className="w-5 h-5" />}
            >
              <p>
                <strong>MedTurn:</strong> plataforma digital de gestão
                operacional de escalas médicas, plantões, disponibilidade,
                solicitações de troca, ofertas de plantão, notificações,
                visualização de conflitos, confirmação auxiliar de presença e
                relatórios operacionais.
              </p>

              <p className="mt-4">
                <strong>Usuário:</strong> profissional autorizado a acessar o
                MedTurn, incluindo médicos, coordenadores, administradores ou
                outros perfis vinculados à instituição, empresa, grupo médico,
                hospital ou unidade licenciada.
              </p>

              <p className="mt-4">
                <strong>Contratante:</strong> pessoa jurídica, grupo médico,
                empresa, instituição ou entidade responsável pela contratação do
                MedTurn e pela gestão dos usuários vinculados à plataforma.
              </p>

              <p className="mt-4">
                <strong>Administrador ou Coordenador:</strong> usuário com
                permissões específicas para gerenciar escalas, plantões,
                usuários, aprovações, solicitações, relatórios ou demais
                funcionalidades administrativas da plataforma.
              </p>

              <p className="mt-4">
                <strong>Contratada / MedTurn:</strong> responsável pela
                disponibilização, manutenção técnica, suporte e evolução da
                plataforma MedTurn, nos termos do contrato firmado com a
                contratante.
              </p>
            </Section>

            <Section
              number="03"
              title="Objeto dos termos"
              icon={<FileText className="w-5 h-5" />}
            >
              <p>
                Estes Termos têm por objetivo estabelecer as condições de acesso
                e uso do MedTurn pelos usuários autorizados.
              </p>

              <p className="mt-4">
                O MedTurn é uma ferramenta digital auxiliar para organização
                operacional de escalas médicas, plantões, disponibilidades,
                trocas, ofertas, notificações, alertas, confirmação auxiliar de
                presença e relatórios de apoio.
              </p>

              <p className="mt-4">
                O MedTurn não substitui atos administrativos oficiais da
                contratante, documentos oficiais de escala, sistemas internos de
                recursos humanos, folha de pagamento, controle definitivo de
                frequência ou jornada, sistemas públicos ou privados de gestão
                contratual, nem comunicações institucionais obrigatórias.
              </p>
            </Section>

            <Section
              number="04"
              title="Natureza auxiliar da plataforma"
              icon={<Scale className="w-5 h-5" />}
            >
              <p>
                O usuário reconhece que o MedTurn possui natureza auxiliar,
                operacional e informativa.
              </p>

              <p className="mt-4">
                A validação final das escalas, plantões, trocas, aprovações,
                relatórios de produção, presença dos profissionais, cumprimento
                de plantões, pagamentos, glosas, substituições, ausências,
                comunicações oficiais e demais decisões administrativas cabe
                exclusivamente à contratante, por meio de seus representantes,
                administradores, coordenadores ou prepostos.
              </p>

              <p className="mt-4">
                O MedTurn não exerce fiscalização sobre jornada, presença,
                conduta médica, cumprimento de plantões, regularidade
                profissional dos usuários ou obrigações internas da contratante.
              </p>
            </Section>

            <Section
              number="05"
              title="Acesso à plataforma"
              icon={<Users className="w-5 h-5" />}
            >
              <p>
                O acesso ao MedTurn é disponibilizado apenas a usuários
                autorizados pela contratante.
              </p>

              <p className="mt-4">
                O usuário poderá acessar a plataforma por meio de aplicativo
                iOS, versão web responsiva ou outro meio oficialmente
                disponibilizado.
              </p>

              <p className="mt-4">
                O acesso poderá depender de conexão à internet, autenticação,
                navegador compatível, dispositivo adequado, sistema operacional
                atualizado, permissões do dispositivo, configurações do usuário
                e disponibilidade de serviços de terceiros.
              </p>

              <p className="mt-4">
                A contratante é responsável por indicar, habilitar, desabilitar
                e gerenciar os usuários autorizados, bem como seus respectivos
                perfis de acesso.
              </p>
            </Section>

            <Section
              number="06"
              title="Cadastro, login e credenciais"
              icon={<Lock className="w-5 h-5" />}
            >
              <p>
                Cada usuário deverá utilizar credenciais próprias e individuais.
              </p>

              <p className="mt-4">
                É proibido compartilhar login, senha, link de acesso, código de
                autenticação ou qualquer credencial pessoal com terceiros.
              </p>

              <p className="mt-4">
                O usuário é responsável por manter suas credenciais em sigilo e
                por comunicar imediatamente à contratante ou ao suporte indicado
                qualquer suspeita de acesso indevido, uso não autorizado ou
                comprometimento de sua conta.
              </p>

              <p className="mt-4">
                Atos realizados por meio da conta do usuário poderão ser
                registrados na plataforma, incluindo acessos, solicitações,
                aprovações, recusas, alterações, confirmações, mensagens e
                demais eventos operacionais.
              </p>
            </Section>

            <Section number="07" title="Perfis de usuário">
              <p>
                O MedTurn poderá possuir diferentes perfis de acesso, tais como
                médico, coordenador, administrador ou outros perfis definidos
                pela contratante.
              </p>

              <p className="mt-4">
                As permissões de cada perfil poderão variar conforme
                configuração da plataforma, hospital/unidade vinculada e
                decisões administrativas da contratante.
              </p>

              <p className="mt-4">
                O usuário somente deverá utilizar funcionalidades compatíveis
                com seu perfil e com as finalidades autorizadas pela
                contratante.
              </p>
            </Section>

            <Section
              number="08"
              title="Uso adequado da plataforma"
              icon={<ShieldCheck className="w-5 h-5" />}
            >
              <p>
                O usuário compromete-se a utilizar o MedTurn de forma ética,
                adequada, segura e compatível com sua finalidade.
              </p>

              <p className="mt-4 mb-3">É vedado ao usuário:</p>

              <ul className="space-y-2 list-disc pl-5 marker:text-blue-500">
                <li>
                  Utilizar a plataforma para finalidade ilícita, abusiva,
                  fraudulenta, discriminatória, ofensiva ou incompatível com
                  estes Termos.
                </li>
                <li>
                  Inserir informações falsas, incompletas, enganosas ou
                  sabidamente incorretas.
                </li>
                <li>
                  Tentar acessar dados, contas, hospitais, unidades, escalas,
                  usuários ou áreas administrativas para as quais não possua
                  autorização.
                </li>
                <li>Compartilhar credenciais de acesso.</li>
                <li>
                  Praticar engenharia reversa, cópia, extração de código,
                  tentativa de acesso ao banco de dados, automação indevida,
                  raspagem de dados ou qualquer tentativa de violar a segurança
                  da plataforma.
                </li>
                <li>
                  Sobrecarregar, interferir, comprometer ou tentar prejudicar o
                  funcionamento do MedTurn.
                </li>
                <li>
                  Inserir dados de pacientes, dados clínicos assistenciais,
                  prontuários, diagnósticos, prescrições, exames ou informações
                  sensíveis desnecessárias à finalidade do MedTurn.
                </li>
                <li>
                  Usar a plataforma para envio de spam, mensagens indevidas,
                  assédio, conteúdo ofensivo ou comunicação alheia à finalidade
                  operacional da plataforma.
                </li>
              </ul>
            </Section>

            <Section
              number="09"
              title="Escalas, plantões e disponibilidade"
              icon={<CalendarDays className="w-5 h-5" />}
            >
              <p>
                O MedTurn poderá permitir a visualização, organização, consulta
                ou registro de escalas médicas, plantões e disponibilidades.
              </p>

              <p className="mt-4">
                As informações exibidas na plataforma dependem da correta
                inserção, atualização e validação dos dados pela contratante,
                administradores, coordenadores ou usuários autorizados.
              </p>

              <p className="mt-4">
                O usuário deve consultar regularmente a plataforma, acompanhar
                suas escalas, plantões, solicitações, aprovações, notificações e
                demais informações operacionais relevantes.
              </p>

              <p className="mt-4">
                O MedTurn não substitui comunicações oficiais da contratante,
                documentos formais de escala ou canais institucionais
                obrigatórios.
              </p>
            </Section>

            <Section
              number="10"
              title="Trocas, ofertas e movimentações de plantão"
              icon={<Repeat className="w-5 h-5" />}
            >
              <p>
                O MedTurn poderá permitir solicitações de troca de plantão,
                ofertas direcionadas, oportunidades internas de plantão,
                marketplace interno ou outras movimentações operacionais.
              </p>

              <p className="mt-4">
                Toda troca, oferta, solicitação ou movimentação dependerá das
                regras da contratante e, quando aplicável, da aprovação da
                coordenação, administrador ou responsável autorizado.
              </p>

              <p className="mt-4">
                O envio de solicitação, aceite preliminar ou manifestação dentro
                da plataforma não garante aprovação, reconhecimento,
                homologação, remuneração ou execução da troca.
              </p>

              <p className="mt-4">
                A aprovação final, recusa, validação, comunicação, conferência e
                execução prática das escalas e trocas são de responsabilidade
                exclusiva da contratante.
              </p>
            </Section>

            <Section
              number="11"
              title="Notificações e comunicações"
              icon={<Bell className="w-5 h-5" />}
            >
              <p>
                O MedTurn poderá enviar notificações, alertas, mensagens,
                comunicados internos ou avisos operacionais.
              </p>

              <p className="mt-4">
                O funcionamento de notificações depende de fatores externos,
                incluindo conexão à internet, permissões do dispositivo,
                configurações do usuário, sistema operacional, navegadores,
                serviços Apple, serviços Google, servidores, bloqueios
                institucionais e disponibilidade de terceiros.
              </p>

              <p className="mt-4">
                A ausência, atraso ou falha no recebimento de notificações não
                isenta o usuário de consultar a plataforma, verificar sua
                escala, acompanhar solicitações, conferir aprovações e cumprir
                suas obrigações perante a contratante.
              </p>

              <p className="mt-4">
                O envio, disponibilização ou registro de notificação pela
                plataforma não constitui, por si só, comprovação definitiva de
                ciência, leitura, concordância ou aceite pelo destinatário.
              </p>
            </Section>

            <Section
              number="12"
              title="Relatórios de produção"
              icon={<ClipboardList className="w-5 h-5" />}
            >
              <p>
                O MedTurn poderá exibir relatórios auxiliares de produção,
                plantões, escalas, movimentações, confirmações ou demais dados
                operacionais.
              </p>

              <p className="mt-4">
                Esses relatórios possuem natureza auxiliar, operacional e
                informativa.
              </p>

              <p className="mt-4">
                Os relatórios do MedTurn não constituem folha de pagamento,
                ordem de pagamento, documento definitivo de quitação, auditoria
                financeira, comprovante oficial de presença, obrigação contábil,
                fiscal, trabalhista ou contratual.
              </p>

              <p className="mt-4">
                Cabe exclusivamente à contratante validar dados, regras,
                valores, plantões, escalas, aprovações, critérios de produção e
                eventuais pagamentos antes de qualquer quitação, prestação de
                contas ou utilização administrativa.
              </p>

              <p className="mt-4">
                O usuário reconhece que divergências financeiras, pagamentos,
                glosas, critérios de produção ou validações administrativas
                devem ser tratados diretamente com a contratante, conforme suas
                regras internas.
              </p>
            </Section>

            <Section
              number="13"
              title="Verificador de conflitos"
              icon={<AlertTriangle className="w-5 h-5" />}
            >
              <p>
                O MedTurn poderá disponibilizar ferramenta auxiliar de
                verificação de possíveis conflitos, sobreposições ou
                inconsistências de escala.
              </p>

              <p className="mt-4">
                O verificador de conflitos depende da completude, atualização e
                correção dos dados inseridos na plataforma.
              </p>

              <p className="mt-4">
                O MedTurn não garante a inexistência absoluta de conflitos,
                duplicidades, sobreposições ou inconsistências, especialmente
                quando decorrentes de dados incompletos, alterações externas,
                decisões administrativas, permissões concedidas ou aprovações
                realizadas por usuários autorizados.
              </p>

              <p className="mt-4">
                A análise, correção, aceitação ou manutenção de conflitos
                eventualmente apontados é responsabilidade da contratante.
              </p>
            </Section>

            <Section
              number="14"
              title="Confirmação auxiliar de presença"
              icon={<Clock className="w-5 h-5" />}
            >
              <p>
                O MedTurn poderá disponibilizar funcionalidade de confirmação
                auxiliar de presença, assunção de plantão, check-in
                declaratório ou mecanismo equivalente.
              </p>

              <p className="mt-4">
                Essa funcionalidade tem finalidade exclusivamente operacional,
                auxiliar, declaratória e informativa, destinada a apoiar a
                visualização de profissionais que informaram sua chegada,
                presença inicial ou assunção de determinado plantão.
              </p>

              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100 flex items-start">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-amber-900">
                  A confirmação auxiliar de presença não constitui controle
                  oficial de ponto, controle definitivo de jornada, registro
                  trabalhista, comprovação absoluta de frequência, documento de
                  quitação, critério automático de pagamento, mecanismo
                  disciplinar automático ou substituto dos controles
                  administrativos próprios da contratante.
                </p>
              </div>

              <p className="mt-4">
                A confirmação realizada pelo usuário não presume, por si só,
                existência de vínculo empregatício, subordinação jurídica,
                controle de jornada, habitualidade, pessoalidade ou qualquer
                elemento caracterizador de relação de emprego entre o usuário e
                a contratante, especialmente quando se tratar de profissional
                autônomo, pessoa jurídica, prestador de serviço ou cooperado.
              </p>

              <p className="mt-4">
                A ausência de confirmação na plataforma não implica, por si só,
                ausência ao plantão, falta funcional, descumprimento contratual,
                glosa, penalidade, advertência ou perda automática de direito a
                pagamento.
              </p>

              <p className="mt-4">
                A confirmação de presença, quando utilizada, limita-se ao
                registro operacional de chegada, presença inicial ou assunção do
                plantão, não tendo por finalidade medir duração de jornada,
                fiscalizar permanência, controlar saída, apurar horas
                trabalhadas ou substituir sistemas formais de controle de
                frequência eventualmente adotados pela contratante.
              </p>

              <p className="mt-4">
                Caso a funcionalidade utilize recursos adicionais, como
                geolocalização, janela de horário, validação por dispositivo,
                registros de acesso ou mecanismos semelhantes, tais recursos
                terão finalidade exclusivamente auxiliar e operacional,
                dependendo de disponibilidade técnica, permissões do
                dispositivo, conexão à internet e configurações do usuário.
              </p>

              <p className="mt-4">
                A contratante será responsável por definir internamente se,
                como e para quais finalidades administrativas utilizará os
                registros de confirmação de presença, observada a legislação
                aplicável, os contratos mantidos com seus profissionais e sua
                própria governança interna.
              </p>
            </Section>

            <Section
              number="15"
              title="Dados inseridos pelo usuário"
              icon={<Database className="w-5 h-5" />}
            >
              <p>
                O usuário é responsável pela veracidade, atualização e correção
                das informações que inserir ou confirmar na plataforma.
              </p>

              <p className="mt-4">
                Isso inclui, quando aplicável, dados de disponibilidade,
                solicitações de troca, aceite de plantões, mensagens,
                confirmações, justificativas, registros operacionais e demais
                informações de uso.
              </p>

              <p className="mt-4">
                O usuário não deve inserir dados de pacientes, dados clínicos
                assistenciais, prontuários, diagnósticos, prescrições, exames ou
                informações sensíveis de pacientes no MedTurn.
              </p>

              <p className="mt-4">
                Caso o usuário identifique erro, inconsistência ou informação
                incorreta, deverá comunicar a contratante ou o responsável
                administrativo indicado.
              </p>
            </Section>

            <Section number="16" title="Tratamento de dados pessoais">
              <p>
                O MedTurn poderá tratar dados pessoais necessários ao
                funcionamento da plataforma, tais como nome, e-mail, hospital
                vinculado, perfil de acesso, plantões, solicitações de troca,
                registros de disponibilidade, ações realizadas na plataforma,
                logs operacionais e dados necessários ao cálculo auxiliar de
                produção.
              </p>

              <p className="mt-4">
                O MedTurn não tem por finalidade tratar dados de pacientes,
                dados clínicos assistenciais, prontuários, diagnósticos,
                prescrições, exames ou informações sensíveis de pacientes.
              </p>

              <p className="mt-4">
                A contratante atua, em regra, como controladora dos dados
                pessoais tratados no uso da plataforma, sendo responsável por
                definir finalidades, permissões, usuários, regras
                administrativas, retenção, governança e atendimento aos direitos
                dos titulares, quando aplicável.
              </p>

              <p className="mt-4">
                A contratada atua, em regra, como operadora dos dados pessoais
                tratados na plataforma por conta da contratante, exclusivamente
                para fins de hospedagem, manutenção, disponibilização, suporte,
                segurança, correção e funcionamento regular do MedTurn.
              </p>

              <p className="mt-4">
                O tratamento de dados pessoais será detalhado na Política de
                Privacidade do MedTurn.
              </p>
            </Section>

            <Section number="17" title="Logs e rastreabilidade">
              <p>
                A plataforma poderá registrar logs técnicos e operacionais,
                incluindo acessos, alterações, aprovações, recusas,
                solicitações, confirmações, mensagens, eventos de segurança e
                demais ações relevantes.
              </p>

              <p className="mt-4">
                Os logs têm finalidade de segurança, suporte, rastreabilidade,
                auditoria operacional, melhoria do serviço e funcionamento da
                plataforma.
              </p>

              <p className="mt-4">
                Os logs da plataforma não substituem controles administrativos
                próprios da contratante nem constituem, isoladamente, prova
                absoluta de presença, jornada, frequência, vínculo,
                subordinação, pagamento, ciência ou aceite.
              </p>
            </Section>

            <Section number="18" title="Disponibilidade, manutenções e terceiros">
              <p>
                O MedTurn opera por meio de infraestrutura em nuvem,
                autenticação de usuários, banco de dados remoto, aplicações web,
                serviços de notificação e outros recursos tecnológicos
                necessários ao seu funcionamento.
              </p>

              <p className="mt-4">
                A plataforma poderá depender de provedores terceiros para
                hospedagem, autenticação, banco de dados, armazenamento,
                notificações, monitoramento, distribuição de aplicativo, e-mail
                transacional e serviços correlatos.
              </p>

              <p className="mt-4">
                O MedTurn poderá passar por manutenções programadas,
                atualizações, ajustes de segurança ou melhorias técnicas,
                preferencialmente em horários de menor impacto.
              </p>

              <p className="mt-4">
                Falhas, manutenções, indisponibilidades, alterações de política,
                bloqueios, limitações ou incidentes em serviços de terceiros
                podem impactar temporariamente o funcionamento da plataforma.
              </p>

              <p className="mt-4">
                O MedTurn não garante funcionamento ininterrupto, ausência
                absoluta de falhas, disponibilidade permanente, imunidade contra
                ataques ou compatibilidade com todos os dispositivos,
                navegadores e sistemas operacionais.
              </p>
            </Section>

            <Section number="19" title="Suporte">
              <p>
                O suporte técnico ordinário será prestado prioritariamente aos
                responsáveis indicados pela contratante, administradores ou
                coordenadores autorizados.
              </p>

              <p className="mt-4">
                Usuários médicos deverão, preferencialmente, encaminhar dúvidas
                operacionais, correções de escala, divergências de produção,
                problemas de permissão, solicitações de acesso ou assuntos
                administrativos aos responsáveis indicados pela contratante.
              </p>

              <p className="mt-4">
                O suporte do MedTurn refere-se a dúvidas técnicas de uso,
                falhas, configurações e funcionamento da plataforma, não
                incluindo execução de rotinas administrativas da contratante,
                elaboração de escalas, conferência de produção, validação de
                pagamentos, gestão operacional de equipes ou tomada de decisões
                administrativas.
              </p>
            </Section>

            <Section
              number="20"
              title="Propriedade intelectual"
              icon={<Lock className="w-5 h-5" />}
            >
              <p>
                O MedTurn, incluindo seu nome, marca, código-fonte, estrutura
                lógica, modelo de dados, interfaces gráficas, rotinas,
                algoritmos, documentação técnica, banco de dados estrutural,
                fluxos operacionais, design, funcionalidades, metodologias de
                desenvolvimento e know-how técnico, é de titularidade exclusiva
                da contratada.
              </p>

              <p className="mt-4">
                O uso da plataforma pelo usuário não transfere qualquer direito
                de propriedade intelectual, titularidade, código-fonte,
                know-how, marca, interface, documentação ou componente
                integrante do MedTurn.
              </p>

              <p className="mt-4">
                É proibido copiar, reproduzir, modificar, adaptar, traduzir,
                distribuir, sublicenciar, vender, explorar comercialmente,
                realizar engenharia reversa, descompilar, desmontar, extrair
                código, acessar indevidamente banco de dados ou tentar obter
                documentação técnica interna do MedTurn.
              </p>

              <p className="mt-4">
                Também é proibido utilizar informações confidenciais, fluxos
                proprietários, know-how, lógica de funcionamento, materiais
                internos, interfaces ou estrutura operacional do MedTurn para
                copiar, reproduzir, desenvolver, contratar ou viabilizar
                plataforma substancialmente similar.
              </p>
            </Section>

            <Section number="21" title="Condutas proibidas">
              <p className="mb-3">
                Além de outras restrições previstas nestes Termos, o usuário não
                poderá:
              </p>

              <ul className="space-y-2 list-disc pl-5 marker:text-blue-500">
                <li>Acessar ou tentar acessar conta de outro usuário.</li>
                <li>
                  Usar dados da plataforma fora da finalidade autorizada pela
                  contratante.
                </li>
                <li>
                  Divulgar informações internas, escalas, dados de usuários,
                  relatórios ou comunicações sem autorização.
                </li>
                <li>
                  Tentar burlar controles de acesso, permissões ou autenticação.
                </li>
                <li>
                  Inserir dados falsos, ofensivos, ilícitos ou incompatíveis com
                  a finalidade da plataforma.
                </li>
                <li>
                  Compartilhar prints, relatórios ou informações internas de
                  forma indevida.
                </li>
                <li>
                  Utilizar a plataforma para constranger, expor, assediar,
                  discriminar ou prejudicar outro usuário.
                </li>
                <li>
                  Utilizar robôs, scripts, automações não autorizadas, raspagem
                  de dados ou qualquer mecanismo de extração indevida.
                </li>
                <li>
                  Interferir no funcionamento da plataforma ou tentar
                  comprometer sua segurança.
                </li>
                <li>
                  Utilizar o MedTurn para finalidade diversa da gestão
                  operacional de escalas, plantões, disponibilidade, trocas,
                  notificações e relatórios autorizados.
                </li>
              </ul>
            </Section>

            <Section number="22" title="Suspensão ou restrição de acesso">
              <p>O acesso do usuário poderá ser suspenso, restringido ou encerrado nas seguintes hipóteses:</p>

              <ul className="mt-3 space-y-2 list-disc pl-5 marker:text-blue-500">
                <li>Solicitação da contratante.</li>
                <li>Desligamento, substituição ou perda de autorização do usuário.</li>
                <li>Violação destes Termos de Uso.</li>
                <li>Uso indevido da plataforma.</li>
                <li>
                  Suspeita de acesso não autorizado, fraude, risco de segurança
                  ou violação de dados.
                </li>
                <li>
                  Inadimplência, suspensão ou encerramento do contrato entre a
                  contratante e a contratada.
                </li>
                <li>Necessidade técnica, legal, regulatória ou de segurança.</li>
              </ul>

              <p className="mt-4">
                A suspensão ou encerramento de acesso não elimina registros já
                realizados na plataforma, que poderão ser mantidos conforme
                contrato, legislação aplicável, Política de Privacidade e
                necessidades legítimas de segurança, rastreabilidade e operação.
              </p>
            </Section>

            <Section number="23" title="Limitação de responsabilidade">
              <p>
                O MedTurn é fornecido em sua versão vigente, cabendo à
                contratante verificar sua adequação às rotinas, normas internas,
                obrigações contratuais, fluxos administrativos e necessidades
                operacionais.
              </p>

              <p className="mt-4">
                A contratada não se responsabiliza por decisões administrativas,
                escalas aprovadas, trocas autorizadas, plantões não cumpridos,
                pagamentos realizados, critérios internos de produção,
                interpretações de relatórios, atos de coordenação ou qualquer
                uso fora da finalidade da plataforma.
              </p>

              <p className="mt-4 mb-3">A contratada não será responsável por:</p>

              <ul className="space-y-2 list-disc pl-5 marker:text-blue-500">
                <li>
                  Falhas de infraestrutura da contratante ou do usuário,
                  incluindo internet, rede elétrica, dispositivos,
                  computadores, celulares, navegadores, sistemas operacionais,
                  bloqueios institucionais ou permissões desativadas.
                </li>
                <li>
                  Problemas decorrentes de erro do usuário, uso indevido, dados
                  incorretos, omissões, aprovações equivocadas ou falha de
                  conferência administrativa.
                </li>
                <li>Indisponibilidade, limitação ou falha de provedores terceiros.</li>
                <li>Falhas em notificações por fatores externos à plataforma.</li>
                <li>
                  Consequências decorrentes da utilização de relatórios
                  auxiliares sem validação pela contratante.
                </li>
                <li>
                  Condutas, ausências, atrasos, inadimplementos,
                  descumprimentos ou omissões praticados por médicos,
                  coordenadores, administradores, prepostos ou terceiros
                  vinculados à contratante.
                </li>
                <li>
                  Perda de dados decorrente da ausência de exportação,
                  conferência ou conservação pela contratante, ressalvadas
                  hipóteses de falha comprovadamente atribuível à contratada.
                </li>
                <li>
                  Danos indiretos, lucros cessantes, perda de oportunidade ou
                  prejuízos que não decorram diretamente de ação ou omissão
                  culposa comprovada da contratada.
                </li>
              </ul>
            </Section>

            <Section number="24" title="Alterações na plataforma">
              <p>
                O MedTurn poderá receber atualizações, melhorias, correções,
                alterações de interface, ajustes de fluxo e novas versões, sem
                necessidade de autorização prévia do usuário, desde que
                preservada sua finalidade geral.
              </p>

              <p className="mt-4">
                Funcionalidades poderão variar conforme versão da plataforma,
                hospital/unidade, perfil de acesso, dispositivo, sistema
                operacional, navegador, permissões e configurações da
                contratante.
              </p>

              <p className="mt-4">
                Novas funcionalidades poderão ser disponibilizadas gradualmente,
                em fase de testes ou apenas para determinados perfis, hospitais,
                unidades ou grupos de usuários.
              </p>
            </Section>

            <Section number="25" title="Alterações destes termos">
              <p>
                Estes Termos de Uso poderão ser atualizados periodicamente para
                refletir alterações legais, técnicas, operacionais, contratuais
                ou evoluções da plataforma.
              </p>

              <p className="mt-4">
                A versão atualizada poderá ser disponibilizada no aplicativo, na
                plataforma web ou por outro meio eletrônico.
              </p>

              <p className="mt-4">
                O uso contínuo da plataforma após a disponibilização de nova
                versão dos Termos poderá ser considerado aceite das condições
                atualizadas, observadas as regras aplicáveis e as orientações da
                contratante.
              </p>
            </Section>

            <Section number="26" title="Encerramento de uso">
              <p>
                O acesso do usuário ao MedTurn poderá ser encerrado por
                solicitação da contratante, término do vínculo operacional com a
                contratante, encerramento do contrato de licenciamento, violação
                destes Termos ou necessidade técnica, administrativa, legal ou
                de segurança.
              </p>

              <p className="mt-4">
                Após o encerramento do acesso, o usuário poderá perder acesso às
                informações da plataforma, cabendo à contratante definir os
                meios internos de consulta, arquivamento, exportação ou
                disponibilização de dados, conforme aplicável.
              </p>
            </Section>

            <Section
              number="27"
              title="Comunicações"
              icon={<Mail className="w-5 h-5" />}
            >
              <p>
                Comunicações relacionadas ao uso operacional da plataforma,
                escalas, trocas, produção, permissões, plantões, aprovações,
                pagamentos ou divergências administrativas deverão ser
                direcionadas prioritariamente à contratante, administrador ou
                coordenador responsável.
              </p>

              <p className="mt-4">
                Comunicações técnicas sobre falhas de funcionamento poderão ser
                encaminhadas pelos canais indicados pela contratante ou
                disponibilizados pelo MedTurn.
              </p>

              <p className="mt-4">
                Solicitações de acesso, correção, desativação ou exclusão de
                conta e dados pessoais devem ser encaminhadas prioritariamente à
                contratante, responsável pela gestão dos usuários. Quando
                recebidas pelo MedTurn, poderão ser direcionadas à contratante
                para avaliação e providências cabíveis.
              </p>

              <a
                href="mailto:medturn@outlook.com"
                className="mt-6 inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md text-slate-700 font-medium rounded-lg transition-all duration-200 group"
              >
                <Mail className="w-5 h-5 mr-2 text-slate-400 group-hover:text-blue-500" />
                medturn@outlook.com
              </a>
            </Section>

            <Section number="28" title="Lei aplicável e foro">
              <p>
                Estes Termos serão interpretados de acordo com as leis da
                República Federativa do Brasil, incluindo o Código Civil, a Lei
                de Direitos Autorais, a Lei do Software e a Lei Geral de
                Proteção de Dados Pessoais.
              </p>

              <p className="mt-4">
                Eventuais controvérsias relacionadas ao contrato principal de
                licenciamento serão tratadas conforme o instrumento firmado
                entre a contratante e a contratada.
              </p>

              <p className="mt-4">
                Em relação ao usuário final, eventuais questões serão tratadas
                conforme a legislação aplicável, a natureza da relação mantida
                entre o usuário e a contratante e as regras contratuais
                pertinentes.
              </p>
            </Section>

            <Section number="29" title="Declaração do usuário">
              <p>Ao acessar ou utilizar o MedTurn, o usuário declara que:</p>

              <ul className="mt-3 space-y-2 list-disc pl-5 marker:text-blue-500">
                <li>Leu, compreendeu e aceita estes Termos de Uso.</li>
                <li>Utilizará a plataforma apenas para as finalidades autorizadas.</li>
                <li>Manterá suas credenciais em sigilo.</li>
                <li>
                  Não inserirá dados de pacientes ou informações clínicas
                  sensíveis na plataforma.
                </li>
                <li>
                  Reconhece que o MedTurn é ferramenta auxiliar, operacional e
                  informativa.
                </li>
                <li>
                  Reconhece que escalas, trocas, produção, pagamentos, presença,
                  frequência, jornada e demais decisões administrativas dependem
                  da validação da contratante.
                </li>
                <li>
                  Reconhece que notificações, relatórios, conflitos e
                  confirmações auxiliares não substituem controles
                  administrativos próprios da contratante.
                </li>
              </ul>
            </Section>
          </div>
        </div>

        <footer className="mt-12 text-center border-t border-slate-200 pt-8">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} MedTurn. Todos os direitos reservados.
          </p>
        </footer>
      </main>
    </div>
  );
}

function Section({
  number,
  title,
  children,
  icon,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <section className="p-8 md:p-10 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-center mb-4">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mr-3">
          {number}
        </span>

        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          {title}
          {icon && <span className="text-slate-300">{icon}</span>}
        </h2>
      </div>

      <div className="pl-11 text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}