"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
    <span className="inline-flex items-center rounded-full border border-[#0F766E]/20 bg-[#E0FDF8] px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest text-[#0F766E]">
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
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0F766E]">
          {eyebrow}
        </p>
      ) : null}

      <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#10201E] md:text-5xl">
        {title}
      </h2>

      {desc ? (
        <p
          className={`mt-5 text-lg leading-8 text-[#5F706D] ${
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
    <div className="rounded-[28px] border border-[#D7E8E3] bg-white p-6 shadow-[0_18px_50px_-35px_rgba(15,118,110,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-[#0F766E]/25">
      <p className="text-3xl font-black tracking-tight text-[#10201E] md:text-4xl">
        {value}
      </p>
      <p className="mt-2 font-bold text-[#10201E]">{label}</p>
      {sub ? (
        <p className="mt-1 text-xs leading-relaxed text-[#5F706D]">{sub}</p>
      ) : null}
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
    <div className="group relative overflow-hidden rounded-[32px] border border-[#D7E8E3] bg-white p-8 shadow-[0_18px_50px_-38px_rgba(15,118,110,0.3)] transition-all duration-300 hover:-translate-y-1 hover:border-[#0F766E]/25 hover:shadow-[0_24px_60px_-35px_rgba(15,118,110,0.42)]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#E0FDF8]/0 to-[#E0FDF8] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative z-10 mb-6 inline-flex rounded-2xl bg-[#E0FDF8] p-4 text-[#0F766E] transition-colors group-hover:bg-[#0F766E] group-hover:text-white">
        <Icon size={24} strokeWidth={2} />
      </div>

      <h3 className="relative z-10 text-xl font-bold text-[#10201E]">
        {title}
      </h3>

      <p className="relative z-10 mt-3 text-sm leading-relaxed text-[#5F706D]">
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
    <div className="flex gap-4 rounded-[30px] border border-[#D7E8E3] bg-white px-5 py-5 shadow-[0_16px_45px_-38px_rgba(15,118,110,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-[#0F766E]/25">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E0FDF8] text-[#0F766E]">
        <CheckCircle2 size={17} strokeWidth={2.4} />
      </div>

      <div>
        <h3 className="text-[19px] font-bold leading-snug text-[#10201E]">
          {title}
        </h3>
        <p className="mt-2 text-[15px] leading-7 text-[#5F706D]">{desc}</p>
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
    <div className="rounded-[32px] border border-[#D7E8E3] bg-white p-8 shadow-[0_18px_50px_-38px_rgba(15,118,110,0.3)] transition-all duration-300 hover:-translate-y-1 hover:border-[#0F766E]/25">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E0FDF8] text-lg font-black text-[#0F766E]">
        {number}
      </div>
      <h3 className="mt-6 text-xl font-bold text-[#10201E]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#5F706D]">{desc}</p>
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
          ? "border-2 border-[#0F766E]/35 bg-gradient-to-b from-[#E0FDF8] via-white to-[#F6FBF9] shadow-[0_24px_65px_-34px_rgba(15,118,110,0.45)]"
          : "border border-[#D7E8E3] bg-white shadow-[0_18px_50px_-40px_rgba(15,118,110,0.3)]"
      }`}
    >
      {highlight ? (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#0F766E] px-4 py-1 text-[11px] font-black uppercase text-white">
          Pacote recomendado
        </span>
      ) : null}

      <div>
        <h3 className="text-[22px] font-black tracking-tight text-[#10201E]">
          {tier}
        </h3>
        <p className="mt-1.5 text-sm text-[#5F706D]">{subtitle}</p>
      </div>

      <div className="mt-5 flex items-end gap-1">
        {price === "Sob proposta" ? (
          <span className="text-4xl font-black tracking-tight text-[#10201E]">
            {price}
          </span>
        ) : (
          <>
            <span className="mb-1 text-sm text-[#5F706D]">R$</span>
            <span className="text-4xl font-black tracking-tight text-[#10201E]">
              {price}
            </span>
            <span className="mb-1 text-sm text-[#5F706D]">/mês</span>
          </>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-[#D7E8E3] bg-[#EEF8F5] p-3">
        <p className="text-sm font-semibold leading-5 text-[#10201E]">
          {valueLine}
        </p>
      </div>

      <ul className="mt-5 flex-1 space-y-2.5 text-sm leading-5 text-[#5F706D]">
        {features.map((feature, index) => (
          <li key={index} className="flex gap-3">
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0 text-[#0F766E]"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/solicitar-implantacao"
        className={`mt-5 w-full rounded-xl py-3 text-center text-sm font-bold transition-all ${
          highlight
            ? "bg-[#0F766E] text-white hover:bg-[#0B4F4A]"
            : "border border-[#D7E8E3] bg-white text-[#10201E] hover:border-[#0F766E]/30 hover:bg-[#F6FBF9]"
        }`}
      >
        Solicitar proposta
      </Link>
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="relative w-full">
      <div className="absolute -inset-5 rounded-[40px] bg-[#14B8A6]/15 blur-3xl" />

      <div className="relative overflow-hidden rounded-[34px] border border-[#D7E8E3] bg-white p-4 shadow-[0_30px_90px_-45px_rgba(15,118,110,0.45)]">
        <div className="mb-4 flex items-center justify-between rounded-[24px] border border-[#D7E8E3] bg-[#F6FBF9] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E0FDF8] text-[#0F766E]">
              <CalendarDays size={24} />
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#0F766E]">
                MedTurn • Painel administrativo
              </p>
              <h3 className="mt-1 text-lg font-black tracking-tight text-[#10201E]">
                Hospital São Lucas
              </h3>
              <p className="mt-1 text-[10px] font-semibold text-[#5F706D]">
                Logado como: Coordenação
              </p>
            </div>
          </div>

          <span className="hidden rounded-2xl bg-[#E0FDF8] px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-[#0F766E] sm:inline-flex">
            Online
          </span>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.3fr_0.85fr]">
          <section className="space-y-3">
            <div className="rounded-[26px] border border-[#D7E8E3] bg-[#F6FBF9] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#0F766E]">
                    Ações rápidas
                  </p>
                  <h3 className="mt-1 text-base font-black tracking-tight text-[#10201E]">
                    Rotina da coordenação
                  </h3>
                </div>

                <span className="rounded-2xl border border-[#D7E8E3] bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-[#5F706D]">
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
                        ? "border-[#0F766E]/15 bg-[#E0FDF8]"
                        : item.tone === "warning"
                        ? "border-amber-200 bg-amber-50"
                        : "border-[#D7E8E3] bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex gap-2.5">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            item.tone === "warning"
                              ? "bg-amber-100 text-amber-600"
                              : "bg-[#E0FDF8] text-[#0F766E]"
                          }`}
                        >
                          <item.icon size={16} />
                        </div>

                        <div>
                          <p
                            className={`text-[8px] font-black uppercase tracking-widest ${
                              item.tone === "warning"
                                ? "text-amber-600"
                                : "text-[#0F766E]"
                            }`}
                          >
                            {item.eyebrow}
                          </p>
                          <h4 className="mt-1 text-[13px] font-black text-[#10201E]">
                            {item.title}
                          </h4>
                        </div>
                      </div>

                      <span
                        className={`rounded-xl px-2 py-0.5 text-[8px] font-black ${
                          item.tone === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-[#F6FBF9] text-[#5F706D]"
                        }`}
                      >
                        {item.tag}
                      </span>
                    </div>

                    <p className="mt-2 text-[10px] leading-relaxed text-[#5F706D]">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-600">
                    Prioridade agora
                  </p>
                  <h3 className="mt-1 text-lg font-black tracking-tight text-[#10201E]">
                    2 conflito(s) detectado(s)
                  </h3>
                  <p className="mt-1 text-xs text-[#5F706D]">
                    Possível sobreposição de plantões no próximo mês.
                  </p>
                </div>

                <span className="w-fit rounded-2xl bg-amber-500 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                  Ver conflitos
                </span>
              </div>
            </div>

            <div className="rounded-[26px] border border-[#D7E8E3] bg-[#F6FBF9] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#0F766E]">
                    Guia operacional
                  </p>

                  <h3 className="mt-1 text-base font-black tracking-tight text-[#10201E]">
                    Próximos passos
                  </h3>
                </div>

                <div className="grid gap-2 text-[10px] leading-relaxed text-[#5F706D] sm:grid-cols-2">
                  {[
                    "Organizar escala mensal",
                    "Solicitar disponibilidade",
                    "Acompanhar relatório",
                    "Enviar aviso aos plantonistas",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-2xl border border-[#D7E8E3] bg-white px-3 py-1.5"
                    >
                      <CheckCircle2
                        size={12}
                        className="shrink-0 text-[#0F766E]"
                      />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="rounded-[26px] border border-[#D7E8E3] bg-[#F6FBF9] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#0F766E]">
                    Central de pendências
                  </p>
                  <h3 className="mt-1 text-base font-black tracking-tight text-[#10201E]">
                    Trocas e disponibilidade
                  </h3>
                </div>

                <RefreshCw size={15} className="text-[#5F706D]" />
              </div>

              <div className="mt-3 space-y-2.5">
                <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#10201E]">
                      Dra. Marina
                    </span>
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[9px] text-sky-700">
                      Em processo
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] leading-relaxed text-[#5F706D]">
                    <span className="font-bold text-emerald-700">
                      ● Dr. João aceitou
                    </span>{" "}
                    a troca — clique para confirmar
                  </p>

                  <div className="mt-1.5 text-[9px] text-[#7A8B87]">
                    Sex, 15/05/2026 • Noite
                  </div>
                </div>

                <div className="rounded-[22px] border border-blue-200 bg-blue-50 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#10201E]">
                      Dr. Pedro
                    </span>
                    <span className="rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[9px] text-blue-700">
                      Oferta direcionada
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] leading-relaxed text-[#5F706D]">
                    Oferta enviada para Dra. Ana aguardando aceite.
                  </p>

                  <div className="mt-1.5 text-[9px] text-[#7A8B87]">
                    Sáb, 16/05/2026 • Tarde
                  </div>
                </div>

                <div className="h-px bg-[#D7E8E3]" />

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#5F706D]">
                      Disponibilidades
                    </p>

                    <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-[#5F706D]">
                      8
                    </span>
                  </div>

                  <div className="mt-2 space-y-2">
                    {[
                      [
                        "Dra. Camila",
                        "17/05/2026",
                        "Manhã",
                        "text-emerald-700 bg-emerald-100",
                      ],
                      [
                        "Dr. Rafael",
                        "18/05/2026",
                        "Noite",
                        "text-purple-700 bg-purple-100",
                      ],
                    ].map(([name, date, period, chip]) => (
                      <div
                        key={name}
                        className="rounded-2xl border border-[#D7E8E3] bg-white px-3 py-2.5 text-[10px]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#10201E]">
                            {name}
                          </span>
                          <span className="text-[9px] text-[#7A8B87]">
                            14/05
                          </span>
                        </div>

                        <div className="mt-1.5 text-[#5F706D]">
                          Disp. para{" "}
                          <strong className="text-[#10201E]">{date}</strong>
                        </div>

                        <span
                          className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[9px] ${chip}`}
                        >
                          {period}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-[#0F766E]/15 bg-[#E0FDF8] p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0F766E]">
                Multihospital
              </p>

              <h3 className="mt-1 text-base font-black tracking-tight text-[#10201E]">
                Pendências em outros hospitais
              </h3>

              <p className="mt-1.5 text-[10px] leading-relaxed text-[#5F706D]">
                Trocas aceitas por outro médico aguardando confirmação.
              </p>

              <div className="mt-3 rounded-3xl border border-[#0F766E]/10 bg-white px-3 py-2.5 text-[10px]">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-black text-[#10201E]">Hospital Norte</p>
                    <p className="mt-1 font-bold text-[#0F766E]">
                      2 aguardando confirmação
                    </p>
                  </div>

                  <span className="whitespace-nowrap rounded-2xl bg-[#EEF8F5] px-3 py-1.5 text-[9px] font-black text-[#0F766E]">
                    Abrir
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-4 rounded-[24px] border border-[#D7E8E3] bg-[#F6FBF9] px-4 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0F766E]">
                Visão demonstrativa
              </p>

              <p className="mt-1 text-[11px] leading-relaxed text-[#5F706D]">
                Interface baseada no painel administrativo real em uso.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {["Escala", "Trocas", "Conflitos", "Relatórios"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#D7E8E3] bg-white px-3 py-1 text-[9px] font-bold text-[#5F706D]"
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
    <div className="min-h-screen bg-[#F6FBF9] text-[#10201E] selection:bg-[#14B8A6]/20 selection:text-[#10201E]">
      <header
        className={`fixed top-0 z-[100] w-full border-b border-[#D7E8E3] transition-colors duration-300 ${
          isMenuOpen ? "bg-[#F6FBF9]" : "bg-[#F6FBF9]/85 backdrop-blur-lg"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
<Link
  href="/"
  className="flex items-center gap-3 text-[#10201E] transition-opacity hover:opacity-90"
>
  <Image
    src="/medturn-logo-transparent.png"
    alt="MedTurn"
    width={52}
    height={52}
    className="h-12 w-12 object-contain"
    priority
  />

  <div className="flex flex-col leading-none">
    <span className="text-xl font-black tracking-tighter text-[#10201E]">
      MED<span className="text-[#0F766E]">TURN</span>
    </span>

    <span className="mt-1 hidden text-[10px] font-bold uppercase tracking-[0.18em] text-[#5F706D] sm:block">
      Gestão inteligente de plantões
    </span>
  </div>
</Link>

          <nav className="hidden gap-8 text-sm font-medium text-[#5F706D] md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-[#10201E]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden rounded-xl border border-[#D7E8E3] bg-white px-5 py-2 text-sm font-bold text-[#10201E] shadow-sm transition-all hover:border-[#0F766E]/30 hover:bg-[#EEF8F5] md:block"
            >
              Entrar
            </Link>

            <button
              type="button"
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-[#D7E8E3] bg-white text-[#10201E] transition-colors hover:bg-[#EEF8F5] md:hidden"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        <div
          aria-hidden={!isMenuOpen}
          className={`fixed bottom-0 left-0 right-0 top-[76px] z-40 isolate overflow-y-auto bg-[#F6FBF9] p-8 transition-[transform,opacity] duration-300 md:hidden ${
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
                className="text-[#5F706D] transition-colors hover:text-[#0F766E]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="space-y-4 pt-10">
            <Link
              href="/login"
              onClick={() => setIsMenuOpen(false)}
              className="flex h-16 items-center justify-center rounded-2xl border border-[#D7E8E3] bg-white text-lg font-bold text-[#10201E]"
            >
              Entrar no sistema
            </Link>

            <Link
              href="/solicitar-implantacao"
              onClick={() => setIsMenuOpen(false)}
              className="flex h-16 items-center justify-center rounded-2xl bg-[#0F766E] text-lg font-bold text-white"
            >
              Solicitar proposta
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 pb-20 pt-40 md:pb-28 md:pt-48">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[620px] w-full max-w-5xl -translate-x-1/2 bg-[#CCFBF1]/70 blur-[120px]" />
          <div className="absolute left-1/2 top-10 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[#14B8A6]/15 blur-[120px]" />
          <div className="absolute right-[-120px] top-16 h-[360px] w-[360px] rounded-full bg-[#0F766E]/10 blur-[120px]" />
          <div className="absolute left-[-100px] bottom-0 h-[320px] w-[320px] rounded-full bg-[#14B8A6]/10 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <Pill>Para coordenações médicas, hospitais e grupos de plantão</Pill>

            <h1 className="mt-8 text-4xl font-black leading-[1.02] tracking-tight text-[#10201E] sm:text-5xl md:text-7xl lg:leading-[1.02]">
  O sistema operacional da coordenação médica.
  <br />
  <span className="bg-gradient-to-r from-[#0F766E] to-[#14B8A6] bg-clip-text text-transparent">
    Da escala ao fechamento do mês.
  </span>
</h1>

<p className="mx-auto mt-8 max-w-3xl text-base leading-7 text-[#5F706D] md:text-xl md:leading-8">
  O MedTurn centraliza escala, trocas, disponibilidades, avisos,
  conflitos, pendências e relatórios de produção em um fluxo único,
  claro e acompanhável para coordenações médicas — antes que a escala
  vire problema.
</p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row sm:flex-wrap">
              <Link
                href="/solicitar-implantacao"
                className="inline-flex h-16 items-center justify-center rounded-2xl bg-[#0F766E] px-8 text-base font-black text-white shadow-[0_18px_45px_-24px_rgba(15,118,110,0.7)] transition-all hover:scale-105 hover:bg-[#0B4F4A]"
              >
                Solicitar proposta para meu serviço
                <ArrowRight className="ml-2" size={18} />
              </Link>

              <Link
                href="#precos"
                className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl border border-[#D7E8E3] bg-white px-8 text-base font-bold text-[#10201E] shadow-sm transition-all hover:border-[#0F766E]/30 hover:bg-[#EEF8F5]"
              >
                Ver planos <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Trocas com aprovação da coordenação",
                "Pendências visíveis por hospital",
                "Conflitos identificados com antecedência",
                "Fechamento mensal mais organizado",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-[#D7E8E3] bg-white px-4 py-3 font-semibold text-[#10201E] shadow-sm"
                >
                  <CheckCircle2 size={16} className="text-[#0F766E]" />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-[#0F766E]/15 bg-[#E0FDF8] p-5">
                <p className="text-sm font-bold text-[#10201E]">
                  Você não recebe só um sistema.
                </p>

                <p className="mt-2 text-sm leading-relaxed text-[#5F706D]">
                  Recebe um fluxo implantado com acompanhamento, configurado
                  conforme a rotina do serviço e com orientação inicial para
                  coordenação e equipe médica.
                </p>
              </div>

              <div className="rounded-[28px] border border-[#D7E8E3] bg-white p-5 shadow-sm">
                <p className="text-sm font-bold text-[#10201E]">
                  Criado a partir da rotina real de plantões médicos.
                </p>

                <p className="mt-2 text-sm leading-relaxed text-[#5F706D]">
                  O MedTurn foi desenhado para problemas práticos de escala:
                  trocas, disponibilidade, conflitos, avisos, pendências e
                  fechamento mensal.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16">
  <div className="mb-8 max-w-3xl">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0F766E]">
      Painel administrativo
    </p>

    <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-[#10201E] md:text-5xl">
      A coordenação enxerga a operação inteira em uma única tela.
    </h2>

    <p className="mt-4 text-base leading-7 text-[#5F706D] md:text-lg">
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
    value="Menos dispersão"
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

      <section className="border-y border-[#D7E8E3] bg-white px-6 py-14">
  <div className="mx-auto max-w-6xl text-center">
<p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0F766E]">
  Em uso real
</p>

<h2 className="mt-3 text-3xl font-black tracking-tight text-[#10201E] md:text-4xl">
  Já utilizado na gestão de escalas médicas em 3 hospitais.
</h2>

<p className="mx-auto mt-5 max-w-3xl text-center text-base font-semibold leading-7 text-[#5F706D]">
  O MedTurn já apoia coordenações em serviços hospitalares reais, ajudando na
  organização da escala, nas trocas de plantão, no acompanhamento de pendências
  e no fechamento mensal.
</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="flex h-[140px] items-center justify-center rounded-[28px] border border-[#D7E8E3] bg-[#F6FBF9] px-6 shadow-[0_14px_35px_-28px_rgba(15,118,110,0.28)]">
              <Image
                src="/brand/logo-hgvc2.png"
                alt="Hospital Geral de Vitória da Conquista"
                width={320}
                height={110}
                sizes="(max-width: 768px) 260px, 320px"
                className="h-auto max-h-[105px] w-auto object-contain"
              />
            </div>

            <div className="flex h-[140px] items-center justify-center rounded-[28px] border border-[#D7E8E3] bg-[#F6FBF9] px-6 shadow-[0_14px_35px_-28px_rgba(15,118,110,0.28)]">
<Image
  src="/brand/logo-afranio-peixoto2.png"
  alt="Hospital Afrânio Peixoto"
  width={546}
  height={182}
  sizes="(max-width: 768px) 390px, 546px"
  className="h-auto max-h-[125px] w-auto max-w-[98%] object-contain"
/>
            </div>

            <div className="flex h-[140px] items-center justify-center rounded-[28px] border border-[#D7E8E3] bg-[#F6FBF9] px-6 shadow-[0_14px_35px_-28px_rgba(15,118,110,0.28)]">
<Image
  src="/brand/logo-esau-matos.png"
  alt="Hospital Municipal Esaú Matos"
  width={285}
  height={98}
  sizes="(max-width: 768px) 230px, 285px"
  className="h-auto max-h-[88px] w-auto object-contain"
/>
            </div>
          </div>
        </div>
      </section>

      <section
        id="problema"
        className="border-y border-[#D7E8E3] bg-white px-6 py-20 md:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="O problema"
                title="A escala não quebra só quando falta médico. Ela quebra quando a informação se perde."
                desc="Pedido de troca no WhatsApp, disponibilidade perdida em mensagem, PDF desatualizado, médico em dois lugares, produção sendo conferida no fim do mês. O peso cai na coordenação."
              />
            </div>

            <div className="space-y-5">
              <div className="flex gap-4 rounded-2xl border border-red-200 bg-red-50 p-5">
                <AlertCircle className="shrink-0 text-red-500" />
                <p className="text-sm leading-relaxed text-[#5F706D]">
                  <strong className="text-[#10201E]">
                    Informação espalhada:
                  </strong>{" "}
                  alterações importantes ficam entre planilhas, mensagens, PDFs
                  e conversas paralelas.
                </p>
              </div>

              <div className="flex gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5">
                <Clock3 className="shrink-0 text-orange-500" />
                <p className="text-sm leading-relaxed text-[#5F706D]">
                  <strong className="text-[#10201E]">Desgaste diário:</strong>{" "}
                  a coordenação precisa reconferir nomes, datas, turnos,
                  aceitações e pendências manualmente.
                </p>
              </div>

              <div className="flex gap-4 rounded-2xl border border-[#0F766E]/15 bg-[#E0FDF8] p-5">
                <TrendingUp className="shrink-0 text-[#0F766E]" />
                <p className="text-sm leading-relaxed text-[#5F706D]">
                  <strong className="text-[#10201E]">
                    Falta de previsibilidade:
                  </strong>{" "}
                  o fechamento fica pesado porque a operação não foi organizada
                  ao longo do mês.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="solucao" className="bg-[#EEF8F5] px-6 py-20">
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
              title="Relatório de produção e pagamento"
              desc="Plantões, turnos, chefias e regras de produção ficam organizados para apoiar a conferência e o fechamento financeiro."
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
  desc="Quando habilitada pela unidade, permite registro declaratório de chegada ou assunção de plantão como apoio operacional."
/>
          </div>
        </div>
      </section>

      <section id="operacao" className="bg-[#F6FBF9] px-6 py-24">
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
              title="O médico interage pelo app ou navegador"
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

      <section className="border-y border-[#D7E8E3] bg-white px-6 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-[1fr_2fr] lg:items-start">
            <div className="self-start lg:sticky lg:top-28">
              <Pill>Impacto operacional</Pill>
              <h2 className="mt-5 max-w-2xl text-[2rem] font-black leading-[1.12] tracking-tight text-[#10201E] sm:text-4xl md:text-5xl md:leading-tight">
  O ganho não é só colocar a escala online.
  <br />
  É dar previsibilidade à coordenação.
</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#5F706D] md:text-lg md:leading-relaxed">
  Quando o fluxo passa a ter dono, tela, status e histórico, a
  escala deixa de depender de memória, print e conferência
  manual.
</p>

              <div className="mt-10 rounded-3xl border border-[#0F766E]/20 bg-[#E0FDF8] p-6">
                <p className="text-sm font-bold text-[#0F766E]">
                  Resultado esperado na rotina:
                </p>
                <p className="mt-2 font-medium text-[#10201E]">
                  Mais clareza para coordenar, mais previsibilidade para fechar
                  e menos ruído para a equipe médica.
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
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E0FDF8] text-[#0F766E] transition-colors group-hover:bg-[#0F766E] group-hover:text-white">
                    <item.icon size={24} />
                  </div>
                  <h4 className="text-xl font-bold text-[#10201E]">
                    {item.t}
                  </h4>
                  <p className="mt-3 text-sm leading-6 text-[#5F706D]">
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
        className="border-t border-[#D7E8E3] bg-[#F6FBF9] px-6 py-24 md:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Ecossistema completo"
            title="Duas experiências conectadas: coordenação e plantonista."
            desc="A coordenação trabalha pelo painel web administrativo. O médico acompanha a rotina pelo app iOS ou acessa a própria conta pelo navegador, com uma experiência simples e adaptada ao celular."
            center
          />

          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            <div className="group relative overflow-hidden rounded-[40px] border border-[#D7E8E3] bg-white p-8 shadow-[0_20px_60px_-42px_rgba(15,118,110,0.35)] transition-all hover:border-[#0F766E]/25 md:p-12">
              <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#E0FDF8]/55 blur-3xl transition-all group-hover:bg-[#CCFBF1]/60" />

              <Pill>Gestão & Coordenação</Pill>

              <h3 className="relative z-10 mt-6 max-w-2xl text-3xl font-black leading-tight tracking-tight text-[#10201E] md:text-4xl">
  Painel administrativo para decidir rápido.
</h3>
              <p className="relative z-10 mt-4 text-[#5F706D]">
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
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E0FDF8] text-[#0F766E]">
                      <CheckCircle2 size={14} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#10201E]">
                        {item.t}
                      </p>
                      <p className="text-xs leading-relaxed text-[#5F706D]">
                        {item.d}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="group relative overflow-hidden rounded-[40px] border border-[#0F766E]/20 bg-[#E0FDF8] p-8 shadow-[0_20px_60px_-42px_rgba(15,118,110,0.45)] transition-all hover:border-[#0F766E]/35 md:p-12">
              <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#14B8A6]/15 blur-3xl transition-all group-hover:bg-[#14B8A6]/25" />

              <Pill>Plantonistas & Médicos</Pill>

              <h3 className="mt-6 text-3xl font-black text-[#10201E]">
                Agenda e interações na palma da mão.
              </h3>

             <p className="mt-4 text-[#5F706D]">
  O médico acompanha a própria escala, informa disponibilidade,
  participa de trocas, recebe avisos e consulta oportunidades pelo app iOS
  ou pela conta web acessada no navegador.
</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: "App iOS",
                    icon: Smartphone,
                  },
                  {
                    title: "Acesso pelo navegador",
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
                    className="rounded-2xl border border-[#0F766E]/10 bg-white p-4 transition-colors group-hover:border-[#0F766E]/20"
                  >
                    <item.icon className="mb-2 text-[#0F766E]" size={20} />
                    <p className="text-xs font-bold leading-tight text-[#10201E]">
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[32px] border border-amber-200 bg-amber-50 p-6">
            <div className="flex gap-4">
              <AlertCircle className="mt-1 shrink-0 text-amber-600" />
              <p className="text-sm leading-relaxed text-[#5F706D]">
                A confirmação auxiliar de presença, quando habilitada pela unidade contratante,
é um recurso operacional e declaratório para apoio da gestão. Não substitui
controle oficial de ponto, jornada, frequência, validação administrativa ou
decisão da contratante.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="implantacao" className="bg-white px-6 py-24">
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

          <div className="mt-10 rounded-[32px] border border-[#0F766E]/15 bg-[#E0FDF8] p-8 md:px-10 md:py-8">
            <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0F766E]">
                  O que isso significa na prática
                </p>
                <h3 className="mt-3 text-2xl font-black text-[#10201E]">
                  Menos resistência da equipe. Mais organização para a operação
                  andar.
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-[#5F706D]">
                  Quando a implantação respeita a realidade do serviço, a
                  coordenação sente menos peso na mudança, os plantonistas
                  entendem melhor o fluxo e a adoção acontece com mais
                  consistência.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[#0F766E]/10 bg-white p-5">
                  <p className="text-sm font-bold text-[#10201E]">
                    Apoio real na implantação
                  </p>
                  <p className="mt-2 text-sm text-[#5F706D]">
                    O início é conduzido para reduzir dúvidas de uso e dar mais
                    segurança à gestão e à equipe médica.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#0F766E]/10 bg-white p-5">
                  <p className="text-sm font-bold text-[#10201E]">
                    Configuração compatível com a operação
                  </p>
                  <p className="mt-2 text-sm text-[#5F706D]">
                    O MedTurn se adapta à lógica do serviço sem exigir que a
                    coordenação quebre toda a rotina para começar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#D7E8E3] bg-[#F6FBF9] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Custo invisível"
            title="A escala manual custa mais do que parece."
            desc="Antes de aparecer no financeiro, o custo da escala desorganizada aparece em desgaste operacional, mensagens perdidas, decisões sem rastreio e fechamento conferido manualmente."
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
                title: "Fechamento conferido manualmente",
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
                className="rounded-[30px] border border-[#D7E8E3] bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,118,110,0.3)] transition-all duration-300 hover:-translate-y-1 hover:border-[#0F766E]/25"
              >
                <div className="mb-5 inline-flex rounded-2xl bg-[#E0FDF8] p-3 text-[#0F766E]">
                  <item.icon size={22} />
                </div>

                <h3 className="text-lg font-bold text-[#10201E]">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-[#5F706D]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[32px] border border-[#0F766E]/15 bg-[#E0FDF8] p-8 text-center">
            <p className="mx-auto max-w-3xl text-lg font-semibold leading-8 text-[#10201E]">
              O MedTurn ajuda a transformar esse custo invisível em uma
              operação acompanhável, com mais clareza para decidir, aprovar,
              comunicar e fechar o mês.
            </p>
          </div>
        </div>
      </section>

      <section id="precos" className="bg-white px-6 pb-20 pt-16">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Estrutura comercial"
            title="Uma proposta compatível com o tamanho do seu serviço."
            desc="O MedTurn foi pensado para hospitais e grupos que querem organizar a escala, reduzir falhas de comunicação, aliviar a rotina da coordenação e ganhar previsibilidade operacional."
            center
          />

          <div className="mb-10 mt-10 rounded-[28px] border border-[#D7E8E3] bg-[#F6FBF9] p-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0F766E]">
              Como o MedTurn se adapta à sua operação
            </p>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-[#5F706D]">
              O valor do MedTurn acompanha o tamanho da operação. Para serviços
              menores, uma unidade operacional pode ser suficiente. Para grupos
              com múltiplas frentes, o plano multiunidade reduz o custo
              proporcional e entrega mais controle para a coordenação.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <PricingCard
  tier="Essencial"
  price="1.500,00"
  subtitle="Para 1 unidade operacional"
  valueLine="Para serviços que querem organizar a escala, centralizar trocas e dar mais previsibilidade à rotina da coordenação."
  features={[
    "1 unidade operacional",
    "Até 100 usuários cadastrados",
    "Escala digital centralizada",
    "Trocas com aprovação",
    "Disponibilidade médica",
    "Notificações para médicos",
    "Mensagem do plantão",
    "Relatório de produção e pagamento",
    "Suporte comercial padrão",
  ]}
/>

<PricingCard
  tier="Multiunidade"
  price="4.000,00"
  subtitle="Para até 3 unidades operacionais"
  valueLine="Para grupos que precisam padronizar a operação, acompanhar pendências entre unidades e reduzir falhas de comunicação."
  highlight
  features={[
    "Até 3 unidades operacionais",
    "Até 100 usuários cadastrados por unidade",
    "Tudo do plano Essencial",
    "Controle centralizado por unidade operacional",
    "Pendências multi-hospital",
    "Verificador de conflitos",
    "Histórico de trocas",
    "Custo proporcional menor por unidade",
  ]}
/>

<PricingCard
  tier="Enterprise"
  price="Sob proposta"
  subtitle="Para grupos maiores e operações personalizadas"
  valueLine="Para redes ou operações maiores que precisam de implantação assistida, expansão progressiva e proposta ajustada à realidade do serviço."
features={[
  "Mais de 3 unidades operacionais",
  "Mais de 100 usuários por unidade",
  "Estrutura comercial personalizada",
  "Condições por volume",
  "Acompanhamento institucional",
  "Possibilidade de expansão progressiva",
  "Modelo negociado conforme operação",
]}
/>
          </div>

<p className="mt-8 text-center text-sm text-[#5F706D]">
  Planos a partir de R$ 1.500 por unidade operacional, com até 100 usuários
  cadastrados e condições especiais para grupos, múltiplos hospitais e
  contratos anuais.
</p>
        </div>
      </section>

<section className="bg-[#F6FBF9] px-6 py-20">
  <div className="mx-auto max-w-4xl">
    <SectionHeading
      eyebrow="Dúvidas comuns"
      title="Perguntas frequentes antes da implantação."
      desc="Alguns pontos importantes para entender como o MedTurn entra na rotina do serviço."
      center
    />

    <div className="mt-10 space-y-4">
      {[
        {
          q: "O MedTurn funciona para médicos que não usam iPhone?",
          a: "Sim. O médico pode acompanhar a rotina pelo app iOS ou acessar a própria conta pelo navegador, em celular, tablet ou computador.",
        },
        {
          q: "O painel da coordenação é pelo navegador?",
          a: "Sim. A coordenação utiliza um painel web administrativo para acompanhar escala, trocas, pendências, conflitos, avisos e relatórios.",
        },
        {
          q: "O valor é por hospital?",
          a: "O valor é organizado por unidade operacional. Para grupos com mais de uma unidade, o plano Multiunidade oferece uma condição proporcional melhor.",
        },
{
  q: "O que é uma unidade operacional?",
  a: "Unidade operacional é cada serviço, hospital, setor ou frente de escala que funciona com rotina própria de plantões, equipe, coordenação e fechamento. Por exemplo: uma UTI, um pronto-socorro, um serviço de cirurgia, uma equipe de anestesia, que podem funcionar dentro de uma unidade hospitalar ou clínica.",
},
        {
          q: "A implantação tem acompanhamento?",
          a: "Sim. A implantação inclui mapeamento da rotina, configuração inicial do ambiente e orientação para coordenação e equipe médica.",
        },
        {
          q: "A confirmação de presença substitui ponto eletrônico?",
          a: "Não. Quando habilitada pela unidade contratante, a confirmação auxiliar é apenas um recurso operacional e declaratório de apoio à gestão.",
        },
      ].map((item) => (
        <div
          key={item.q}
          className="rounded-[28px] border border-[#D7E8E3] bg-white p-6 shadow-[0_18px_50px_-40px_rgba(15,118,110,0.25)]"
        >
          <h3 className="text-lg font-black text-[#10201E]">{item.q}</h3>
          <p className="mt-3 text-sm leading-7 text-[#5F706D]">{item.a}</p>
        </div>
      ))}
    </div>
  </div>
</section>

      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute inset-0 -z-10 bg-[#EEF8F5]" />

        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[40px] border border-[#0F766E]/20 bg-gradient-to-b from-[#0F766E] to-[#0B4F4A] p-10 text-center shadow-[0_24px_70px_-38px_rgba(15,118,110,0.55)] md:p-20">
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/10 to-transparent" />

            <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Sua operação pode funcionar com muito mais clareza, controle e
              previsibilidade.
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#D9FFF7]">
             O MedTurn ajuda hospitais e coordenações a organizar a escala,
validar trocas, acompanhar pendências e conduzir o mês com mais
clareza operacional.
            </p>

            <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
              <Link
                href="/solicitar-implantacao"
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-white px-10 text-base font-bold text-[#0B4F4A] shadow-[0_18px_40px_-28px_rgba(255,255,255,0.8)] transition-all duration-300 hover:scale-105 hover:bg-[#E0FDF8]"
              >
                Solicitar proposta para meu serviço
              </Link>

              <Link
                href="#precos"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-10 text-base font-bold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/15"
              >
                Ver planos <ArrowRight size={16} />
              </Link>
            </div>

            <p className="mt-8 text-sm text-[#BFF8EA]">
              Implantação assistida · App iOS · Acesso web pelo navegador · Painel
              administrativo
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#D7E8E3] bg-[#F6FBF9] px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
<div className="flex items-center gap-3">
  <Image
    src="/medturn-logo-transparent.png"
    alt="MedTurn"
    width={44}
    height={44}
    className="h-10 w-10 object-contain"
  />

  <div className="flex flex-col leading-none">
    <span className="text-lg font-black tracking-tighter text-[#10201E]">
      MED<span className="text-[#0F766E]">TURN</span>
    </span>

    <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#5F706D]">
      Gestão inteligente de plantões
    </span>
  </div>
</div>

          <div className="flex flex-col items-center gap-3 text-center md:items-end">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-[#5F706D]">
              <Link
                href="/terms"
                className="transition-colors hover:text-[#0F766E]"
              >
                Termos de Uso
              </Link>

              <Link
                href="/privacy"
                className="transition-colors hover:text-[#0F766E]"
              >
                Política de Privacidade
              </Link>
            </div>

            <p className="text-xs text-[#7A8B87]">
              © 2026 MedTurn Tecnologia Ltda. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}