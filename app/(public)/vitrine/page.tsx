"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ArrowRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Repeat,
  ShieldCheck,
  UserCheck,
  Calculator,
  Smartphone,
  Clock3,
  TrendingUp,
  AlertCircle,
ClipboardList,
MessageSquareText,
RefreshCw,
Activity,
MapPin,
MonitorSmartphone,
Users,
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
      {sub ? <p className="mt-1 text-xs leading-relaxed text-zinc-500">{sub}</p> : null}
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

      <div className="relative z-10 mb-6 inline-flex rounded-2xl bg-[#4AE2B6]/10 p-4 text-[#4AE2B6] transition-colors group-hover:bg-[#4AE2B6] group-hover:text-[#0C1E1C]">
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
        <p className="mt-2 text-[15px] leading-7 text-zinc-400">{desc}</p>
      </div>
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
        <h3 className="text-[22px] font-black tracking-tight text-white">
          {tier}
        </h3>
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
        <p className="text-sm font-semibold leading-5 text-white">
          {valueLine}
        </p>
      </div>

      <ul className="mt-5 flex-1 space-y-2.5 text-sm leading-5 text-zinc-400">
        {features.map((feature, index) => (
          <li key={index} className="flex gap-3">
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0 text-[#4AE2B6]"
            />
            <span>{feature}</span>
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

function MiniMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-300 bg-emerald-400/10"
      : tone === "warning"
      ? "text-amber-300 bg-amber-400/10"
      : tone === "info"
      ? "text-sky-300 bg-sky-400/10"
      : "text-[#4AE2B6] bg-[#4AE2B6]/10";

  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-2 inline-flex rounded-xl px-3 py-1 text-sm font-black ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="relative w-full">
      <div className="absolute -inset-5 rounded-[40px] bg-[#4AE2B6]/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#0A1A18]/95 p-4 shadow-[0_30px_90px_-35px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between rounded-[24px] border border-white/5 bg-white/[0.035] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4AE2B6]/10 text-[#4AE2B6]">
              <CalendarDays size={24} />
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#4AE2B6]">
                MedTurn • Painel administrativo
              </p>
              <h3 className="mt-1 text-lg font-black tracking-tight text-white">
                Hospital São Lucas
              </h3>
              <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                Logado como: Coordenação
              </p>
            </div>
          </div>

          <span className="hidden rounded-2xl bg-[#4AE2B6]/12 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-[#4AE2B6] sm:inline-flex">
            Online
          </span>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.3fr_0.85fr]">
          <section className="space-y-3">
            <div className="rounded-[26px] border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#4AE2B6]">
                    Ações rápidas
                  </p>
                  <h3 className="mt-1 text-base font-black tracking-tight text-white">
                    Rotina da coordenação
                  </h3>
                </div>

                <span className="rounded-2xl bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-400">
                  Atualizado
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {[
                  {
                    eyebrow: "Escala",
                    title: "Escala mensal",
                    desc: "Visualize e edite plantões.",
                    tag: "Abrir",
                    tone: "primary",
                    icon: CalendarDays,
                  },
                  {
                    eyebrow: "Comunicação",
                    title: "Mensagem do plantão",
                    desc: "Texto diário por turno.",
                    tag: "Gerar",
                    tone: "default",
                    icon: MessageSquareText,
                  },
                  {
                    eyebrow: "Financeiro",
                    title: "Relatório",
                    desc: "Produção organizada.",
                    tag: "Abrir",
                    tone: "default",
                    icon: Calculator,
                  },
                  {
                    eyebrow: "Segurança",
                    title: "Ver conflitos",
                    desc: "Sobreposições detectadas.",
                    tag: "2",
                    tone: "warning",
                    icon: ShieldCheck,
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className={`rounded-[22px] border p-3 ${
                      item.tone === "primary"
                        ? "border-[#4AE2B6]/15 bg-[#4AE2B6]/8"
                        : item.tone === "warning"
                        ? "border-amber-400/15 bg-amber-400/8"
                        : "border-white/5 bg-black/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex gap-2.5">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            item.tone === "warning"
                              ? "bg-amber-400/10 text-amber-300"
                              : "bg-[#4AE2B6]/10 text-[#4AE2B6]"
                          }`}
                        >
                          <item.icon size={16} />
                        </div>

                        <div>
                          <p
                            className={`text-[8px] font-black uppercase tracking-widest ${
                              item.tone === "warning"
                                ? "text-amber-300"
                                : "text-[#4AE2B6]"
                            }`}
                          >
                            {item.eyebrow}
                          </p>
                          <h4 className="mt-1 text-[13px] font-black text-white">
                            {item.title}
                          </h4>
                        </div>
                      </div>

                      <span
                        className={`rounded-xl px-2 py-0.5 text-[8px] font-black ${
                          item.tone === "warning"
                            ? "bg-amber-400/15 text-amber-300"
                            : "bg-white/5 text-zinc-400"
                        }`}
                      >
                        {item.tag}
                      </span>
                    </div>

                    <p className="mt-2 text-[10px] leading-relaxed text-zinc-500">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[26px] border border-amber-400/15 bg-amber-400/8 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-300">
                    Prioridade agora
                  </p>
                  <h3 className="mt-1 text-lg font-black tracking-tight text-white">
                    2 conflito(s) detectado(s)
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    Possível sobreposição de plantões no próximo mês.
                  </p>
                </div>

                <span className="w-fit rounded-2xl bg-amber-400 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#1d1300] shadow-sm">
                  Ver conflitos
                </span>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/5 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#4AE2B6]">
                    Guia operacional
                  </p>

                  <h3 className="mt-1 text-base font-black tracking-tight text-white">
                    Próximos passos
                  </h3>
                </div>

                <div className="grid gap-2 text-[10px] leading-relaxed text-zinc-400 sm:grid-cols-2">
                  {[
                    "Organizar escala mensal",
                    "Solicitar disponibilidade",
                    "Acompanhar relatório",
                    "Enviar aviso aos plantonistas",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-2xl bg-black/20 px-3 py-1.5"
                    >
                      <CheckCircle2 size={12} className="shrink-0 text-[#4AE2B6]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="rounded-[26px] border border-white/5 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#4AE2B6]">
                    Central de pendências
                  </p>
                  <h3 className="mt-1 text-base font-black tracking-tight text-white">
                    Trocas e disponibilidade
                  </h3>
                </div>

                <RefreshCw size={15} className="text-zinc-500" />
              </div>

              <div className="mt-3 space-y-2.5">
                <div className="rounded-[22px] border border-emerald-400/15 bg-emerald-400/8 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white">Dra. Marina</span>
                    <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[9px] text-sky-300">
                      Em processo
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
                    <span className="font-bold text-emerald-300">
                      ● Dr. João aceitou
                    </span>{" "}
                    a troca — clique para confirmar
                  </p>

                  <div className="mt-1.5 text-[9px] text-zinc-500">
                    Sex, 15/05/2026 • Noite
                  </div>
                </div>

                <div className="rounded-[22px] border border-blue-400/15 bg-blue-400/8 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white">Dr. Pedro</span>
                    <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[9px] text-blue-300">
                      Oferta direcionada
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
                    Oferta enviada para Dra. Ana aguardando aceite.
                  </p>

                  <div className="mt-1.5 text-[9px] text-zinc-500">
                    Sáb, 16/05/2026 • Tarde
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Disponibilidades
                    </p>

                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[9px] font-black text-zinc-400">
                      8
                    </span>
                  </div>

                  <div className="mt-2 space-y-2">
                    {[
                      ["Dra. Camila", "17/05/2026", "Manhã", "text-emerald-300 bg-emerald-400/10"],
                      ["Dr. Rafael", "18/05/2026", "Noite", "text-purple-300 bg-purple-400/10"],
                    ].map(([name, date, period, chip]) => (
                      <div
                        key={name}
                        className="rounded-2xl border border-white/5 bg-black/20 px-3 py-2.5 text-[10px]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white">{name}</span>
                          <span className="text-[9px] text-zinc-500">
                            14/05
                          </span>
                        </div>

                        <div className="mt-1.5 text-zinc-400">
                          Disp. para <strong className="text-zinc-300">{date}</strong>
                        </div>

                        <span className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[9px] ${chip}`}>
                          {period}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-emerald-400/15 bg-emerald-400/8 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-300">
                Multihospital
              </p>

              <h3 className="mt-1 text-base font-black tracking-tight text-white">
                Pendências em outros hospitais
              </h3>

              <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-400">
                Trocas aceitas por outro médico aguardando confirmação.
              </p>

              <div className="mt-3 rounded-3xl border border-white/5 bg-black/20 px-3 py-2.5 text-[10px]">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-black text-white">Hospital Norte</p>
                    <p className="mt-1 font-bold text-emerald-300">
                      2 aguardando confirmação
                    </p>
                  </div>

                  <span className="whitespace-nowrap rounded-2xl bg-white/5 px-3 py-1.5 text-[9px] font-black text-zinc-300">
                    Abrir
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-4 rounded-[24px] border border-white/5 bg-white/[0.03] px-4 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#4AE2B6]">
                Visão demonstrativa
              </p>

              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                Mock inspirado no painel administrativo real do MedTurn.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {["Escala", "Trocas", "Conflitos", "Relatórios"].map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-white/5 px-3 py-1 text-[9px] font-bold text-zinc-400"
                >
                  {item}
                </span>
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

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const navLinks = [
    { href: "#problema", label: "O problema" },
    { href: "#solucao", label: "Solução" },
    { href: "#operacao", label: "Operação" },
    { href: "#ecossistema", label: "Ecossistema" },
    { href: "#implantacao", label: "Implantação" },
    { href: "#precos", label: "Planos" },
  ];

  return (
    <div className="min-h-screen bg-[#071312] text-zinc-200 selection:bg-[#4AE2B6]/30 selection:text-white">
      <header
        className={`fixed top-0 z-[100] w-full border-b border-white/5 transition-colors duration-300 ${
          isMenuOpen ? "bg-[#071312]" : "bg-[#071312]/80 backdrop-blur-lg"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-black tracking-tighter text-white">
            MED<span className="text-[#4AE2B6]">TURN</span>
          </Link>

          <nav className="hidden gap-8 text-sm font-medium text-zinc-400 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-bold text-white transition-all hover:bg-white/10 md:block"
            >
              Entrar
            </Link>

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

        <div
          aria-hidden={!isMenuOpen}
          className={`fixed bottom-0 left-0 right-0 top-[76px] z-40 isolate overflow-y-auto bg-[#071312] p-8 transition-[transform,opacity] duration-300 md:hidden ${
            isMenuOpen
              ? "translate-x-0 opacity-100 pointer-events-auto"
              : "translate-x-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex flex-col gap-8 pt-6 text-3xl font-black">
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

          <div className="space-y-4 pt-10">
            <Link
              href="/login"
              onClick={() => setIsMenuOpen(false)}
              className="flex h-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg font-bold text-white"
            >
              Entrar no sistema
            </Link>

            <Link
              href="/solicitar-implantacao"
              onClick={() => setIsMenuOpen(false)}
              className="flex h-16 items-center justify-center rounded-2xl bg-[#4AE2B6] text-lg font-bold text-[#071312]"
            >
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
  <div className="max-w-4xl">
    <Pill>Para coordenações médicas, hospitais e grupos de plantão</Pill>

    <h1 className="mt-8 text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-5xl md:text-7xl lg:leading-[1.02]">
      A escala deixa de ser um problema diário.
      <br />
      <span className="bg-gradient-to-r from-[#4AE2B6] to-[#219B82] bg-clip-text text-transparent">
        E vira uma operação controlada.
      </span>
    </h1>

    <p className="mt-8 max-w-2xl text-base leading-7 text-zinc-400 md:text-xl md:leading-8">
      O MedTurn centraliza escala, trocas, disponibilidades, avisos,
      conflitos, confirmação auxiliar de presença e relatórios de produção
      em um fluxo único para coordenação e equipe médica.
    </p>

    <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
<Link
  href="/solicitar-implantacao"
  className="inline-flex h-16 items-center justify-center rounded-2xl bg-[#4AE2B6] px-8 text-base font-black text-[#071312] shadow-[0_0_50px_-10px_#4AE2B6] transition-all hover:scale-105 hover:bg-[#5cf2c5]"
>
  Solicitar proposta para meu serviço
  <ArrowRight className="ml-2" size={18} />
</Link>

<Link
  href="#precos"
  className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 text-base font-bold text-white backdrop-blur-md transition-all hover:bg-white/10"
>
  Ver planos institucionais <ArrowRight size={16} />
</Link>
    </div>

    <div className="mt-10 grid gap-3 text-sm sm:grid-cols-3">
      {[
        "Trocas com aprovação",
        "Pendências por hospital",
        "Fechamento mais organizado",
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

<div className="mt-6 grid gap-4 md:grid-cols-2">
  <div className="rounded-[28px] border border-[#4AE2B6]/15 bg-[#4AE2B6]/5 p-5">
    <p className="text-sm font-bold text-white">
      Você não recebe só um sistema.
    </p>

    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
      Recebe um fluxo implantado com acompanhamento, configuração conforme a
      rotina do serviço e orientação inicial para coordenação e equipe médica.
    </p>
  </div>

  <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-5">
    <p className="text-sm font-bold text-white">
      Criado a partir da rotina real de plantões médicos.
    </p>

    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
      O MedTurn foi desenhado para resolver problemas práticos de escala:
      trocas, disponibilidade, conflitos, avisos, pendências e fechamento mensal.
    </p>
  </div>
</div>
  </div>

<div className="mt-16">
  <div className="mb-8 max-w-3xl">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4AE2B6]">
      Painel administrativo
    </p>

    <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
      A coordenação enxerga a operação inteira em uma única tela.
    </h2>

    <p className="mt-4 text-base leading-7 text-zinc-400 md:text-lg">
      Pendências, trocas aceitas, conflitos, avisos, disponibilidade médica,
      relatórios e ações rápidas ficam organizados para tomada de decisão.
    </p>
  </div>

  <div className="w-full">
    <DashboardMock />
  </div>
</div>

  <div className="mt-12 grid gap-4 md:grid-cols-3">
            <StatCard
              value="Menos ruído"
              label="na rotina da coordenação"
              sub="Trocas, avisos, disponibilidade e pendências deixam de ficar espalhados."
            />
            <StatCard
              value="Mais controle"
              label="sobre decisões operacionais"
              sub="A coordenação enxerga o que está pendente, aceito, aprovado ou em conflito."
            />
            <StatCard
              value="Mais clareza"
              label="para fechar o mês"
              sub="A produção e os plantões chegam mais organizados para conferência final."
            />
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
                title="A escala não quebra só quando falta médico. Ela quebra quando a informação se espalha."
                desc="Pedido de troca no WhatsApp, disponibilidade perdida em mensagem, PDF desatualizado, médico em dois lugares, produção sendo conferida no fim do mês. O peso cai na coordenação."
              />
            </div>

            <div className="space-y-5">
              <div className="flex gap-4 rounded-2xl border border-red-500/10 bg-red-500/5 p-5">
                <AlertCircle className="shrink-0 text-red-400" />
                <p className="text-sm leading-relaxed text-zinc-400">
                  <strong className="text-white">Informação espalhada:</strong>{" "}
                  alterações importantes ficam entre planilhas, mensagens, PDFs e
                  conversas paralelas.
                </p>
              </div>

              <div className="flex gap-4 rounded-2xl border border-orange-500/10 bg-orange-500/5 p-5">
                <Clock3 className="shrink-0 text-orange-400" />
                <p className="text-sm leading-relaxed text-zinc-400">
                  <strong className="text-white">Desgaste diário:</strong>{" "}
                  a coordenação precisa reconferir nomes, datas, turnos, aceitações e
                  pendências manualmente.
                </p>
              </div>

              <div className="flex gap-4 rounded-2xl border border-[#4AE2B6]/10 bg-[#4AE2B6]/5 p-5">
                <TrendingUp className="shrink-0 text-[#4AE2B6]" />
                <p className="text-sm leading-relaxed text-zinc-400">
                  <strong className="text-white">Falta de previsibilidade:</strong>{" "}
                  o fechamento fica pesado porque a operação não foi organizada ao
                  longo do mês.
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
            title="Um sistema para conectar escala, equipe médica e coordenação."
            desc="O MedTurn transforma a escala em uma operação acompanhável: com fluxo de aprovação, central de pendências, avisos oficiais, multihospital, conflitos e relatórios de apoio."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <FeatureCard
              icon={CalendarDays}
              title="Escala mensal centralizada"
              desc="A coordenação visualiza, organiza e edita plantões por hospital ou unidade, com uma referência única para a equipe."
            />
            <FeatureCard
              icon={Repeat}
              title="Trocas com fluxo validado"
              desc="Solicitações, ofertas direcionadas e aceitações passam pelo fluxo correto, com confirmação da coordenação."
            />
            <FeatureCard
              icon={BellRing}
              title="Avisos e notificações"
              desc="A coordenação pode enviar comunicados para um médico específico ou para todos os usuários do hospital."
            />
            <FeatureCard
              icon={Calculator}
              title="Relatório de produção"
              desc="Plantões, turnos, chefias e regras de produção ficam organizados para apoiar a conferência financeira."
            />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <FeatureCard
              icon={ClipboardList}
              title="Histórico de trocas"
              desc="Consulta de trocas realizadas, pendentes e não realizadas por mês para melhorar rastreabilidade operacional."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Verificador de conflitos"
              desc="A plataforma aponta possíveis sobreposições de médicos no mesmo período entre hospitais ou unidades."
            />
            <FeatureCard
              icon={MessageSquareText}
              title="Mensagem do plantão"
              desc="Geração automática do texto diário com plantonistas separados por turno, pronto para copiar e revisar."
            />
            <FeatureCard
              icon={MapPin}
              title="Confirmação auxiliar"
              desc="Quando disponível, permite registro declaratório de chegada ou assunção de plantão como apoio operacional."
            />
          </div>
        </div>
      </section>

      <section id="operacao" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Operação real"
            title="O MedTurn foi desenhado para o fluxo que a coordenação vive todos os dias."
            desc="Não é só uma tela de escala. É uma camada operacional para acompanhar pendências, agir rápido e reduzir falhas de comunicação."
            center
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <StepCard
              number="1"
              title="A escala vira a fonte principal"
              desc="A coordenação mantém o mês organizado em um só lugar, por hospital, unidade, data e turno."
            />
            <StepCard
              number="2"
              title="O médico interage pelo app ou web"
              desc="O plantonista consulta a agenda, informa disponibilidade, responde ofertas e acompanha movimentações."
            />
            <StepCard
              number="3"
              title="A coordenação valida e acompanha"
              desc="Trocas aceitas, conflitos, avisos e relatórios aparecem em painéis de apoio à decisão."
            />
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            <ResultItem
              title="Central de pendências"
              desc="Trocas pendentes, ofertas direcionadas, aceite por outro médico e disponibilidades recentes aparecem em um só painel."
            />
            <ResultItem
              title="Prioridade agora"
              desc="O dashboard destaca o que exige ação: conflito detectado, troca aguardando confirmação ou operação sem pendências críticas."
            />
            <ResultItem
              title="Multihospital"
              desc="Coordenadores com acesso a mais de um hospital visualizam pendências relevantes de outras unidades."
            />
            <ResultItem
              title="Comunicação mais segura"
              desc="A mensagem diária e os avisos reduzem risco de nomes digitados errados e comunicações desencontradas."
            />
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-[#0A1A18] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-[1fr_2fr] lg:items-start">
            <div className="self-start lg:sticky lg:top-28">
              <Pill>Impacto operacional</Pill>
              <h2 className="mt-6 text-4xl font-black leading-tight text-white md:text-5xl">
                O ganho não é só digitalizar. É tirar peso da coordenação.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                Quando o fluxo passa a ter dono, tela, status e histórico, a
                escala deixa de depender de memória, print e reconferência manual.
              </p>

              <div className="mt-10 rounded-3xl border border-[#4AE2B6]/20 bg-[#4AE2B6]/5 p-6">
                <p className="text-sm font-bold text-[#4AE2B6]">
                  Resultado esperado na rotina:
                </p>
                <p className="mt-2 font-medium text-white">
                  Mais clareza para coordenar, mais previsibilidade para fechar e
                  menos ruído para a equipe médica.
                </p>
              </div>
            </div>

            <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
              {[
                {
                  t: "Menos dependência de WhatsApp",
                  d: "Trocas, avisos e disponibilidades ganham fluxo próprio, reduzindo perda de informação.",
                  icon: MessageSquareText,
                },
                {
                  t: "Aprovação com contexto",
                  d: "A coordenação vê quem pediu, quem aceitou, qual plantão está envolvido e o que precisa decidir.",
                  icon: UserCheck,
                },
                {
                  t: "Fechamento mais leve",
                  d: "Os dados de plantões e produção ficam mais organizados ao longo do mês.",
                  icon: Calculator,
                },
                {
                  t: "Equipe mais informada",
                  d: "Médicos consultam a própria rotina e recebem notificações sobre mudanças e oportunidades.",
                  icon: Smartphone,
                },
                {
                  t: "Rastreabilidade operacional",
                  d: "Históricos, logs e status ajudam a entender o que aconteceu sem depender de versões soltas.",
                  icon: Activity,
                },
                {
                  t: "Mais segurança na escala",
                  d: "O verificador de conflitos ajuda a apontar possíveis sobreposições antes que virem problema.",
                  icon: ShieldCheck,
                },
              ].map((item, index) => (
                <div key={index} className="group">
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

      <section
        id="ecossistema"
        className="border-t border-white/5 px-6 py-24 md:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Ecossistema completo"
            title="Duas experiências conectadas: coordenação e plantonista."
            desc="A gestão trabalha no painel web. O médico acompanha a rotina pelo app iOS ou pelo acesso web responsivo. Cada um vê o que precisa ver."
            center
          />

          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            <div className="group relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-8 transition-all hover:border-[#4AE2B6]/30 md:p-12">
              <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#4AE2B6]/5 blur-3xl transition-all group-hover:bg-[#4AE2B6]/10" />

              <Pill>Gestão & Coordenação</Pill>

              <h3 className="mt-6 text-3xl font-black text-white">
                Painel administrativo para decidir rápido.
              </h3>

              <p className="mt-4 text-zinc-400">
                Ambiente web para coordenadores acompanharem escala, pendências,
                trocas, conflitos, avisos, equipe médica e relatórios.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  {
                    t: "Ações rápidas",
                    d: "Escala mensal, mensagem do plantão, relatório, histórico, médicos e conflitos.",
                  },
                  {
                    t: "Central de pendências",
                    d: "Trocas e disponibilidades recentes organizadas por prioridade.",
                  },
                  {
                    t: "Gestão multi-hospital",
                    d: "Pendências de outros hospitais visíveis para quem coordena múltiplas unidades.",
                  },
                  {
                    t: "Avisos administrativos",
                    d: "Envio para todos do hospital ou para um médico específico.",
                  },
                ].map((item, index) => (
                  <li key={index} className="flex gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4AE2B6]/10 text-[#4AE2B6]">
                      <CheckCircle2 size={14} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.t}</p>
                      <p className="text-xs leading-relaxed text-zinc-500">
                        {item.d}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="group relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-b from-[#4AE2B6]/5 to-transparent p-8 transition-all hover:border-[#4AE2B6]/30 md:p-12">
              <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#4AE2B6]/10 blur-3xl transition-all group-hover:bg-[#4AE2B6]/20" />

              <Pill>Plantonistas & Médicos</Pill>

              <h3 className="mt-6 text-3xl font-black text-white">
                Agenda e interações na palma da mão.
              </h3>

              <p className="mt-4 text-zinc-400">
                O médico acompanha a própria escala, informa disponibilidade,
                participa de trocas, recebe avisos e consulta oportunidades.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: "App iOS",
                    icon: Smartphone,
                  },
                  {
                    title: "Web responsiva",
                    icon: MonitorSmartphone,
                  },
                  {
                    title: "Notificações",
                    icon: BellRing,
                  },
                  {
                    title: "Disponibilidade",
                    icon: CalendarDays,
                  },
                  {
                    title: "Trocas de plantão",
                    icon: Repeat,
                  },
                  {
                    title: "Confirmação auxiliar",
                    icon: MapPin,
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors group-hover:bg-white/[0.08]"
                  >
                    <item.icon className="mb-2 text-[#4AE2B6]" size={20} />
                    <p className="text-xs font-bold leading-tight text-white">
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[32px] border border-amber-400/10 bg-amber-400/5 p-6">
            <div className="flex gap-4">
              <AlertCircle className="mt-1 shrink-0 text-amber-300" />
              <p className="text-sm leading-relaxed text-zinc-400">
                A confirmação auxiliar de presença, quando disponível, é um recurso
                operacional e declaratório para apoio da gestão. Não substitui controle
                oficial de ponto, jornada, frequência, validação administrativa ou decisão
                da contratante.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="implantacao" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Implantação"
            title="Uma implementação segura para operações que não podem perder ritmo."
            desc="O MedTurn entra na rotina com mapeamento, configuração e acompanhamento, respeitando a forma como cada serviço organiza suas escalas."
            center
          />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <StepCard
              number="1"
              title="Mapeamento da rotina atual"
              desc="Entendimento do fluxo de escala, trocas, unidades, comunicação, produção e papel da coordenação."
            />
            <StepCard
              number="2"
              title="Configuração do ambiente"
              desc="Hospitais, usuários, perfis, unidades operacionais e fluxos são estruturados para a realidade do serviço."
            />
            <StepCard
              number="3"
              title="Adoção acompanhada"
              desc="Coordenação e equipe médica recebem orientação para reduzir ruído e acelerar o uso prático."
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
                  Quando a implantação respeita a realidade do serviço, a coordenação
                  sente menos peso na mudança, os plantonistas entendem melhor o fluxo
                  e a adoção acontece com mais consistência.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
                  <p className="text-sm font-bold text-white">
                    Apoio real na implantação
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    O início é conduzido para reduzir dúvidas de uso e dar mais
                    segurança à gestão e à equipe médica.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
                  <p className="text-sm font-bold text-white">
                    Configuração compatível com a operação
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    O MedTurn se adapta à lógica do serviço sem exigir que a
                    coordenação quebre toda a rotina para começar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

<section className="border-y border-white/5 bg-[#071312] px-6 py-24">
  <div className="mx-auto max-w-6xl">
    <SectionHeading
      eyebrow="Custo invisível"
      title="A escala manual custa mais do que parece."
      desc="Antes de aparecer no financeiro, o custo da escala desorganizada aparece em desgaste operacional, mensagens perdidas, decisões sem rastreio e fechamento refeito manualmente."
      center
    />

    <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {[
{
  title: "Tempo da coordenação consumido",
  desc: "Horas gastas conferindo planilhas, prints, mensagens e versões diferentes da escala.",
  icon: Clock3,
},
        {
          title: "Erros de comunicação",
          desc: "Trocas, avisos e disponibilidades podem se perder quando tudo depende de conversas espalhadas.",
          icon: MessageSquareText,
        },
        {
          title: "Trocas fora do fluxo",
          desc: "Pedidos e aceitações sem centralização aumentam o risco de decisão sem contexto completo.",
          icon: Repeat,
        },
        {
          title: "Conflitos de escala",
          desc: "Médicos podem acabar escalados em mais de um local ou turno sem que a coordenação perceba a tempo.",
          icon: AlertCircle,
        },
        {
          title: "Fechamento refeito manualmente",
          desc: "Quando o mês não é organizado durante a rotina, a conferência final fica mais lenta e sujeita a erro.",
          icon: Calculator,
        },
        {
          title: "Desgaste da equipe",
          desc: "Quanto mais ruído na escala, maior o desgaste entre coordenação, plantonistas e gestão.",
          icon: Users,
        },
      ].map((item) => (
        <div
          key={item.title}
          className="rounded-[30px] border border-white/5 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05]"
        >
          <div className="mb-5 inline-flex rounded-2xl bg-[#4AE2B6]/10 p-3 text-[#4AE2B6]">
            <item.icon size={22} />
          </div>

          <h3 className="text-lg font-bold text-white">{item.title}</h3>

          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {item.desc}
          </p>
        </div>
      ))}
    </div>

    <div className="mt-10 rounded-[32px] border border-[#4AE2B6]/15 bg-[#4AE2B6]/5 p-8 text-center">
      <p className="mx-auto max-w-3xl text-lg font-semibold leading-8 text-white">
        O MedTurn ajuda a transformar esse custo invisível em uma operação
        acompanhável, com mais clareza para decidir, aprovar, comunicar e fechar o mês.
      </p>
    </div>
  </div>
</section>

      <section id="precos" className="bg-[#0A1A18] px-6 pb-20 pt-16">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Estrutura comercial"
            title="Uma proposta compatível com o tamanho do seu serviço."
            desc="O MedTurn foi pensado para hospitais e grupos que querem reduzir ruído na escala, aliviar a rotina da coordenação e ganhar previsibilidade operacional."
            center
          />

          <div className="mb-10 mt-10 rounded-[28px] border border-white/5 bg-white/[0.03] p-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4AE2B6]">
              Como o MedTurn se adapta à sua operação
            </p>
<p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
  O valor do MedTurn acompanha o tamanho da operação. Para serviços menores,
  uma unidade operacional pode ser suficiente. Para grupos com múltiplas
  frentes, o plano multiunidade reduz o custo proporcional e entrega mais
  controle para a coordenação.
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
                "Disponibilidade médica",
                "Notificações para médicos",
                "Relatório de produção",
                "Suporte comercial padrão",
              ]}
            />

            <PricingCard
              tier="Multiunidade"
              price="6.999,00"
              subtitle="Para até 3 unidades operacionais"
              valueLine="Para grupos que precisam dar padrão à operação, reduzir ruído entre unidades e aliviar a coordenação no dia a dia."
              highlight
              features={[
                "Até 3 unidades operacionais",
                "Tudo do plano Essencial",
                "Controle centralizado por unidade operacional",
                "Pendências multi-hospital",
                "Verificador de conflitos",
                "Histórico de trocas",
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
            Estrutura comercial a partir de R$ 2.999 por unidade operacional, com
            condições mais eficientes para operações multiunidade.
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
              O MedTurn ajuda hospitais e coordenações a organizar a escala, validar
              trocas, acompanhar pendências e conduzir o mês com muito menos ruído.
            </p>

            <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
<Link
  href="/solicitar-implantacao"
  className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#4AE2B6] px-10 text-base font-bold text-[#071312] shadow-[0_0_40px_-10px_#4AE2B6] transition-all duration-300 hover:scale-105 hover:bg-[#5cf2c5]"
>
  Solicitar proposta para meu serviço
</Link>

<Link
  href="#precos"
  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-10 text-base font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/10"
>
  Ver planos institucionais <ArrowRight size={16} />
</Link>
            </div>

            <p className="mt-8 text-sm text-zinc-500">
              Implantação assistida · App iOS · Web responsiva · Painel administrativo
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="font-black tracking-tighter text-white">
            MED<span className="text-[#4AE2B6]">TURN</span>
          </div>

          <div className="flex flex-col items-center gap-3 text-center md:items-end">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-zinc-500">
              <Link
                href="/terms"
                className="transition-colors hover:text-[#4AE2B6]"
              >
                Termos de Uso
              </Link>

              <Link
                href="/privacy"
                className="transition-colors hover:text-[#4AE2B6]"
              >
                Política de Privacidade
              </Link>
            </div>

            <p className="text-xs text-zinc-600">
              © 2026 MedTurn Tecnologia Ltda. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}