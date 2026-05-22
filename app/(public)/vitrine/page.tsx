"use client";

import { useEffect, useRef, useState } from "react";
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
  Calculator,
  Smartphone,
  Clock3,
  AlertCircle,
  ClipboardList,
  MessageSquareText,
  RefreshCw,
  MapPin,
  MonitorSmartphone,
  type LucideIcon,
} from "lucide-react";
import {
  gsap,
  registerVitrineGsap,
  useGSAP,
} from "./_lib/gsap";

registerVitrineGsap();

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
                    desc: "Conferência mensal.",
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
                Pendências em outras unidades
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
  const [isScrolled, setIsScrolled] = useState(false);
  const heroScope = useRef<HTMLElement>(null);
  const painScope = useRef<HTMLElement>(null);

useEffect(() => {
  const handleScroll = () => {
    const heroBottom = heroScope.current?.offsetHeight ?? 0;

    setIsScrolled(window.scrollY >= heroBottom - 88);
  };

  handleScroll();

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleScroll);

  return () => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", handleScroll);
  };
}, []);

  const navLinks = [
    { href: "#problema", label: "O problema" },
    { href: "#solucao", label: "Solução" },
    { href: "#operacao", label: "Operação" },
    { href: "#ecossistema", label: "Ecossistema" },
    { href: "#implantacao", label: "Implantação" },
    { href: "#precos", label: "Planos" },
  ];

  useGSAP(
  () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      gsap.set(
        ".vitrine-hero-kicker, .vitrine-hero-word, .vitrine-hero-copy, .vitrine-hero-actions, .vitrine-hero-proof, .vitrine-hero-video",
        { autoAlpha: 1, y: 0, scale: 1 }
      );

      return;
    }

    gsap.set(".vitrine-hero-video", { scale: 1.025, autoAlpha: 0.9 });
    gsap.set(".vitrine-hero-tension", { autoAlpha: 1 });
    gsap.set(
      ".vitrine-hero-kicker, .vitrine-hero-word, .vitrine-hero-copy, .vitrine-hero-actions, .vitrine-hero-proof",
      { autoAlpha: 0, y: 16 }
    );

    const timeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      delay: 0.08,
    });

    timeline
      .to(".vitrine-hero-video", {
        autoAlpha: 1,
        scale: 1,
        duration: 0.55,
        ease: "expo.out",
      })
      .to(
        ".vitrine-hero-tension",
        {
          autoAlpha: 0,
          duration: 0.25,
          ease: "power3.out",
        },
        "-=0.25"
      )
      .to(
        ".vitrine-hero-kicker",
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.38,
        },
        "-=0.05"
      )
      .to(
        ".vitrine-hero-word",
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.07,
          ease: "power3.out",
        },
        "-=0.02"
      )
      .to(
        ".vitrine-hero-copy, .vitrine-hero-actions, .vitrine-hero-proof",
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          stagger: 0.08,
          ease: "power3.out",
        },
        "-=0.18"
      );

    return () => {
      timeline.kill();
    };
  },
  { scope: heroScope }
);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(".vitrine-pain-item", { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        ".vitrine-pain-item",
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          stagger: 0.07,
          ease: "power3.out",
          scrollTrigger: {
            trigger: painScope.current,
            start: "top 72%",
            once: true,
          },
        }
      );
    },
    { scope: painScope }
  );

  return (
    <div className="min-h-screen bg-[#F6FBF9] text-[#10201E] selection:bg-[#14B8A6]/20 selection:text-[#10201E]">
<header
  className={`fixed top-0 z-[100] w-full border-b transition-colors duration-300 ${
    isMenuOpen
      ? "border-[#D7E8E3] bg-[#F6FBF9]"
      : isScrolled
      ? "border-[#D7E8E3]/55 bg-[#F6FBF9]/58 backdrop-blur-md"
      : "border-white/10 bg-white/[0.03] backdrop-blur-sm"
  }`}
>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
<Link
  href="/"
  className={`flex items-center gap-3 transition-opacity hover:opacity-90 ${
    isMenuOpen || isScrolled ? "text-[#10201E]" : "text-white"
  }`}
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
<span
  className={`text-xl font-black tracking-tighter ${
    isMenuOpen || isScrolled ? "text-[#10201E]" : "text-white"
  }`}
>
  MED
  <span
    className={isMenuOpen || isScrolled ? "text-[#0F766E]" : "text-[#7DE8D4]"}
  >
    TURN
  </span>
</span>

<span
  className={`mt-1 hidden text-[10px] font-bold uppercase tracking-[0.18em] sm:block ${
    isMenuOpen || isScrolled ? "text-[#5F706D]" : "text-white/55"
  }`}
>
  Gestão inteligente de plantões
</span>
  </div>
</Link>

          <nav
  className={`hidden gap-8 text-sm font-medium md:flex ${
    isMenuOpen || isScrolled ? "text-[#5F706D]" : "text-white/60"
  }`}
>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
  isMenuOpen || isScrolled ? "hover:text-[#10201E]" : "hover:text-white"
}`}
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

<section
  ref={heroScope}
  className="relative flex min-h-[76svh] overflow-hidden bg-[#061312] px-6 py-12 text-white md:min-h-[74svh] md:py-16"
>
        <video
  className="vitrine-hero-video absolute inset-0 h-full w-full object-cover grayscale brightness-[0.72] contrast-110"
  autoPlay
  loop
  muted
  playsInline
  preload="metadata"
  poster="/og-medturn-vitrine.png"
  aria-hidden="true"
>
  <source src="/vitrine-hero.mp4" type="video/mp4" />
</video>

<div className="absolute inset-0 bg-[#0F766E]/30 mix-blend-multiply" />
<div className="absolute inset-0 bg-[#061312]/38" />
<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(20,184,166,0.30),transparent_34%),linear-gradient(180deg,rgba(6,19,18,0.50)_0%,rgba(6,19,18,0.72)_46%,rgba(6,19,18,0.94)_100%)]" />
<div className="vitrine-hero-tension pointer-events-none absolute inset-0 bg-[#061312]" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-center pb-6 pt-16 md:pb-4 md:pt-20">
          <div className="max-w-6xl">
            <p className="vitrine-hero-kicker max-w-4xl text-[10px] font-black uppercase leading-5 tracking-[0.24em] text-[#7DE8D4] md:text-xs">
              Para coordenações médicas, hospitais e grupos de plantão
            </p>

            <h1 className="mt-5 max-w-6xl text-[clamp(2.05rem,5.25vw,5.35rem)] font-black leading-[0.96] tracking-tight text-white">
              <span className="block overflow-hidden pb-2">
                <span className="vitrine-hero-word block">
                  O sistema operacional
                </span>
              </span>
              <span className="block overflow-hidden pb-2">
                <span className="vitrine-hero-word block text-[#7DE8D4]">
                  da coordenação médica.
                </span>
              </span>
              <span className="block overflow-hidden pb-2">
                <span className="vitrine-hero-word block">
                  Da escala ao fechamento do mês.
                </span>
              </span>
            </h1>

            <p className="vitrine-hero-copy mt-5 max-w-3xl text-sm leading-7 text-white/78 md:text-base md:leading-8">
              Centralize escala, trocas, disponibilidade, avisos e fechamento
              mensal em um fluxo único para a coordenação médica, com o
              plantonista conectado pelo app iOS ou pelo navegador.
            </p>

            <div className="vitrine-hero-actions mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/solicitar-implantacao"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#7DE8D4] px-6 text-xs font-black uppercase tracking-[0.08em] text-[#061312] shadow-[0_24px_60px_-28px_rgba(125,232,212,0.75)] transition-colors hover:bg-white md:h-14 md:px-7"
              >
                Solicitar proposta para meu serviço
                <ArrowRight className="ml-2" size={18} />
              </Link>

              <Link
                href="#operacao"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/18 bg-white/8 px-6 text-xs font-bold uppercase tracking-[0.08em] text-white backdrop-blur-md transition-colors hover:bg-white/14 md:h-14 md:px-7"
              >
                Ver como funciona <ArrowRight size={16} />
              </Link>
            </div>

<div className="vitrine-hero-proof mt-6 grid max-w-5xl gap-3 text-xs font-semibold text-white/78 sm:grid-cols-2 lg:grid-cols-4">
  {[
    "Trocas com aprovação da coordenação",
    "Pendências visíveis para a coordenação",
    "Conflitos identificados com antecedência",
    "Fechamento mais organizado",
  ].map((item) => (
    <div
      key={item}
      className="flex items-center gap-2 border-t border-white/14 pt-3"
    >
      <CheckCircle2 size={16} className="shrink-0 text-[#7DE8D4]" />
      {item}
    </div>
  ))}
</div>
          </div>
        </div>
      </section>

      <section
        className="border-y border-[#D7E8E3] bg-white px-6 py-12"
      >
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0F766E]">
            Em uso real
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#10201E] md:text-4xl">
            Já utilizado na gestão de escalas médicas em 3 hospitais.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-center text-base font-semibold leading-7 text-[#5F706D]">
            O MedTurn já apoia serviços hospitalares na organização de escalas,
            trocas de plantão, disponibilidade médica, pendências da coordenação
            e fechamento mensal.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="flex h-[132px] items-center justify-center rounded-[24px] border border-[#D7E8E3] bg-[#F6FBF9] px-6 shadow-[0_14px_35px_-30px_rgba(15,118,110,0.24)]">
              <Image
                src="/brand/logo-hgvc2.png"
                alt="Hospital Geral de Vitória da Conquista"
                width={320}
                height={110}
                sizes="(max-width: 768px) 260px, 320px"
                className="h-auto max-h-[98px] w-auto object-contain"
              />
            </div>

            <div className="flex h-[132px] items-center justify-center rounded-[24px] border border-[#D7E8E3] bg-[#F6FBF9] px-6 shadow-[0_14px_35px_-30px_rgba(15,118,110,0.24)]">
              <Image
                src="/brand/logo-afranio-peixoto2.png"
                alt="Hospital Afrânio Peixoto"
                width={546}
                height={182}
                sizes="(max-width: 768px) 390px, 546px"
                className="h-auto max-h-[118px] w-auto max-w-[98%] object-contain"
              />
            </div>

            <div className="flex h-[132px] items-center justify-center rounded-[24px] border border-[#D7E8E3] bg-[#F6FBF9] px-6 shadow-[0_14px_35px_-30px_rgba(15,118,110,0.24)]">
              <Image
                src="/brand/logo-esau-matos.png"
                alt="Hospital Municipal Esaú Matos"
                width={285}
                height={98}
                sizes="(max-width: 768px) 230px, 285px"
                className="h-auto max-h-[82px] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#F6FBF9] px-6 py-20 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0F766E]">
              Painel administrativo
            </p>

            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-[#10201E] md:text-5xl">
              A coordenação enxerga a operação inteira em uma única tela.
            </h2>

<p className="mt-4 text-base leading-7 text-[#5F706D] md:text-lg">
  Pendências, trocas aceitas, conflitos, avisos, disponibilidade
  médica, relatórios e ações rápidas ficam organizados para tomada
  de decisão.
</p>
          </div>

          <div className="w-full">
            <DashboardMock />
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
              sub="Plantões, trocas e movimentações chegam mais organizados para conferência final."
            />
          </div>
        </div>
      </section>

      <section
        id="problema"
        ref={painScope}
        className="bg-white px-6 py-16 md:py-20"
      >
        <div className="mx-auto max-w-6xl">
<SectionHeading
  eyebrow="O problema"
  title="A escala não quebra só quando falta médico. Ela quebra quando a informação se perde."
  desc="Pedido de troca no WhatsApp, disponibilidade perdida em mensagem, PDF desatualizado, médico em dois lugares e fechamento conferido no fim do mês. Quando a informação se espalha, o peso cai na coordenação."
  center
/>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="vitrine-pain-item rounded-[28px] border border-[#D7E8E3] bg-[#F6FBF9] p-6 shadow-[0_18px_50px_-42px_rgba(15,118,110,0.25)]">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F766E]">
                Coordenação
              </p>
              <h3 className="mt-3 text-2xl font-black text-[#10201E]">
                Gestão operacional da escala.
              </h3>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-[#5F706D]">
                {[
                  "escala mensal centralizada por unidade;",
                  "trocas com fluxo de aprovação;",
                  "pendências e conflitos visíveis para decisão;",
                  "relatórios de apoio ao fechamento mensal.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <AlertCircle
                      size={17}
                      className="mt-1 shrink-0 text-amber-600"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="vitrine-pain-item rounded-[28px] border border-[#D7E8E3] bg-[#F6FBF9] p-6 shadow-[0_18px_50px_-42px_rgba(15,118,110,0.25)]">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0F766E]">
                Plantonistas
              </p>
              <h3 className="mt-3 text-2xl font-black text-[#10201E]">
                Acesso simples para a equipe médica.
              </h3>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-[#5F706D]">
                {[
                  "consulta da própria escala pelo celular ou navegador;",
                  "envio de disponibilidade para a coordenação;",
                  "participação em trocas de plantão pelo fluxo definido;",
                  "recebimento de avisos importantes da unidade.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2
                      size={17}
                      className="mt-1 shrink-0 text-[#0F766E]"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="solucao" className="bg-[#EEF8F5] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="A solução"
            title="Um sistema para conectar escala, equipe médica e coordenação."
            desc="O MedTurn transforma a escala em uma operação acompanhável: com fluxo de aprovação, central de pendências, avisos oficiais, visão por unidade, conflitos e relatórios de apoio."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <FeatureCard
              icon={CalendarDays}
              title="Escala mensal centralizada"
              desc="A coordenação mantém uma versão única da escala por unidade operacional, com acesso claro para a equipe."
            />
            <FeatureCard
              icon={Repeat}
              title="Trocas com fluxo validado"
              desc="Solicitações, ofertas direcionadas e aceitações passam pelo fluxo correto, com confirmação da coordenação."
            />
            <FeatureCard
              icon={BellRing}
              title="Avisos e notificações"
              desc="A coordenação pode enviar comunicados para um médico específico ou para todos os usuários da unidade."
            />
            <FeatureCard
              icon={Calculator}
              title="Relatórios de apoio ao fechamento"
              desc="Plantões, turnos, chefias e dados operacionais ficam organizados para apoiar a conferência do mês."
            />
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <FeatureCard
              icon={ClipboardList}
              title="Histórico de trocas"
              desc="Consulta de trocas pendentes, aceitas, canceladas e concluídas para melhorar rastreabilidade operacional."
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

          <div className="mt-12 rounded-[32px] border border-[#0F766E]/15 bg-white p-6 text-center shadow-[0_18px_50px_-40px_rgba(15,118,110,0.35)]">
            <p className="mx-auto max-w-2xl text-lg font-bold text-[#10201E]">
              Quer ver como esse fluxo encaixa na rotina do seu serviço?
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#5F706D]">
              A implantação começa pelo mapeamento da escala, das unidades e
              das regras que a coordenação já usa hoje.
            </p>
            <Link
              href="/solicitar-implantacao"
              className="mt-5 inline-flex h-12 items-center justify-center rounded-2xl bg-[#0F766E] px-6 text-sm font-black text-white transition-all hover:bg-[#0B4F4A]"
            >
              Solicitar proposta
              <ArrowRight className="ml-2" size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section id="operacao" className="bg-[#F6FBF9] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Operação real"
            title="O MedTurn foi desenhado para o fluxo que a coordenação vive todos os dias."
            desc="Não é só um calendário de plantões. É uma camada operacional para acompanhar pendências, agir rápido e reduzir falhas de comunicação."
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
              title="Visão multiunidade"
              desc="Coordenadores com acesso a mais de uma unidade visualizam pendências relevantes de outros serviços."
            />
            <ResultItem
              title="Comunicação mais segura"
              desc="A mensagem diária e os avisos reduzem risco de nomes digitados errados e comunicações desencontradas."
            />
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
            desc="A coordenação trabalha pelo painel web administrativo. O médico acompanha a rotina pelo app iOS ou acessa a própria conta pelo navegador, em uma experiência simples e adaptada ao celular."
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
                    d: "Escala mensal, mensagem do plantão, relatórios, histórico, médicos e conflitos.",
                  },
                  {
                    t: "Central de pendências",
                    d: "Trocas e disponibilidades recentes organizadas por prioridade.",
                  },
                  {
                    t: "Gestão multiunidade",
                    d: "Pendências de outras unidades visíveis para quem coordena múltiplos serviços.",
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
              desc="Entendimento do fluxo de escala, trocas, unidades, comunicação, fechamento e papel da coordenação."
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
  Você não recebe só um sistema. Recebe um fluxo implantado para a
  realidade do seu serviço.
</h3>
<p className="mt-4 text-sm leading-relaxed text-[#5F706D]">
  O MedTurn é configurado a partir da escala, das unidades, das
  regras e da forma como a coordenação já trabalha. A implantação
  ajuda a equipe a entender o fluxo e começar com mais segurança.
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

          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[28px] border border-[#D7E8E3] bg-[#F6FBF9] p-6 text-center md:flex-row md:text-left">
            <div>
              <p className="text-lg font-black text-[#10201E]">
                Quer avaliar a implantação no seu serviço?
              </p>
              <p className="mt-1 text-sm text-[#5F706D]">
                A proposta considera tamanho da equipe, unidades e rotina atual
                da coordenação.
              </p>
            </div>
            <Link
              href="/solicitar-implantacao"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-[#0F766E] px-6 text-sm font-black text-white transition-all hover:bg-[#0B4F4A]"
            >
              Solicitar proposta
              <ArrowRight className="ml-2" size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-[#D7E8E3] bg-[#F6FBF9] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Custo invisível"
            title="A escala manual custa mais do que parece."
            desc="Quando a escala depende de prints, planilhas e mensagens soltas, a coordenação paga o preço ao longo do mês: mais conferência manual, trocas sem histórico claro e conflitos percebidos tarde demais."
            center
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Tempo da coordenação consumido",
                desc: "Horas gastas conferindo planilhas, prints, mensagens e versões diferentes da escala.",
                icon: Clock3,
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
                title: "Fechamento manual",
                desc: "Quando o mês não é organizado durante a rotina, a conferência final fica mais lenta e sujeita a erro.",
                icon: Calculator,
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
        </div>
      </section>

      <section id="precos" className="bg-white px-6 pb-20 pt-16">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Estrutura comercial"
            title="Uma proposta compatível com o tamanho do seu serviço."
            desc="O MedTurn foi pensado para hospitais e grupos que querem estruturar a gestão de escala, comunicação com a equipe médica e fechamento operacional."
            center
          />

          <div className="mb-10 mt-10 rounded-[28px] border border-[#D7E8E3] bg-[#F6FBF9] p-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0F766E]">
              Como o MedTurn se adapta à sua operação
            </p>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-[#5F706D]">
              O valor do MedTurn acompanha o tamanho da operação. Uma unidade
              operacional é cada serviço com escala própria, como anestesia,
              cirurgia, UTI, pronto-socorro ou uma equipe médica específica.
              Para grupos com múltiplas frentes, o plano multiunidade reduz o
              custo proporcional e entrega mais controle para a coordenação.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <PricingCard
              tier="Essencial"
              price="1.500,00"
              subtitle="Para 1 unidade operacional"
              valueLine="Para serviços que querem organizar a escala, centralizar trocas e apoiar a rotina da coordenação."
              features={[
                "1 unidade operacional",
                "Até 100 usuários cadastrados",
                "Escala digital centralizada",
                "Trocas com aprovação",
                "Disponibilidade médica",
                "Notificações para médicos",
                "Mensagem do plantão",
                "Relatórios de apoio ao fechamento",
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
                "Pendências multiunidade",
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
            Planos a partir de R$ 1.500 por unidade operacional, com até 100
            usuários cadastrados e condições especiais para grupos, múltiplas
            unidades e contratos anuais.
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
                a: "Unidade operacional é cada serviço, hospital, setor ou frente de escala que funciona com rotina própria de plantões, equipe, coordenação e fechamento. Por exemplo: uma UTI, um pronto-socorro, um serviço de cirurgia ou uma equipe de anestesia.",
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
                <h3 className="text-lg font-black text-[#10201E]">
                  {item.q}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#5F706D]">
                  {item.a}
                </p>
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
        Dê mais previsibilidade à rotina da coordenação médica.
      </h2>

      <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#D9FFF7]">
        O MedTurn ajuda sua equipe a trabalhar com uma referência única,
        acompanhar pendências em tempo real e tomar decisões com mais clareza
        ao longo do mês.
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
        Painel administrativo · App iOS · Acesso web · Implantação assistida
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
