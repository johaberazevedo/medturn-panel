import Link from "next/link";
import {
  CalendarDays,
  MessageSquareOff,
  Calculator,
  UserCheck,
  BellRing,
  FileText,
  ArrowRight,
  ShieldCheck,
  Repeat,
  Building2,
  Users,
  ClipboardList,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex cursor-default items-center rounded-full border border-[#4AE2B6]/30 bg-[#4AE2B6]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#4AE2B6] shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-[#4AE2B6]/15">
      {children}
    </span>
  );
}

function FeatureCard({
  title,
  desc,
  icon: Icon,
}: {
  title: string;
  desc: string;
  icon: LucideIcon;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.04] hover:shadow-[0_20px_50px_-25px_rgba(74,226,182,0.35)]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#4AE2B6]/0 to-[#4AE2B6]/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="mb-6 inline-flex rounded-2xl bg-[#4AE2B6]/10 p-4 text-[#4AE2B6] transition-colors group-hover:bg-[#4AE2B6] group-hover:text-[#0C1E1C]">
        <Icon size={24} strokeWidth={2} />
      </div>
      <h3 className="relative z-10 text-xl font-bold text-white">{title}</h3>
      <p className="relative z-10 mt-3 text-sm leading-relaxed text-zinc-400">
        {desc}
      </p>
    </div>
  );
}

function ResultItem({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-4 rounded-3xl border border-white/5 bg-white/[0.03] p-5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4AE2B6]/15 text-[#4AE2B6]">
        <CheckCircle2 size={18} strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-zinc-400">{desc}</p>
      </div>
    </div>
  );
}

function AudienceCard({
  title,
  desc,
  icon: Icon,
}: {
  title: string;
  desc: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[28px] border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.04]">
      <div className="mb-5 inline-flex rounded-2xl bg-[#4AE2B6]/10 p-3 text-[#4AE2B6]">
        <Icon size={22} strokeWidth={2} />
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{desc}</p>
    </div>
  );
}

