import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Mail, ArrowLeft, Lock, FileText, Server } from 'lucide-react';

// Metadados para SEO (Next.js App Router)
export const metadata = {
  title: 'Política de Privacidade | MedTurn',
  description: 'Saiba como o MedTurn coleta, usa e protege seus dados médicos e pessoais.',
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
        <span className="font-bold text-blue-600 text-lg tracking-tight">MedTurn</span>
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
            Transparência total sobre como cuidamos dos seus dados.
          </p>
          <div className="mt-4 inline-block px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-500 shadow-sm">
            Última atualização: 13 de fevereiro de 2026
          </div>
        </div>

        {/* Conteúdo Principal (Card) */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          
          <div className="divide-y divide-slate-100">
            
            {/* Seção 1 */}
            <Section 
              number="01" 
              title="Introdução" 
              icon={<FileText className="w-5 h-5" />}
            >
              <p>
                O <strong>MedTurn</strong> é uma plataforma de gestão de escalas médicas desenvolvida para facilitar a vida de profissionais de saúde. Esta Política de Privacidade descreve como coletamos, utilizamos e protegemos suas informações, garantindo que seu foco permaneça no cuidado com o paciente.
              </p>
            </Section>

            {/* Seção 2 */}
            <Section 
              number="02" 
              title="Informações Coletadas"
              icon={<Server className="w-5 h-5" />}
            >
              <p className="mb-4">Coletamos apenas os dados essenciais para o funcionamento da escala:</p>
              <ul className="grid sm:grid-cols-2 gap-3">
                <ListItem>Nome completo</ListItem>
                <ListItem>E-mail corporativo/pessoal</ListItem>
                <ListItem>Identificador de usuário (ID)</ListItem>
                <ListItem>Dados da escala médica</ListItem>
                <ListItem>Histórico de propostas</ListItem>
                <ListItem>Disponibilidade de horário</ListItem>
              </ul>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start">
                <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  <strong>Nota de Segurança:</strong> O MedTurn não coleta, processa ou armazena dados sensíveis de pacientes ou prontuários médicos.
                </p>
              </div>
            </Section>

            {/* Seção 3 */}
            <Section number="03" title="Como usamos seus dados">
              <p>As informações são utilizadas estritamente para:</p>
              <ul className="space-y-2 mt-3 list-disc pl-5 marker:text-blue-500">
                <li>Autenticação segura e proteção da conta.</li>
                <li>Exibição visual e interativa das escalas de plantão.</li>
                <li>Processamento de trocas, doações e candidaturas a plantões.</li>
                <li>Envio de notificações importantes sobre sua agenda.</li>
              </ul>
            </Section>

            {/* Seção 4 */}
            <Section 
              number="04" 
              title="Armazenamento e Segurança"
              icon={<Lock className="w-5 h-5" />}
            >
              <p>
                Levamos a segurança a sério. Seus dados são armazenados em infraestrutura de nível enterprise (Supabase), protegidos por criptografia em repouso e em trânsito (HTTPS/SSL). Seguimos rigorosos protocolos para evitar acesso não autorizado.
              </p>
            </Section>

            {/* Seção 5 */}
            <Section number="05" title="Compartilhamento">
              <p>
                Seus dados pessoais são seus. <strong>Não vendemos suas informações.</strong> O compartilhamento ocorre apenas internamente com os administradores da sua escala hospitalar ou quando estritamente exigido por lei.
              </p>
            </Section>

            {/* Seção 6 - Contato */}
            <div className="p-8 md:p-10 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Seus Direitos e Contato</h3>
              <p className="text-slate-600 mb-6">
                Você pode solicitar o acesso, correção ou exclusão completa dos seus dados a qualquer momento.
              </p>
              
              <a 
                href="mailto:suporte@medturn.app" 
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md text-slate-700 font-medium rounded-lg transition-all duration-200 group"
              >
                <Mail className="w-5 h-5 mr-2 text-slate-400 group-hover:text-blue-500" />
                anestplus@outlook.com
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

function Section({ number, title, children, icon }: { number: string, title: string, children: React.ReactNode, icon?: React.ReactNode }) {
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
      <div className="pl-11 text-slate-600 leading-relaxed">
        {children}
      </div>
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