import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Mail,
  ArrowLeft,
  Lock,
  FileText,
  Server,
  Users,
  Bell,
  MapPin,
  Database,
  Clock,
  AlertTriangle,
} from 'lucide-react';

// Metadados para SEO (Next.js App Router)
export const metadata = {
  title: 'Política de Privacidade | MedTurn',
  description:
    'Saiba como o MedTurn trata dados pessoais de usuários na gestão de escalas médicas, plantões, trocas, disponibilidade e relatórios operacionais.',
};

export default function PrivacyPage() {
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
        {/* Cabeçalho do Documento */}
        <div className="text-center mb-12 mt-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-6 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Política de Privacidade
          </h1>

          <p className="text-slate-500 text-lg">
            Como o MedTurn trata e protege dados pessoais no uso da plataforma.
          </p>

          <div className="mt-4 inline-block px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-500 shadow-sm">
            Última atualização: 10 de maio de 2026
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-100">
            <Section
              number="01"
              title="Sobre o MedTurn"
              icon={<FileText className="w-5 h-5" />}
            >
              <p>
                O <strong>MedTurn</strong> é uma plataforma digital auxiliar de
                gestão operacional de escalas médicas, plantões,
                disponibilidade, solicitações de troca, ofertas de plantão,
                notificações, visualização de conflitos, confirmação auxiliar
                de presença e relatórios operacionais.
              </p>

              <p className="mt-4">
                A plataforma é utilizada por médicos, coordenadores,
                administradores e demais usuários autorizados por uma empresa,
                grupo médico, hospital, instituição ou unidade contratante.
              </p>

              <p className="mt-4">
                Ao baixar, acessar, realizar login ou utilizar o MedTurn, o
                usuário declara estar ciente desta Política de Privacidade e
                concordar com os Termos de Uso aplicáveis à plataforma,
                observadas as regras e permissões definidas pela contratante.
              </p>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start">
                <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  <strong>Importante:</strong> o MedTurn possui finalidade
                  administrativa e operacional. A plataforma não tem por
                  finalidade tratar dados de pacientes, prontuários, exames,
                  diagnósticos, prescrições ou informações clínicas
                  assistenciais.
                </p>
              </div>
            </Section>

            <Section
              number="02"
              title="Quem é responsável pelos dados"
              icon={<Users className="w-5 h-5" />}
            >
              <p>
                Para fins da Lei Geral de Proteção de Dados Pessoais – LGPD, a
                empresa, grupo médico, hospital, instituição ou unidade que
                contrata o MedTurn atua, em regra, como{' '}
                <strong>controladora</strong> dos dados pessoais tratados na
                plataforma.
              </p>

              <p className="mt-4">
                Isso significa que a contratante define as finalidades de uso,
                os usuários autorizados, permissões, regras administrativas,
                escalas, plantões, critérios operacionais e demais formas de
                utilização da plataforma.
              </p>

              <p className="mt-4">
                O MedTurn atua, em regra, como <strong>operador</strong> dos
                dados pessoais tratados na plataforma por conta da contratante,
                exclusivamente para fins de hospedagem, manutenção,
                disponibilização, suporte, segurança, correção e funcionamento
                regular da plataforma.
              </p>

              <p className="mt-4">
                Em situações específicas, como dados de representantes da
                contratante para fins contratuais, administrativos, financeiros,
                comerciais ou de suporte, o MedTurn poderá atuar como
                controlador desses dados não sensíveis.
              </p>
            </Section>

            <Section
              number="03"
              title="Dados pessoais tratados"
              icon={<Database className="w-5 h-5" />}
            >
              <p className="mb-4">
                O MedTurn poderá tratar dados pessoais necessários ao
                funcionamento da plataforma, conforme o uso realizado pela
                contratante e seus usuários.
              </p>

              <ul className="grid sm:grid-cols-2 gap-3">
                <ListItem>Nome completo</ListItem>
                <ListItem>E-mail</ListItem>
                <ListItem>Hospital ou unidade vinculada</ListItem>
                <ListItem>Perfil de acesso</ListItem>
                <ListItem>Escalas e plantões</ListItem>
                <ListItem>Disponibilidade médica</ListItem>
                <ListItem>Solicitações de troca</ListItem>
                <ListItem>Ofertas de plantão</ListItem>
                <ListItem>Aprovações e recusas</ListItem>
                <ListItem>Mensagens ou comunicados internos</ListItem>
                <ListItem>Confirmação auxiliar de presença</ListItem>
                <ListItem>Logs técnicos e operacionais</ListItem>
                <ListItem>Dados para cálculo auxiliar de produção</ListItem>
                <ListItem>Informações de dispositivo e acesso</ListItem>
              </ul>
            </Section>

            <Section
              number="04"
              title="Dados que não devem ser inseridos"
              icon={<AlertTriangle className="w-5 h-5" />}
            >
              <p>
                O MedTurn não foi desenvolvido para armazenar ou tratar dados
                clínicos de pacientes. O usuário não deve inserir na plataforma
                dados como nome de paciente, número de prontuário, diagnóstico,
                prescrição, exame, informação assistencial ou qualquer dado de
                saúde de paciente.
              </p>

              <p className="mt-4">
                Caso algum usuário insira indevidamente dados de pacientes ou
                informações sensíveis na plataforma, a responsabilidade por essa
                inserção poderá ser atribuída ao usuário e/ou à contratante,
                conforme o caso, sem prejuízo das medidas técnicas cabíveis para
                correção, exclusão ou restrição do dado.
              </p>
            </Section>

            <Section number="05" title="Finalidades do tratamento">
              <p className="mb-4">
                Os dados pessoais tratados no MedTurn poderão ser utilizados
                para as seguintes finalidades:
              </p>

              <ul className="space-y-2 list-disc pl-5 marker:text-blue-500">
                <li>Criar, autenticar e gerenciar contas de usuários.</li>
                <li>Permitir acesso à plataforma.</li>
                <li>Vincular usuários a hospitais, unidades ou grupos.</li>
                <li>Organizar e exibir escalas médicas e plantões.</li>
                <li>Registrar disponibilidade médica.</li>
                <li>Permitir solicitações de troca e ofertas de plantão.</li>
                <li>Permitir aprovações, recusas e movimentações operacionais.</li>
                <li>Exibir possíveis conflitos de escala.</li>
                <li>Enviar notificações, alertas e comunicações operacionais.</li>
                <li>Exibir relatórios auxiliares de produção.</li>
                <li>
                  Registrar confirmação auxiliar de presença, assunção de
                  plantão ou check-in declaratório, quando disponível.
                </li>
                <li>Gerar logs técnicos e operacionais.</li>
                <li>Garantir segurança, rastreabilidade e prevenção de uso indevido.</li>
                <li>Prestar suporte técnico.</li>
                <li>Corrigir falhas, melhorar funcionalidades e manter a plataforma.</li>
                <li>Cumprir obrigações legais, regulatórias ou contratuais.</li>
              </ul>
            </Section>

            <Section number="06" title="Bases legais de tratamento">
              <p>
                O tratamento de dados pessoais no MedTurn poderá se fundamentar,
                conforme o caso, nas bases legais previstas na LGPD, incluindo
                execução de contrato, cumprimento de obrigação legal ou
                regulatória, legítimo interesse, exercício regular de direitos e
                proteção da segurança da plataforma, dos usuários e das
                informações tratadas.
              </p>

              <p className="mt-4">
                A definição da base legal adequada para cada operação de
                tratamento realizada pela contratante no uso da plataforma é
                responsabilidade da própria contratante, na qualidade de
                controladora dos dados.
              </p>
            </Section>

            <Section
              number="07"
              title="Confirmação auxiliar de presença"
              icon={<Clock className="w-5 h-5" />}
            >
              <p>
                O MedTurn poderá disponibilizar funcionalidade de confirmação
                auxiliar de presença, assunção de plantão, check-in declaratório
                ou mecanismo equivalente.
              </p>

              <p className="mt-4">
                Quando utilizada, essa funcionalidade poderá tratar dados como
                identificação do usuário, hospital ou unidade vinculada, plantão
                associado, data e horário da confirmação, status da confirmação
                e registros técnicos de acesso.
              </p>

              <p className="mt-4">
                Essa funcionalidade possui finalidade operacional, declaratória
                e informativa, destinada a apoiar a visualização de
                profissionais que informaram chegada, presença inicial ou
                assunção de determinado plantão.
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
            </Section>

            <Section
              number="08"
              title="Geolocalização e permissões"
              icon={<MapPin className="w-5 h-5" />}
            >
              <p>
                O MedTurn poderá, em funcionalidades atuais ou futuras, solicitar
                permissões do dispositivo para viabilizar determinados recursos,
                como notificações, funcionamento como aplicativo ou eventual
                confirmação auxiliar de presença com recurso de localização.
              </p>

              <p className="mt-4">
                Quando houver uso de geolocalização, o usuário será informado
                pelo próprio sistema operacional ou pela plataforma, e o uso
                dependerá das permissões concedidas no dispositivo.
              </p>

              <p className="mt-4">
                A eventual geolocalização, se utilizada, terá finalidade
                exclusivamente auxiliar e operacional, não substituindo
                validação, conferência ou decisão administrativa da contratante.
              </p>

              <p className="mt-4">
                O usuário poderá gerenciar permissões diretamente nas
                configurações do seu dispositivo ou navegador. A desativação de
                permissões poderá limitar ou impedir o funcionamento de
                determinadas funcionalidades.
              </p>
            </Section>

            <Section
              number="09"
              title="Notificações"
              icon={<Bell className="w-5 h-5" />}
            >
              <p>
                O MedTurn poderá enviar notificações, alertas, mensagens ou
                comunicados operacionais relacionados a escalas, plantões,
                trocas, aprovações, oportunidades, disponibilidade, confirmação
                de presença, conflitos ou informações administrativas.
              </p>

              <p className="mt-4">
                O funcionamento das notificações depende de fatores externos,
                como conexão à internet, permissões do dispositivo, sistema
                operacional, navegador, serviços Apple, serviços Google,
                provedores de notificação, servidores e configurações do
                usuário.
              </p>

              <p className="mt-4">
                A ausência, atraso ou falha no recebimento de notificações não
                impede que o usuário consulte diretamente a plataforma para
                verificar informações relevantes.
              </p>

              <p className="mt-4">
                O envio ou registro de notificação não constitui, por si só,
                comprovação definitiva de ciência, leitura, concordância ou
                aceite pelo usuário.
              </p>
            </Section>

            <Section number="10" title="Logs técnicos e operacionais">
              <p>
                A plataforma poderá registrar logs técnicos e operacionais para
                segurança, suporte, rastreabilidade, auditoria operacional,
                melhoria do serviço e funcionamento da plataforma.
              </p>

              <p className="mt-4">
                Esses logs podem incluir data e horário de acesso, usuário
                autenticado, IP ou identificadores técnicos, dispositivo,
                navegador, sistema operacional, ações realizadas na plataforma,
                solicitações de troca, registros de disponibilidade,
                confirmações auxiliares de presença, notificações, erros
                técnicos e eventos de segurança.
              </p>

              <p className="mt-4">
                Os logs não substituem controles administrativos próprios da
                contratante nem constituem, isoladamente, prova absoluta de
                presença, jornada, frequência, vínculo, subordinação, pagamento,
                ciência ou aceite.
              </p>
            </Section>

            <Section number="11" title="Compartilhamento de dados">
              <p>
                Os dados pessoais tratados no MedTurn poderão ser acessados ou
                compartilhados, conforme necessário, com a contratante,
                administradores e coordenadores autorizados, usuários
                autorizados conforme perfil de acesso, provedores de hospedagem,
                banco de dados, autenticação, notificações, monitoramento,
                segurança, suporte, e-mail transacional e autoridades públicas,
                quando houver obrigação legal ou ordem válida.
              </p>

              <p className="mt-4">
                O compartilhamento é realizado na medida necessária para
                operação, segurança, suporte, manutenção, cumprimento contratual
                e atendimento às finalidades da plataforma.
              </p>
            </Section>

            <Section
              number="12"
              title="Suboperadores e terceiros"
              icon={<Server className="w-5 h-5" />}
            >
              <p>
                Para disponibilizar o MedTurn, poderão ser utilizados provedores
                terceiros e suboperadores necessários à execução dos serviços,
                incluindo hospedagem, autenticação, banco de dados,
                notificações, monitoramento, distribuição de aplicação, e-mail
                transacional e serviços correlatos.
              </p>

              <p className="mt-4">
                Esses provedores podem tratar dados pessoais em nome da
                contratada e/ou da contratante, conforme a finalidade do serviço
                prestado.
              </p>

              <p className="mt-4">
                A contratada buscará utilizar fornecedores compatíveis com boas
                práticas de mercado e com medidas adequadas de segurança, sem
                que isso implique garantia absoluta de disponibilidade, ausência
                de falhas, imunidade contra ataques ou funcionamento
                ininterrupto.
              </p>
            </Section>

            <Section number="13" title="Transferência internacional de dados">
              <p>
                Os dados tratados pelo MedTurn poderão ser armazenados,
                processados ou transitados em servidores localizados fora do
                território nacional, em razão da utilização de provedores
                terceiros de infraestrutura em nuvem, autenticação, banco de
                dados, notificações e serviços correlatos.
              </p>

              <p className="mt-4">
                Nesses casos, serão utilizados provedores ou mecanismos
                compatíveis com as hipóteses previstas na LGPD para
                transferência internacional de dados, incluindo garantias
                contratuais, certificações, normas corporativas ou outros
                instrumentos aplicáveis.
              </p>
            </Section>

            <Section
              number="14"
              title="Segurança da informação"
              icon={<Lock className="w-5 h-5" />}
            >
              <p>
                A contratada adota medidas técnicas e organizacionais razoáveis
                para proteção da plataforma e dos dados nela tratados,
                considerando a natureza dos serviços prestados.
              </p>

              <p className="mt-4">
                Essas medidas podem incluir autenticação de usuários, controle
                de permissões por perfil, segregação de acessos, registros de
                logs, monitoramento técnico, rotinas de backup, redundância ou
                recuperação compatíveis com a natureza da plataforma, uso de
                provedores especializados, atualização e manutenção técnica e
                medidas de prevenção contra acessos indevidos.
              </p>

              <p className="mt-4">
                Apesar dos esforços de segurança, nenhum sistema é absolutamente
                imune a falhas, ataques, indisponibilidades ou incidentes.
              </p>
            </Section>

            <Section number="15" title="Incidentes de segurança">
              <p>
                Em caso de incidente de segurança relevante envolvendo dados
                pessoais tratados na plataforma e que seja de conhecimento da
                contratada, a contratante será comunicada no prazo contratual
                aplicável, contado a partir da confirmação técnica do incidente.
              </p>

              <p className="mt-4">
                Meras suspeitas não confirmadas poderão ser objeto de apuração
                interna antes de eventual comunicação formal.
              </p>

              <p className="mt-4">
                Caberá à contratante, na qualidade de controladora dos dados
                pessoais, avaliar a necessidade e realizar comunicações à
                Autoridade Nacional de Proteção de Dados, aos titulares dos
                dados ou a quaisquer terceiros, conforme a legislação aplicável.
              </p>
            </Section>

            <Section number="16" title="Retenção e exclusão de dados">
              <p>
                Os dados pessoais serão mantidos pelo período necessário ao
                cumprimento das finalidades da plataforma, às obrigações
                contratuais, legais, regulatórias, administrativas, de
                segurança, auditoria operacional ou exercício regular de
                direitos.
              </p>

              <p className="mt-4">
                Após o término do contrato entre contratante e contratada, os
                dados poderão ficar disponíveis por prazo determinado para
                consulta, exportação ou download, conforme contrato aplicável.
                Após esse prazo, os dados poderão ser excluídos, anonimizados,
                restringidos ou tornados indisponíveis, salvo obrigação legal,
                ordem de autoridade competente ou acordo escrito em sentido
                diverso.
              </p>
            </Section>

            <Section number="17" title="Exportação e conservação de dados">
              <p>
                A contratante é responsável por exportar, conferir, arquivar e
                conservar os dados, relatórios, escalas e informações que sejam
                necessários às suas obrigações administrativas, contratuais,
                fiscais, trabalhistas ou regulatórias.
              </p>

              <p className="mt-4">
                O usuário final deverá solicitar à contratante, quando
                necessário, acesso a históricos, relatórios, documentos ou
                informações relacionadas a escalas, plantões, produção,
                confirmações ou registros operacionais.
              </p>

              <p className="mt-4">
                O MedTurn não substitui arquivos oficiais, documentos
                institucionais, controles internos ou sistemas administrativos
                próprios da contratante.
              </p>
            </Section>

            <Section number="18" title="Direitos dos titulares">
              <p>
                Nos termos da LGPD, o usuário, enquanto titular de dados
                pessoais, poderá ter direitos relacionados a seus dados,
                incluindo confirmação da existência de tratamento, acesso,
                correção, anonimização, bloqueio ou eliminação de dados
                desnecessários ou excessivos, portabilidade quando aplicável,
                informação sobre compartilhamento, revogação de consentimento
                quando aplicável, oposição a tratamento irregular e revisão de
                decisões automatizadas, quando aplicável.
              </p>

              <p className="mt-4">
                Como a contratante atua, em regra, como controladora dos dados
                pessoais tratados na plataforma, solicitações relacionadas a
                direitos dos titulares devem ser direcionadas preferencialmente
                à contratante ou ao canal indicado por ela.
              </p>

              <p className="mt-4">
                Quando a solicitação for recebida diretamente pela contratada,
                poderá ser encaminhada à contratante para avaliação e resposta,
                conforme a natureza do pedido e as obrigações legais
                aplicáveis.
              </p>
            </Section>

            <Section number="19" title="Responsabilidades do usuário">
              <p className="mb-4">O usuário é responsável por:</p>

              <ul className="space-y-2 list-disc pl-5 marker:text-blue-500">
                <li>Utilizar a plataforma de forma adequada e segura.</li>
                <li>Manter suas credenciais em sigilo.</li>
                <li>Não compartilhar login, senha ou acesso.</li>
                <li>Informar dados corretos e atualizados.</li>
                <li>Não inserir dados de pacientes ou informações clínicas sensíveis.</li>
                <li>Respeitar as permissões de acesso definidas pela contratante.</li>
                <li>Comunicar suspeita de uso indevido, erro relevante ou incidente de segurança.</li>
                <li>Respeitar a confidencialidade de escalas, relatórios, mensagens e dados de colegas.</li>
                <li>Não utilizar informações da plataforma fora das finalidades autorizadas.</li>
                <li>Observar os Termos de Uso e esta Política de Privacidade.</li>
              </ul>
            </Section>

            <Section number="20" title="Responsabilidades da contratante">
              <p>
                A contratante é responsável por definir usuários autorizados,
                gerenciar perfis e permissões, definir finalidades de uso da
                plataforma, validar escalas, plantões, trocas, aprovações,
                conflitos, relatórios e confirmações, definir bases legais
                adequadas para o tratamento de dados, orientar seus usuários,
                atender solicitações de titulares, realizar comunicações à ANPD
                quando necessário e exportar, conferir e conservar dados
                necessários às suas finalidades administrativas, contratuais,
                fiscais, trabalhistas ou regulatórias.
              </p>
            </Section>

            <Section number="21" title="Dados de crianças e adolescentes">
              <p>
                O MedTurn não é destinado a crianças ou adolescentes. A
                plataforma é destinada a profissionais autorizados pela
                contratante, em contexto administrativo e operacional de gestão
                de escalas médicas e plantões.
              </p>
            </Section>

            <Section number="22" title="Alterações desta política">
              <p>
                Esta Política de Privacidade poderá ser atualizada
                periodicamente para refletir alterações legais, técnicas,
                operacionais, contratuais ou evoluções da plataforma.
              </p>

              <p className="mt-4">
                A versão atualizada poderá ser disponibilizada no aplicativo, na
                plataforma web ou por outro meio eletrônico. O uso contínuo da
                plataforma após a disponibilização de nova versão poderá ser
                considerado ciência da Política atualizada, observadas as regras
                aplicáveis e as orientações da contratante.
              </p>
            </Section>

            {/* Contato */}
            <div className="p-8 md:p-10 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Canais de contato
              </h3>

              <p className="text-slate-600 mb-4">
                Para dúvidas administrativas, correção de escala, plantões,
                produção, permissões, pagamentos, vínculos, confirmação de
                presença ou solicitações relacionadas à sua relação com a
                contratante, o usuário deverá entrar em contato prioritariamente
                com a própria contratante, administrador, coordenador ou
                responsável indicado.
              </p>

              <p className="text-slate-600 mb-6">
                Para questões técnicas relacionadas ao funcionamento da
                plataforma, o contato poderá ser feito pelos canais indicados
                pela contratante ou disponibilizados pelo MedTurn.
              </p>

              <p className="text-slate-600 mb-6">
                Solicitações de acesso, correção, desativação ou exclusão de
                conta e dados pessoais devem ser encaminhadas prioritariamente
                à contratante, responsável pela gestão dos usuários. Quando
                recebidas pelo MedTurn, poderão ser direcionadas à contratante
                para avaliação e providências cabíveis.
              </p>

<a
  href="mailto:medturn@outlook.com"
  className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md text-slate-700 font-medium rounded-lg transition-all duration-200 group"
>
  <Mail className="w-5 h-5 mr-2 text-slate-400 group-hover:text-blue-500" />
  medturn@outlook.com
</a>
            </div>
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

// Componentes Auxiliares para manter o código limpo

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

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center bg-slate-50 px-3 py-2 rounded-md border border-slate-100 text-sm font-medium text-slate-700">
      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2.5"></div>
      {children}
    </li>
  );
}