export default function MedTurnVitrine() {
  return (
    <div className="min-h-screen bg-[#071312] text-zinc-200 selection:bg-[#4AE2B6]/30 selection:text-white">
      {/* HERO */}
      <section className="relative overflow-hidden px-6 pb-20 pt-24 md:pb-32 md:pt-32">
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
          <div className="absolute h-[620px] w-[620px] rounded-full bg-[#219B82]/20 blur-[120px] animate-pulse" />
          <div className="absolute right-[-120px] top-10 h-[360px] w-[360px] rounded-full bg-[#4AE2B6]/10 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-5xl text-center">
          <div className="flex justify-center">
            <Pill>Escala médica sem planilha e sem caos</Pill>
          </div>

          <h1 className="mt-8 text-5xl font-black tracking-tight text-white md:text-7xl lg:leading-[1.05]">
            Controle sua escala médica com <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-[#4AE2B6] to-[#219B82] bg-clip-text text-transparent">
              mais organização, aprovação e previsibilidade.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-400 md:text-xl">
            Organize escalas médicas, aprove trocas de plantão com controle total
            e gere relatórios financeiros sem depender de planilhas ou grupos de
            WhatsApp.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/solicitar-implantacao"
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#4AE2B6] px-8 text-sm font-bold text-[#071312] shadow-[0_0_40px_-10px_#4AE2B6] transition-all duration-300 hover:scale-105 hover:bg-[#5cf2c5]"
            >
              Agendar demonstração
            </Link>

            <Link
              href="/login"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 text-sm font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/10"
            >
              Acessar sistema <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-10 grid gap-3 text-sm sm:grid-cols-3">
            {[
              "Trocas com aprovação",
              "Escala centralizada",
              "Financeiro automatizado",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 font-semibold text-zinc-300"
              >
                <CheckCircle2 size={16} className="text-[#4AE2B6]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOR */}
      <section className="border-y border-white/5 bg-[#0A1A18] px-6 py-20 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4AE2B6]">
            O problema
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl">
            Escala em planilha, troca no WhatsApp e fechamento manual viram
            retrabalho todo mês.
          </h2>
          <p className="mt-5 text-lg leading-8 text-zinc-400">
            O MedTurn organiza esse fluxo em um sistema único, com mais controle
            para a coordenação e mais praticidade para o médico.
          </p>
        </div>
      </section>

      {/* PROBLEMA VS SOLUÇÃO */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Gestão de escala não precisa ser um caos.
            </h2>
            <p className="mt-4 text-zinc-400">
              O MedTurn resolve os principais gargalos da coordenação médica.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={MessageSquareOff}
              title="Adeus WhatsApp"
              desc="Chega de perder mensagens. Médicos anunciam e solicitam trocas de plantão direto pelo sistema, de forma organizada."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Controle do gestor"
              desc="Nenhuma troca acontece sem aprovação. Mantenha autoridade sobre quem assume cada plantão na sua unidade."
            />
            <FeatureCard
              icon={Calculator}
              title="Financeiro automático"
              desc="O sistema já separa honorários por tipo de turno, chefia e período. O relatório sai muito mais rápido."
            />
          </div>
        </div>
      </section>

      {/* RESULTADOS PRÁTICOS */}
      <section className="bg-[#0A1A18] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14">
            <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Na prática, o MedTurn ajuda você a:
            </h2>
            <p className="mt-4 max-w-3xl text-zinc-400">
              Menos retrabalho para a coordenação, menos ruído para a equipe e
              mais previsibilidade no fechamento.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <ResultItem
              title="Publicar a escala atualizada com mais segurança"
              desc="Centralize a escala em um só lugar e evite versões desencontradas entre planilha, PDF e mensagens."
            />
            <ResultItem
              title="Aprovar trocas sem perder o controle"
              desc="O fluxo de troca fica registrado e passa pela coordenação antes de qualquer alteração efetiva."
            />
            <ResultItem
              title="Avisar médicos em tempo real"
              desc="O plantonista acompanha a própria rotina e recebe notificações sobre mudanças e oportunidades."
            />
            <ResultItem
              title="Fechar honorários com menos esforço"
              desc="O cálculo do período trabalhado fica mais organizado para reduzir trabalho manual no fim do mês."
            />
          </div>
        </div>
      </section>

      {/* COORDENADOR VS PLANTONISTA */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <Pill>Para o coordenador</Pill>
              <h2 className="mt-6 text-3xl font-black tracking-tight text-white md:text-5xl">
                O fim da planilha no fim do mês.
              </h2>
              <p className="mt-6 text-lg leading-8 text-zinc-400">
                Gerencie sua equipe médica com mais organização, menos mensagens
                dispersas e um fluxo de escala pensado para coordenação real.
              </p>

              <ul className="mt-8 space-y-6">
                {[
                  {
                    icon: UserCheck,
                    t: "Aprovação centralizada",
                    d: "Valide trocas de turno com rastreabilidade e mais controle sobre a equipe.",
                  },
                  {
                    icon: FileText,
                    t: "PDFs atualizados",
                    d: "Exporte a escala oficial sempre que precisar, sem reconstruir tudo manualmente.",
                  },
                  {
                    icon: Calculator,
                    t: "Fechamento mais previsível",
                    d: "Organize honorários e períodos de trabalho com muito menos retrabalho.",
                  },
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-[#4AE2B6]">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{item.t}</h4>
                      <p className="mt-1 text-sm text-zinc-400">{item.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[40px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-8 md:p-12">
              <Pill>Para o plantonista</Pill>
              <h2 className="mt-6 text-3xl font-black tracking-tight text-white md:text-4xl">
                Sua rotina no bolso.
              </h2>
              <p className="mt-4 text-zinc-400">
                O médico acompanha a própria escala, anuncia trocas e recebe
                notificações sem depender do grupo da equipe.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4">
                  <CalendarDays className="text-[#4AE2B6]" size={24} />
                  <span className="font-medium text-white">
                    Calendário pessoal de turnos
                  </span>
                </div>
                <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4">
                  <Repeat className="text-[#4AE2B6]" size={24} />
                  <span className="font-medium text-white">
                    Anunciar e assumir plantões facilmente
                  </span>
                </div>
                <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4">
                  <BellRing className="text-[#4AE2B6]" size={24} />
                  <span className="font-medium text-white">
                    Notificações em tempo real
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARA QUEM É */}
      <section className="border-t border-white/5 bg-[#0A1A18] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Para quem o MedTurn faz mais sentido
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-zinc-400">
              Especialmente para serviços que já sentem o peso de coordenar
              escala com ferramentas improvisadas.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <AudienceCard
              icon={Building2}
              title="Hospitais"
              desc="Para unidades que precisam centralizar trocas, escala e fechamento com mais organização."
            />
            <AudienceCard
              icon={Users}
              title="Grupos médicos"
              desc="Quando há muitos profissionais e o controle manual começa a gerar ruído e retrabalho."
            />
            <AudienceCard
              icon={ClipboardList}
              title="Coordenações"
              desc="Para coordenadores que precisam aprovar trocas e manter autoridade sobre a escala."
            />
            <AudienceCard
              icon={CalendarDays}
              title="Serviços recorrentes"
              desc="Para equipes com escalas frequentes, repetitivas e necessidade de acompanhamento contínuo."
            />
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 pb-24 pt-20">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[40px] border border-[#4AE2B6]/20 bg-[#4AE2B6]/5 p-10 text-center md:p-20">
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#4AE2B6]/10 to-transparent" />

            <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Pronto para profissionalizar a gestão da sua escala médica?
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
              Troque planilhas e mensagens dispersas por um fluxo profissional de
              escala, trocas e fechamento financeiro.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/solicitar-implantacao"
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#4AE2B6] px-10 text-base font-bold text-[#071312] shadow-[0_0_40px_-10px_#4AE2B6] transition-all duration-300 hover:scale-105 hover:bg-[#5cf2c5]"
              >
                Falar com a equipe
              </Link>

              <Link
                href="/login"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-10 text-base font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/10"
              >
                Acessar sistema <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}