import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessageSquareOff,
  Repeat,
  ShieldCheck,
  UserCheck,
  Users,
  Calculator,
  Layers3,
  Smartphone,
  MonitorSmartphone,
  Clock3,
  TrendingUp,
  AlertCircle,
  Wallet,
  type LucideIcon,
} from "lucide-react";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#4AE2B6]/30 bg-[#4AE2B6]/10 px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest text-[#4AE2B6] backdrop-blur-md">
      {children}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  desc,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center" : ""}>
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4AE2B6]">
          {eyebrow}
        </p>
      ) : null}

      <h2 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl">
        {title}
      </h2>

      {desc ? (
        <p
          className={`mt-5 text-lg leading-8 text-zinc-400 ${
            center ? "mx-auto max-w-3xl" : "max-w-3xl"
          }`}
        >
          {desc}
        </p>
      ) : null}
    </div>
  );
}

function StatCard({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05]">
      <p className="text-3xl font-black tracking-tight text-white md:text-4xl">
        {value}
      </p>
      <p className="mt-2 font-bold text-white">{label}</p>
      {sub ? <p className="mt-1 text-xs text-zinc-500">{sub}</p> : null}
    </div>
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

function StepCard({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-[32px] border border-white/5 bg-white/[0.03] p-8 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05]">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4AE2B6]/12 text-lg font-black text-[#4AE2B6]">
        {number}
      </div>
      <h3 className="mt-6 text-xl font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{desc}</p>
    </div>
  );
}

