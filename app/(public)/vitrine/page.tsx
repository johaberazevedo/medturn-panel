"use client"; 

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ArrowRight,
  BellRing,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
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

      <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
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
    <div className="flex gap-4 rounded-[30px] border border-white/5 bg-white/[0.03] px-5 py-5 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05]">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4AE2B6]/12 text-[#4AE2B6]">
        <CheckCircle2 size={17} strokeWidth={2.4} />
      </div>

      <div>
        <h3 className="text-[19px] font-bold leading-snug text-white">
          {title}
        </h3>
        <p className="mt-2 text-[15px] leading-8 text-zinc-400">
          {desc}
        </p>
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
      className={`relative flex h-full flex-col rounded-[32px] p-5 transition-all duration-300 ${
        highlight
          ? "border-2 border-[#4AE2B6]/45 bg-gradient-to-b from-[#173c35] via-[#102725] to-[#071312] shadow-[0_18px_50px_-24px_rgba(74,226,182,0.22)]"
          : "border border-white/5 bg-white/[0.02]"
      }`}
    >
      {highlight ? (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#4AE2B6] px-4 py-1 text-[11px] font-black uppercase text-[#071312]">
          Mais estratégico
        </span>
      ) : null}

      <div>
        <h3 className="text-[22px] font-black tracking-tight text-white">{tier}</h3>
        <p className="mt-1.5 text-sm text-zinc-500">{subtitle}</p>
      </div>

      <div className="mt-5 flex items-end gap-1">
        {price === "Sob proposta" ? (
          <span className="text-4xl font-black tracking-tight text-white">
            {price}
          </span>
        ) : (
          <>
            <span className="mb-1 text-sm text-zinc-500">R$</span>
            <span className="text-4xl font-black tracking-tight text-white">
              {price}
            </span>
            <span className="mb-1 text-sm text-zinc-500">/mês</span>
          </>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-white/5 bg-[#4AE2B6]/8 p-3">
        <p className="text-sm font-semibold leading-5 text-white">{valueLine}</p>
      </div>

      <ul className="mt-5 flex-1 space-y-2.5 text-sm leading-5 text-zinc-400">
        {features.map((f, i) => (
          <li key={i} className="flex gap-3">
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0 text-[#4AE2B6]"
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/solicitar-implantacao"
        className={`mt-5 w-full rounded-xl py-3 text-center text-sm font-bold transition-all ${
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
              <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                <p className="text-xs text-zinc-500">Plantões lançados</p>
                <p className="mt-2 text-2xl font-black text-white">148</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Impede o scroll da página quando o menu mobile está aberto
  useEffect(() => {
  document.body.style.overflow = isMenuOpen ? "hidden" : "unset";

  return () => {
    document.body.style.overflow = "unset";
  };
}, [isMenuOpen]);

  const navLinks = [
    { href: "#problema", label: "O problema" },
    { href: "#solucao", label: "Solução" },
    { href: "#como-funciona", label: "Como funciona" },
    { href: "#implantacao", label: "Implantação" },
    { href: "#precos", label: "Planos" },
  ];

  return (
    <div className="min-h-screen bg-[#071312] text-zinc-200 selection:bg-[#4AE2B6]/30 selection:text-white">
      <header className="fixed top-0 z-[100] w-full border-b border-white/5 bg-[#071312]/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-black tracking-tighter text-white">
            MED<span className="text-[#4AE2B6]">TURN</span>
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden gap-8 text-sm font-medium text-zinc-400 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-bold text-white transition-all hover:bg-white/10 md:block">
              Entrar
            </Link>

            {/* Botão Mobile Toggle */}
            <button
  type="button"
  aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
  aria-expanded={isMenuOpen}
  onClick={() => setIsMenuOpen(!isMenuOpen)}
  className="relative z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 md:hidden"
>
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Overlay do Menu Mobile */}
        <div
  aria-hidden={!isMenuOpen}
  className={`fixed inset-0 z-40 flex flex-col bg-[#071312] p-8 transition-all duration-300 md:hidden ${
    isMenuOpen
      ? "translate-x-0 opacity-100 pointer-events-auto"
      : "translate-x-full opacity-0 pointer-events-none"
  }`}
>
          <div className="mt-24 flex flex-col gap-8 text-3xl font-black">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                onClick={() => setIsMenuOpen(false)}
                className="text-zinc-500 transition-colors hover:text-[#4AE2B6]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-auto space-y-4">
            <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex h-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-bold text-white">
              Entrar no sistema
            </Link>
            <Link href="/solicitar-implantacao" onClick={() => setIsMenuOpen(false)} className="flex h-16 items-center justify-center rounded-2xl bg-[#4AE2B6] text-lg font-bold text-[#071312]">
              Solicitar proposta
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 pb-20 pt-40 md:pb-28 md:pt-48">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[620px] w-full max-w-4xl -translate-x-1/2 bg-[#4AE2B6]/10 blur-[120px]" />
          <div className="absolute left-1/2 top-10 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[#219B82]/20 blur-[120px] animate-pulse" />
          <div className="absolute right-[-120px] top-16 h-[360px] w-[360px] rounded-full bg-[#4AE2B6]/10 blur-[120px]" />
          <div className="absolute left-[-100px] bottom-0 h-[320px] w-[320px] rounded-full bg-[#4AE2B6]/8 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="text-left">
            <Pill>Para coordenadores de escala, gestores e diretores hospitalares</Pill>

            <h1 className="mt-8 text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-5xl md:text-7xl lg:leading-[1.02]">
              Domínio total sobre a escala.
              <br />
              <span className="bg-gradient-to-r from-[#4AE2B6] to-[#219B82] bg-clip-text text-transparent">
                Previsibilidade real para quem lidera a operação.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-7 text-zinc-400 md:text-xl md:leading-8">
              O MedTurn centraliza a gestão de plantões, organiza trocas com
              aprovação da coordenação e deixa o fechamento muito mais claro ao
              longo do mês.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              <Link
                href="/solicitar-implantacao"
                className="inline-flex h-16 items-center rounded-2xl bg-[#4AE2B6] px-8 text-base font-black text-[#071312] shadow-[0_0_50px_-10px_#4AE2B6] transition-all hover:scale-105 hover:bg-[#5cf2c5]"
              >
                Agendar demonstração
                <ArrowRight className="ml-2" size={18} />
              </Link>

              <Link
  href="#implantacao"
  className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 text-base font-bold text-white backdrop-blur-md transition-all hover:bg-white/10"
>
  Conhecer a implantação <ArrowRight size={16} />
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
    sub="A gestão enxerga melhor o que mudou, o que está pendente e o que já foi validado"
  />
  <StatCard
    value="Mais clareza"
    label="para fechar o mês"
    sub="A operação fica mais organizada ao longo da rotina, sem deixar todo o peso para o fim"
  />
</div>

<div className="mt-14">
  <DashboardMock />
</div>
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

      <section id="solucao" className="bg-[#0A1A18] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="A solução"
            title="Um sistema para tirar a escala do improviso e colocar a operação no lugar."
            desc="O MedTurn ajuda a gestão a trabalhar com mais clareza, mais rastreabilidade e menos desgaste no dia a dia."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <FeatureCard
              icon={Layers3}
              title="Escala centralizada por unidade operacional"
              desc="UTI, pronto atendimento, centro cirúrgico e outras frentes podem ser acompanhadas com mais clareza dentro do mesmo sistema."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Trocas com fluxo validado"
              desc="Solicitações e movimentações acontecem com participação da coordenação, e não no improviso do grupo."
            />
            <FeatureCard
              icon={BellRing}
              title="Atualizações mais rápidas para a equipe"
              desc="Os médicos acompanham mudanças, oportunidades e publicações com muito mais agilidade e menos ruído."
            />
            <FeatureCard
              icon={Calculator}
              title="Base organizada para o fechamento"
              desc="Ao longo do mês, a operação fica mais limpa para facilitar conferência, produção e fechamento."
            />
          </div>
        </div>
      </section>

      <section id="como-funciona" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Como funciona"
            title="Uma rotina mais leve para quem lidera a escala e mais clara para toda a equipe"
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

      <section className="bg-[#0A1A18] px-6 py-24 border-y border-white/5">
  <div className="mx-auto max-w-6xl">
    <div className="grid gap-16 lg:grid-cols-[1fr_2fr] lg:items-start">
      
      {/* Coluna da Esquerda: Heading fixo/destaque */}
      <div className="lg:sticky lg:top-28 self-start">
        <Pill>Impacto Operacional</Pill>
        <h2 className="mt-6 text-4xl font-black leading-tight text-white md:text-5xl">
          A saúde da sua operação em um novo patamar.
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-zinc-400">
          Mais do que organizar turnos, o MedTurn remove os gargalos que fazem a coordenação perder tempo e a equipe perder a confiança na escala.
        </p>
        
        <div className="mt-10 rounded-3xl border border-[#4AE2B6]/20 bg-[#4AE2B6]/5 p-6">
          <p className="text-sm font-bold text-[#4AE2B6]">Impacto percebido na rotina:</p>
<p className="mt-2 text-white font-medium">
  Quando a escala deixa de depender de reconferência manual, a gestão ganha tempo, clareza e previsibilidade ao longo do mês.
</p>
        </div>
      </div>

      {/* Coluna da Direita: Lista limpa de benefícios */}
      <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
        {[
          {
            t: "Fim da dependência de PDFs",
            d: "A escala deixa de ser um arquivo estático e vira uma central viva. Todos consultam a mesma versão, em tempo real.",
            icon: Layers3
          },
          {
            t: "Aprovação em um clique",
            d: "Trocas e coberturas pendentes aparecem organizadas para a gestão validar, com histórico completo de quem solicitou.",
            icon: UserCheck
          },
          {
            t: "Fechamento antecipado",
            d: "Como os dados são validados durante o mês, a conferência financeira vira apenas uma formalidade rápida no fim do mês.",
            icon: Calculator
          },
          {
            t: "Comunicação sem ruído",
            d: "Avisos críticos e oportunidades chegam via notificação oficial, saindo de vez do caos dos grupos de WhatsApp.",
            icon: BellRing
          },
          {
            t: "Rastreabilidade Total",
            d: "Saiba exatamente quem aprovou cada troca e quando a escala foi alterada. Segurança jurídica e administrativa.",
            icon: ShieldCheck
          },
          {
            t: "Adoção mais fácil pela equipe",
            d: "Médicos preferem sistemas claros. A facilidade do app garante que a equipe mantenha a escala sempre em dia.",
            icon: Smartphone
          }
        ].map((item, i) => (
          <div key={i} className="group">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-[#4AE2B6] transition-colors group-hover:bg-[#4AE2B6] group-hover:text-[#0C1E1C]">
              <item.icon size={24} />
            </div>
            <h4 className="text-xl font-bold text-white">{item.t}</h4>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {item.d}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>

{/* SEÇÃO UNIFICADA: ECOSSISTEMA MEDTURN */}
      <section id="ecossistema" className="px-6 py-24 md:py-32 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Ecossistema Completo"
            title="Uma plataforma, duas experiências focadas em eficiência."
            desc="Interfaces específicas para quem decide e para quem executa, garantindo que a informação certa chegue no momento certo."
            center
          />

          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            {/* LADO GESTOR - WEB */}
            <div className="group relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-8 md:p-12 transition-all hover:border-[#4AE2B6]/30">
              <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#4AE2B6]/5 blur-3xl group-hover:bg-[#4AE2B6]/10 transition-all" />
              <Pill>Gestão & Coordenação</Pill>
              <h3 className="mt-6 text-3xl font-black text-white">Domínio estratégico via Web.</h3>
              <p className="mt-4 text-zinc-400">Ambiente administrativo construído para coordenadores que precisam de autoridade e dados para sustentar a escala sem carregar a operação nas costas.</p>
              <ul className="mt-8 space-y-4">
                {[
                  { t: "Validação Ativa", d: "Palavra final em todas as trocas com um fluxo 100% rastreável." },
                  { t: "Inteligência de Faturamento", d: "Relatórios de produção gerados em segundos, eliminando erros manuais." },
                  { t: "Gestão Multiunidade", d: "Controle UTI, PA e Centros Cirúrgicos em uma única tela centralizada." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4AE2B6]/10 text-[#4AE2B6]">
                      <CheckCircle2 size={14} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.t}</p>
                      <p className="text-xs text-zinc-500">{item.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* LADO MÉDICO - APP */}
            <div className="group relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-b from-[#4AE2B6]/5 to-transparent p-8 md:p-12 transition-all hover:border-[#4AE2B6]/30">
              <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#4AE2B6]/10 blur-3xl group-hover:bg-[#4AE2B6]/20 transition-all" />
              <Pill>Plantonistas & Médicos</Pill>
              <h3 className="mt-6 text-3xl font-black text-white">Sua agenda na palma da mão.</h3>
              <p className="mt-4 text-zinc-400">O médico acompanha a própria rotina com agilidade, recebe notificações em tempo real e visualiza oportunidades de cobertura instantaneamente.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors group-hover:bg-white/[0.08]">
                  <Smartphone className="text-[#4AE2B6] mb-2" size={20} />
                  <p className="text-xs font-bold text-white leading-tight">App iOS e acesso móvel no Android</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors group-hover:bg-white/[0.08]">
                  <BellRing className="text-[#4AE2B6] mb-2" size={20} />
                  <p className="text-xs font-bold text-white leading-tight">Alertas de Trocas</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors group-hover:bg-white/[0.08]">
                  <CalendarDays className="text-[#4AE2B6] mb-2" size={20} />
                  <p className="text-xs font-bold text-white leading-tight">Agenda Pessoal</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors group-hover:bg-white/[0.08]">
                  <ShieldCheck className="text-[#4AE2B6] mb-2" size={20} />
                  <p className="text-xs font-bold text-white leading-tight">Mais segurança na rotina</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="implantacao" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Implantação"
            title="Uma implementação segura, para operações que não podem perder ritmo."
            desc="O MedTurn foi pensado para entrar na rotina com segurança. A implantação é conduzida para que o sistema se adapte ao funcionamento do serviço, com mais clareza, menos desgaste e uma transição muito mais organizada."
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
              title="Implantação acompanhada pela equipe"
              desc="A implantação acontece com apoio, reduzindo ruído na adoção e ajudando coordenação e plantonistas a enxergarem o novo fluxo com mais clareza."
            />
          </div>

          <div className="mt-10 rounded-[32px] border border-[#4AE2B6]/15 bg-[#4AE2B6]/5 p-8 md:px-10 md:py-8">
            <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4AE2B6]">
                  O que isso significa na prática
                </p>
                <h3 className="mt-3 text-2xl font-black text-white">
                  Menos resistência da equipe. Mais organização para a operação andar.
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                  Quando a implantação respeita a realidade do serviço, a
                  coordenação sente menos peso na mudança, os plantonistas
                  entendem melhor o fluxo e a adoção do sistema acontece com
                  muito mais consistência.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
                  <p className="text-sm font-bold text-white">
                    Apoio real na implantação 
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    O processo não fica solto. O início é conduzido para
                    reduzir dúvidas de uso e dar mais segurança à gestão e à equipe médica.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
                  <p className="text-sm font-bold text-white">
                    Configuração compatível com a operação
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    O MedTurn se adapta à lógica do serviço para que a mudança
                    entre na rotina com mais consistência.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="precos" className="bg-[#0A1A18] px-6 pt-16 pb-20">
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
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
  Cada unidade operacional representa uma frente de escala acompanhada separadamente dentro da operação, como UTI, pronto atendimento, centro cirúrgico ou outro núcleo com rotina própria. Assim, a proposta acompanha o tamanho real do serviço.
</p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <PricingCard
              tier="Essencial"
              price="2.999,00"
              subtitle="Para 1 unidade operacional"
              valueLine="Para serviços que querem organizar a escala, reduzir ruído operacional e sair da dependência de planilhas, PDFs soltos e grupos paralelos."
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
              price="6.999,00"
              subtitle="Para até 3 unidades operacionais"
              valueLine="Para grupos que precisam dar padrão à operação, reduzir ruído entre unidades e aliviar a coordenação no dia a dia."
              highlight={true}
              features={[
                "Até 3 unidades operacionais",
                "Tudo do plano Essencial",
                "Controle centralizado por unidade operacional",
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
  Estrutura comercial a partir de R$ 2.999 por unidade operacional, com condições mais eficientes para operações multiunidade.
</p>
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute inset-0 -z-10 bg-[#4AE2B6]/5" />

        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[40px] border border-[#4AE2B6]/20 bg-gradient-to-b from-[#4AE2B6]/8 to-[#4AE2B6]/4 p-10 text-center shadow-[0_20px_70px_-40px_rgba(74,226,182,0.25)] md:p-20">
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#4AE2B6]/10 to-transparent" />

            <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Sua operação pode funcionar com muito mais clareza, controle e previsibilidade.
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
  O MedTurn ajuda hospitais e coordenações a organizar a escala, validar trocas com mais segurança e conduzir o mês com muito mais clareza.
</p>

            <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
              <Link
                href="/solicitar-implantacao"
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#4AE2B6] px-10 text-base font-bold text-[#071312] shadow-[0_0_40px_-10px_#4AE2B6] transition-all duration-300 hover:scale-105 hover:bg-[#5cf2c5]"
              >
                Agendar demonstração
              </Link>

              <Link
  href="#precos"
  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-10 text-base font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/10"
>
  Conhecer planos <ArrowRight size={16} />
</Link>
            </div>

            <p className="mt-8 text-sm text-zinc-500">
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