function PricingCard({
  tier,
  price,
  subtitle,
  valueLine,
  features,
  highlight = false,
}: {
  tier: string;
  price: string;
  subtitle: string;
  valueLine: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-[32px] p-8 transition-all duration-300 ${
        highlight
          ? "scale-[1.02] border-2 border-[#4AE2B6]/40 bg-gradient-to-b from-[#163a34] to-[#071312] shadow-[0_20px_50px_-20px_rgba(74,226,182,0.2)]"
          : "border border-white/5 bg-white/[0.02]"
      }`}
    >
      {highlight ? (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#4AE2B6] px-4 py-1 text-xs font-black uppercase text-[#071312]">
          Mais popular
        </span>
      ) : null}

      <h3 className="text-xl font-bold text-white">{tier}</h3>
      <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>

      <div className="mt-6 flex items-end gap-1">
        {price === "Sob proposta" ? (
          <span className="text-4xl font-black text-white">{price}</span>
        ) : (
          <>
            <span className="text-sm text-zinc-500">R$</span>
            <span className="text-4xl font-black text-white">{price}</span>
            <span className="mb-1 text-sm text-zinc-500">/mês</span>
          </>
        )}
      </div>

      <div className="mt-5 rounded-2xl bg-[#4AE2B6]/7 p-4">
        <p className="text-sm font-semibold text-white">{valueLine}</p>
      </div>

      <ul className="mt-8 flex-1 space-y-4 text-sm text-zinc-400">
        {features.map((f, i) => (
          <li key={i} className="flex gap-3">
            <CheckCircle2 size={18} className="shrink-0 text-[#4AE2B6]" />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href="/solicitar-implantacao"
        className={`mt-8 w-full rounded-xl py-4 text-center font-bold transition-all ${
          highlight
            ? "bg-[#4AE2B6] text-[#071312] hover:bg-[#5cf2c5]"
            : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
        }`}
      >
        Solicitar proposta
      </Link>
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[40px] bg-[#4AE2B6]/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#0A1A18]/90 p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              MedTurn Dashboard
            </p>
            <p className="mt-1 text-sm font-bold text-white">
  Coordenação · UTI Adulto · Hospital São Lucas
</p>
          </div>
          <div className="rounded-xl bg-[#4AE2B6]/12 px-3 py-2 text-xs font-bold text-[#4AE2B6]">
            Online
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[26px] border border-white/5 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#4AE2B6]/10 p-3 text-[#4AE2B6]">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Escala da semana</p>
                  <p className="text-xs text-zinc-500">Seg · Ter · Qua · Qui · Sex</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#4AE2B6]">
                Atualizada
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {[
                ["Segunda", "12 plantões", "2 chefias"],
                ["Terça", "10 plantões", "1 troca"],
                ["Quarta", "11 plantões", "sem pendências"],
              ].map(([day, a, b]) => (
                <div
                  key={day}
                  className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{day}</p>
                    <p className="text-xs text-zinc-500">{a}</p>
                  </div>
                  <span className="text-xs text-zinc-400">{b}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-white/5 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400">
                <Repeat size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Troca pendente</p>
                <p className="text-xs text-zinc-500">
                  Aguardando aprovação da coordenação
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                  Noite · UTI Adulto
                </p>
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Pendente
                </span>
              </div>

              <p className="mt-3 text-sm text-zinc-400">
                <span className="font-semibold text-white">Dr. João</span> anunciou
                troca e <span className="font-semibold text-white">Dra. Marina</span>{" "}
                sinalizou interesse.
              </p>

              <div className="mt-4 flex gap-2">
                <div className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white">
                  Aprovar
                </div>
                <div className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-400">
                  Revisar
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/5 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#4AE2B6]/10 p-3 text-[#4AE2B6]">
                <Wallet size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Fechamento financeiro
                </p>
                <p className="text-xs text-zinc-500">Prévia do mês atual</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-zinc-500">Plantões lançados</p>
                <p className="mt-2 text-2xl font-black text-white">148</p>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-zinc-500">Chefias</p>
                <p className="mt-2 text-2xl font-black text-white">18</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-[#4AE2B6]/6 p-4">
              <p className="text-xs text-zinc-500">Status</p>
              <p className="mt-2 text-sm font-semibold text-white">
                Dados organizados para conferência final
              </p>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/5 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-400">
                <BellRing size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Notificações</p>
                <p className="text-xs text-zinc-500">Últimas interações da equipe</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                "Nova troca anunciada em Clínica Médica",
                "Escala de sexta atualizada",
                "2 médicos confirmaram disponibilidade",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-black/20 px-4 py-3"
                >
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#4AE2B6]" />
                  <p className="text-sm text-zinc-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MedTurnVitrine() {
  return (
    <div className="min-h-screen bg-[#071312] text-zinc-200 selection:bg-[#4AE2B6]/30 selection:text-white">
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#071312]/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-black tracking-tighter text-white"
          >
            MED<span className="text-[#4AE2B6]">TURN</span>
          </Link>

          <nav className="hidden gap-8 text-sm font-medium text-zinc-400 md:flex">
            <Link href="#problema" className="transition-colors hover:text-white">
              O problema
            </Link>
            <Link href="#solucao" className="transition-colors hover:text-white">
              Solução
            </Link>
            <Link href="#como-funciona" className="transition-colors hover:text-white">
              Como funciona
            </Link>
            <Link href="#precos" className="transition-colors hover:text-white">
              Planos
            </Link>
          </nav>

          <Link
            href="/login"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-bold text-white transition-all hover:bg-white/10"
          >
            Entrar
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 pb-24 pt-40 md:pb-32 md:pt-48">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[620px] w-full max-w-4xl -translate-x-1/2 bg-[#4AE2B6]/10 blur-[120px]" />
          <div className="absolute left-1/2 top-10 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[#219B82]/20 blur-[120px] animate-pulse" />
          <div className="absolute right-[-120px] top-16 h-[360px] w-[360px] rounded-full bg-[#4AE2B6]/10 blur-[120px]" />
          <div className="absolute left-[-100px] bottom-0 h-[320px] w-[320px] rounded-full bg-[#4AE2B6]/8 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl">
  <div className="text-left">
    <Pill>Para coordenadores de escala, gestores e diretores hospitalares</Pill>

    <h1 className="mt-8 text-5xl font-black tracking-tight text-white md:text-7xl lg:leading-[1.02]">
      Domínio total sobre a escala.
      <br />
      <span className="bg-gradient-to-r from-[#4AE2B6] to-[#219B82] bg-clip-text text-transparent">
        Previsibilidade real para quem coordena a operação.
      </span>
    </h1>

    <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-400 md:text-xl">
      O MedTurn foi feito para quem precisa manter plantões organizados,
      revisar trocas com segurança, reduzir o desgaste da coordenação e
      fechar o mês com uma operação muito mais clara.
    </p>

    <div className="mt-10 flex flex-wrap gap-4">
      <Link
        href="/solicitar-implantacao"
        className="inline-flex h-16 items-center rounded-2xl bg-[#4AE2B6] px-8 text-base font-black text-[#071312] shadow-[0_0_50px_-10px_#4AE2B6] transition-all hover:scale-105 hover:bg-[#5cf2c5]"
      >
        Agendar demonstração
        <ArrowRight className="ml-2" size={18} />
      </Link>

      <Link
        href="/login"
        className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 text-base font-bold text-white backdrop-blur-md transition-all hover:bg-white/10"
      >
        Acessar sistema <ArrowRight size={16} />
      </Link>
    </div>

    <div className="mt-10 grid gap-3 text-sm sm:grid-cols-3">
      {[
        "Trocas com aprovação da coordenação",
        "Escala organizada em um só lugar",
        "Fechamento mais leve no fim do mês",
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

    <div className="mt-10 grid gap-4 md:grid-cols-3">
      <StatCard
        value="Menos ruído"
        label="na rotina da escala"
        sub="Menos dependência de planilhas, PDFs soltos e mensagens espalhadas"
      />
      <StatCard
        value="Mais segurança"
        label="para aprovar trocas e decisões"
        sub="A coordenação passa a enxergar melhor o que mudou, o que está pendente e o que já foi validado"
      />
      <StatCard
        value="Mais clareza"
        label="para fechar o mês"
        sub="A operação fica mais organizada ao longo da rotina, sem deixar todo o peso para o fim"
      />
    </div>
  </div>

  <div className="mt-16">
    <DashboardMock />
  </div>
</div>
      </section>

      <section className="px-6 pb-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                t: "Menos tempo resolvendo problema no WhatsApp",
                d: "A coordenação deixa de gastar energia procurando mensagem, confirmando alteração e remontando contexto.",
              },
              {
                t: "Mais segurança para aprovar trocas",
                d: "As movimentações passam a acontecer dentro de um fluxo mais claro, e não no improviso.",
              },
              {
                t: "Menos pressão no fechamento do mês",
                d: "Os dados ficam mais organizados ao longo da rotina, reduzindo o peso da conferência final.",
              },
              {
                t: "Mais tranquilidade para quem responde pela operação",
                d: "A escala ganha mais padrão, mais consistência e menos dependência de ferramentas soltas.",
              },
            ].map((item) => (
              <div
                key={item.t}
                className="rounded-[28px] border border-white/5 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05]"
              >
                <p className="text-lg font-black text-white">{item.t}</p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="problema"
        className="border-y border-white/5 bg-[#0A1A18] px-6 py-20 md:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="O problema"
                title="Quem coordena escala sabe: o problema não é só montar a grade. É sustentar o mês inteiro."
                desc="Troca para aprovar, médico para responder, escala para atualizar, fechamento para conferir. Quando tudo isso depende de planilha, PDF e grupo de WhatsApp, a operação começa a cobrar caro da coordenação."
              />
            </div>

            <div className="space-y-5">
              <div className="flex gap-4 rounded-2xl border border-red-500/10 bg-red-500/5 p-5">
                <AlertCircle className="shrink-0 text-red-400" />
                <p className="text-sm leading-relaxed text-zinc-400">
                  <strong className="text-white">Informação espalhada:</strong>{" "}
                  alterações importantes ficam divididas entre mensagens,
                  arquivos e versões diferentes da escala.
                </p>
              </div>

              <div className="flex gap-4 rounded-2xl border border-orange-500/10 bg-orange-500/5 p-5">
                <Clock3 className="shrink-0 text-orange-400" />
                <p className="text-sm leading-relaxed text-zinc-400">
                  <strong className="text-white">Desgaste diário:</strong>{" "}
                  a coordenação gasta tempo demais revisando detalhe operacional
                  que poderia estar muito mais organizado.
                </p>
              </div>

              <div className="flex gap-4 rounded-2xl border border-[#4AE2B6]/10 bg-[#4AE2B6]/5 p-5">
                <TrendingUp className="shrink-0 text-[#4AE2B6]" />
                <p className="text-sm leading-relaxed text-zinc-400">
                  <strong className="text-white">Falta de previsibilidade:</strong>{" "}
                  o mês vai ficando mais pesado quando não existe um sistema que
                  conecte rotina, trocas e fechamento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Onde a rotina costuma travar"
            title="Os pontos que mais pesam para quem segura a escala todos os dias"
            desc="O MedTurn foi desenhado para reduzir exatamente os atritos que mais desgastam coordenadores e gestores."
            center
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={MessageSquareOff}
              title="Confirmação espalhada em vários lugares"
              desc="Troca, aviso e resposta ficam em conversas separadas, e a coordenação perde tempo tentando juntar tudo."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Alteração que precisa de validação"
              desc="Sem um fluxo claro, aprovar mudança vira mais um processo manual para revisar e conferir."
            />
            <FeatureCard
              icon={Calculator}
              title="Fechamento que acumula para o fim"
              desc="Quando o mês vai desorganizado, a conferência financeira chega mais pesada e mais cansativa."
            />
          </div>
        </div>
      </section>

      <section id="solucao" className="bg-[#0A1A18] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="A solução"
            title="Um sistema para tirar a escala do improviso e colocar a operação no lugar."
            desc="O MedTurn ajuda a coordenação a trabalhar com mais clareza, mais rastreabilidade e menos atrito no dia a dia."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <FeatureCard
              icon={Layers3}
              title="Escala em um único ambiente"
              desc="A equipe consulta a mesma referência, com mais clareza por serviço, período e profissional."
            />
            <FeatureCard
              icon={Repeat}
              title="Trocas dentro de um fluxo real"
              desc="Solicitações e movimentações acontecem com participação da coordenação, e não no improviso do grupo."
            />
            <FeatureCard
              icon={BellRing}
              title="Atualizações que chegam mais rápido"
              desc="Os médicos acompanham mudanças e oportunidades com muito mais agilidade e menos ruído."
            />
            <FeatureCard
              icon={Calculator}
              title="Base mais organizada para fechar"
              desc="Ao longo do mês, a operação fica mais limpa para facilitar conferência e fechamento."
            />
          </div>
        </div>
      </section>

      <section id="como-funciona" className="px-6 py-24 md:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Como funciona"
            title="Uma rotina mais leve para quem coordena e mais clara para quem planta"
            desc="O MedTurn foi pensado para acompanhar a prática real do hospital, sem complicar ainda mais a operação."
            center
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <StepCard
              number="1"
              title="A coordenação publica e acompanha a escala"
              desc="A operação passa a ter uma referência central, mais fácil de manter atualizada e mais clara para a equipe."
            />
            <StepCard
              number="2"
              title="O médico interage dentro do próprio fluxo"
              desc="Trocas, respostas e movimentações acontecem com mais contexto e menos dependência de mensagens soltas."
            />
            <StepCard
              number="3"
              title="O fechamento chega muito mais organizado"
              desc="Com o mês melhor estruturado desde o começo, a conferência final deixa de concentrar tanto desgaste."
            />
          </div>
        </div>
      </section>

      <section className="bg-[#0A1A18] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Resultados no dia a dia"
            title="O benefício aparece antes do fim do mês"
            desc="Quando a rotina fica mais organizada, isso aparece na equipe, nas decisões e no próprio ritmo da operação."
          />

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            <ResultItem
              title="Escala mais fácil de acompanhar"
              desc="A equipe deixa de depender de arquivos soltos e encontra a informação principal com muito mais rapidez."
            />
            <ResultItem
              title="Aprovação com mais segurança"
              desc="A coordenação decide sobre trocas e alterações com uma visão muito mais clara do que está acontecendo."
            />
            <ResultItem
              title="Menos ruído na comunicação"
              desc="Mudanças relevantes deixam de se perder no meio de mensagens e grupos paralelos."
            />
            <ResultItem
              title="Fechamento menos sofrido"
              desc="A organização construída ao longo do mês reduz a pressão concentrada da conferência final."
            />
            <ResultItem
              title="Mais profissionalismo na rotina"
              desc="A operação ganha padrão, melhora a percepção interna da equipe e reduz a sensação de improviso."
            />
            <ResultItem
  title="Menos erro em trocas e alterações"
  desc="Quando o fluxo fica mais organizado, diminui a chance de desencontro de informação e erro operacional."
/>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <Pill>Para hospitais e coordenações</Pill>

<h2 className="mt-6 text-3xl font-black tracking-tight text-white md:text-5xl">
  Para quem precisa manter a escala funcionando sem carregar tudo nas costas.
</h2>

<p className="mt-6 text-lg leading-8 text-zinc-400">
  Se você coordena médicos, gerencia plantões ou responde pela operação
  do hospital, sabe onde pesa: troca para revisar, equipe para alinhar,
  plantão para cobrir e fechamento para conferir. O MedTurn ajuda a tirar
  esse peso do improviso e colocar a rotina em um fluxo mais seguro.
</p>

              <ul className="mt-8 space-y-6">
  {[
    {
      icon: UserCheck,
      t: "Mais segurança para aprovar trocas",
      d: "A coordenação continua no centro da decisão, com mais clareza sobre quem saiu, quem entrou e o que realmente foi validado.",
    },
    {
  icon: FileText,
  t: "Escala mais clara para os plantonistas",
  d: "A equipe passa a visualizar a escala com mais facilidade, sem depender de PDF solto, print ou mensagem perdida.",
},
    {
      icon: Calculator,
      t: "Menos pressão no fechamento do mês",
      d: "A operação fica melhor estruturada ao longo da rotina, sem deixar todo o peso para a conferência final.",
    },
    {
  icon: Repeat,
  t: "Menos erro em trocas e alterações",
  d: "O fluxo de troca fica mais organizado, o que ajuda a reduzir ruído, desencontro de informação e erro operacional.",
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
              <Pill>Para médicos e plantonistas</Pill>

              <h2 className="mt-6 text-3xl font-black tracking-tight text-white md:text-4xl">
                Menos confusão para acompanhar a própria rotina.
              </h2>

              <p className="mt-4 text-zinc-400">
  O médico acompanha a escala com mais facilidade, responde às trocas e
  recebe atualizações com mais contexto. Isso ajuda a equipe a enxergar
  melhor a própria rotina e reduz desencontro de informação no dia a dia.
  No iPhone, ele conta com o app oficial do MedTurn. No Android, pode
  acessar pelo site com experiência de app, de forma simples e direta.
</p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4">
                  <CalendarDays className="text-[#4AE2B6]" size={24} />
                  <span className="font-medium text-white">
                    Visualização da agenda pessoal
                  </span>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4">
                  <Repeat className="text-[#4AE2B6]" size={24} />
                  <span className="font-medium text-white">
                    Trocas e oportunidades em um fluxo mais claro
                  </span>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4">
                  <BellRing className="text-[#4AE2B6]" size={24} />
                  <span className="font-medium text-white">
                    Atualizações relevantes em tempo real
                  </span>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4">
                  <Smartphone className="text-[#4AE2B6]" size={24} />
                  <span className="font-medium text-white">
                    App oficial no iOS e experiência de app no Android
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-[#0A1A18] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Por que o MedTurn se destaca"
            title="Não é só uma tela bonita. É uma estrutura para sustentar a rotina da escala."
            desc="O MedTurn conecta operação, coordenação e experiência do médico dentro do mesmo sistema."
            center
          />

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <AudienceCard
              icon={MonitorSmartphone}
              title="Ambiente web para gestão"
              desc="Voltado para coordenação, administração e acompanhamento mais estruturado da operação."
            />
            <AudienceCard
              icon={Smartphone}
              title="Acesso simples para médicos"
              desc="App oficial no iPhone e site com experiência de app para uso prático no Android."
            />
            <AudienceCard
              icon={ShieldCheck}
              title="Fluxo com validação"
              desc="Mudanças importantes passam por processo, e não por improviso."
            />
            <AudienceCard
              icon={Clock3}
              title="Organização que gera alívio"
              desc="O ganho operacional cresce ao longo do mês e aparece direto na rotina da equipe."
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Onde o MedTurn faz mais sentido"
            title="Especialmente em operações que já cansaram de depender de planilha, PDF e grupo"
            desc="Quanto mais recorrente e sensível for a escala, maior tende a ser o valor de um fluxo centralizado."
            center
          />

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <AudienceCard
              icon={Building2}
              title="Hospitais"
              desc="Quando a operação exige mais padrão, mais visibilidade e menos dependência de ferramentas paralelas."
            />
            <AudienceCard
              icon={Users}
              title="Grupos médicos"
              desc="Especialmente quando o volume de profissionais já começa a gerar ruído no controle manual."
            />
            <AudienceCard
              icon={ClipboardList}
              title="Coordenações"
              desc="Para quem precisa aprovar movimentações e sustentar a rotina com mais autoridade."
            />
            <AudienceCard
              icon={CalendarDays}
              title="Serviços recorrentes"
              desc="Em escalas frequentes, o benefício de centralizar processo e comunicação aparece muito mais rápido."
            />
          </div>
        </div>
      </section>

      <section className="px-6 pb-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[32px] border border-[#4AE2B6]/15 bg-[#4AE2B6]/5 p-8 md:p-10">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4AE2B6]">
                  Valor percebido
                </p>
                <h3 className="mt-3 text-2xl font-black text-white">
                  O ganho não está só na tecnologia.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  Ele aparece quando a coordenação sofre menos, a operação flui
                  melhor e o mês fecha com muito mais ordem.
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-5">
                <p className="text-sm font-bold text-white">
                  Menos atrito para tocar a rotina
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  A equipe gasta menos energia carregando falhas do processo e mais
                  energia operando com clareza.
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-5">
                <p className="text-sm font-bold text-white">
                  Mais consistência ao longo do mês
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  O valor aparece nas pequenas decisões do dia a dia, e não só no
                  momento final da conferência.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

<section className="px-6 py-24">
  <div className="mx-auto max-w-6xl">
    <SectionHeading
  eyebrow="Implantação"
  title="Uma implementação segura, para operações que não podem perder ritmo."
  desc="O MedTurn foi pensado para entrar na rotina com segurança. A implantação é conduzida para que o sistema se adapte ao funcionamento do serviço, com mais clareza, menos atrito e uma transição muito mais organizada."
  center
/>

    <div className="mt-14 grid gap-6 md:grid-cols-3">
  <StepCard
    number="1"
    title="Mapeamento da rotina atual"
    desc="A implantação começa entendendo como o serviço funciona hoje: publicação da escala, trocas, comunicação com plantonistas e fechamento do mês."
  />
  <StepCard
    number="2"
    title="Estruturação do fluxo no MedTurn"
    desc="O sistema é organizado de acordo com a dinâmica do serviço, para a coordenação ganhar controle sem precisar quebrar a rotina para começar a usar."
  />
  <StepCard
    number="3"
    title="Entrada acompanhada da equipe"
    desc="A transição acontece com apoio, reduzindo ruído na adoção e ajudando coordenação e plantonistas a enxergarem o novo fluxo com mais clareza."
  />
</div>

    <div className="mt-10 rounded-[32px] border border-[#4AE2B6]/15 bg-[#4AE2B6]/5 p-8 md:p-10">
      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4AE2B6]">
            O que isso significa na prática
          </p>
          <h3 className="mt-3 text-2xl font-black text-white">
            Menos resistência da equipe. Mais organização para a operação andar.
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Quando a implantação respeita a realidade do serviço, a coordenação
            sente menos peso na mudança, os plantonistas entendem melhor o fluxo
            e a entrada do sistema acontece com muito mais consistência.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-black/20 p-5">
            <p className="text-sm font-bold text-white">
  Apoio real na entrada
</p>
<p className="mt-2 text-sm text-zinc-400">
  A implantação não fica solta. O início é conduzido para reduzir atrito e dar mais segurança à coordenação.
</p>
          </div>

          <div className="rounded-2xl bg-black/20 p-5">
            <p className="text-sm font-bold text-white">
  Configuração compatível com a operação
</p>
<p className="mt-2 text-sm text-zinc-400">
  O MedTurn se adapta à lógica do serviço para que a mudança entre na rotina com mais consistência.
</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      <section id="precos" className="bg-[#0A1A18] px-6 py-24">
  <div className="mx-auto max-w-6xl">
    <SectionHeading
      eyebrow="Estrutura comercial"
      title="Uma proposta compatível com o tamanho do seu serviço"
      desc="O MedTurn foi pensado para hospitais e grupos que querem reduzir ruído na escala, aliviar a rotina da coordenação e ganhar mais previsibilidade sem depender de improviso."
      center
    />

    <div className="mb-10 mt-10 rounded-[28px] border border-white/5 bg-white/[0.03] p-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4AE2B6]">
        Como o MedTurn se adapta à sua operação
      </p>
      <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400">
  No MedTurn, cada unidade operacional representa uma estrutura de escala
  acompanhada separadamente dentro da operação, como uma UTI, um pronto
  atendimento, um centro cirúrgico ou outro núcleo com rotina própria.
  Isso permite que a proposta acompanhe o tamanho real da operação e o
  nível de organização que a coordenação precisa sustentar no dia a dia.
</p>
    </div>

    <div className="mt-14 grid gap-8 md:grid-cols-3">
      <PricingCard
        tier="Essencial"
        price="2.999"
        subtitle="Para 1 unidade operacional"
        valueLine="Para hospitais que querem reduzir erros em trocas, facilitar a visualização da escala pelos plantonistas e sair da dependência de planilha, PDF e grupo."
        features={[
  "1 unidade operacional",
  "Escala digital centralizada",
  "Trocas com aprovação",
  "Notificações para médicos",
  "Fechamento financeiro organizado",
  "Suporte comercial padrão",
]}
      />

      <PricingCard
        tier="Multiunidade"
        price="6.999"
        subtitle="Para até 3 unidades operacionais"
        valueLine="Para grupos que precisam dar padrão à operação, reduzir ruído entre unidades e aliviar a coordenação no dia a dia."
        highlight={true}
        features={[
  "Até 3 unidades operacionais",
  "Tudo do plano Essencial",
  "Gestão centralizada por unidade",
  "Maior controle da operação",
  "Fluxo mais robusto para coordenação",
  "Condição comercial mais estratégica",
]}
      />

      <PricingCard
        tier="Institucional"
        price="Sob proposta"
        subtitle="Para grupos maiores, redes hospitalares e operações personalizadas"
        valueLine="Para redes e operações maiores que precisam de implantação assistida, expansão progressiva e proposta ajustada à realidade do serviço."
        features={[
  "Mais de 3 unidades operacionais",
  "Estrutura comercial personalizada",
  "Condições por volume",
  "Acompanhamento institucional",
  "Possibilidade de expansão progressiva",
  "Modelo negociado conforme operação",
]}
      />
    </div>

    <p className="mt-8 text-center text-sm text-zinc-500">
      Propostas a partir de R$ 2.999 por unidade operacional, com condições mais eficientes para operações multiunidade.
    </p>
  </div>
</section>

      <section className="relative overflow-hidden px-6 pb-24 pt-20">
        <div className="absolute inset-0 -z-10 bg-[#4AE2B6]/5" />

        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[40px] border border-[#4AE2B6]/20 bg-[#4AE2B6]/5 p-10 text-center md:p-20">
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#4AE2B6]/10 to-transparent" />

            <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Se a sua escala hoje depende de planilha, PDF e grupo, já passou da hora de respirar melhor.
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
              O MedTurn ajuda sua equipe a trabalhar com mais organização, menos
              ruído e muito mais segurança na rotina.
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

            <p className="mt-8 text-sm text-zinc-600">
              Implantação assistida · Estrutura comercial institucional
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="font-black tracking-tighter text-white">
            MED<span className="text-[#4AE2B6]">TURN</span>
          </div>

          <p className="text-xs text-zinc-600">
            © 2026 MedTurn Tecnologia Ltda. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}