"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Send, X } from "lucide-react";
import type { SupportProduct } from "@/lib/support-chat/knowledge";
import type {
  SupportChatArea,
  SupportFlow,
} from "@/lib/support-chat/matcher";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type ChatResponse = {
  reply: string;
  product: SupportProduct;
  intent: string;
  requiresHandoff: boolean;
  confidence?: number;
  matchedTitle?: string;
  matchedScore?: number;
  activeFlow?: SupportFlow;
  collected?: Record<string, string>;
  supportSummary?: string;
};

type SupportChatWidgetProps = {
  area?: SupportChatArea;
};

const INITIAL_MESSAGE =
  "Olá! Sou o Assistente MedTurn. Posso te ajudar com escala, plantões, trocas, avisos, check-in, financeiro e painel administrativo. Me diga o que aconteceu.";

const QUICK_ACTIONS = [
  { label: "Painel", message: "Painel administrativo do MedTurn" },
  { label: "Escala", message: "Minha escala não aparece" },
  { label: "Troca de plantão", message: "Troca de plantão" },
  { label: "Avisos", message: "Enviar aviso administrativo" },
  { label: "Conflitos", message: "Ver conflitos" },
  { label: "Financeiro", message: "Relatório de pagamento" },
  { label: "Médicos", message: "Gerenciar médicos" },
];

function createMessage(role: ChatRole, content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
  };
}

function MessageText({ content }: { content: string }) {
  return (
    <div className="space-y-2">
      {content.split("\n").map((line, index) =>
        line.trim().length > 0 ? (
          <p key={`${line}-${index}`}>{line}</p>
        ) : (
          <div key={`gap-${index}`} className="h-1" />
        )
      )}
    </div>
  );
}

export function SupportChatWidget({ area = "admin" }: SupportChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage("assistant", INITIAL_MESSAGE),
  ]);
  const [input, setInput] = useState("");
  const [activeFlow, setActiveFlow] = useState<SupportFlow>("idle");
  const [collected, setCollected] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const hasConversation = messages.length > 1;

  const visibleQuickActions = useMemo(() => {
    if (hasConversation) return QUICK_ACTIONS.slice(0, 4);
    return QUICK_ACTIONS;
  }, [hasConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading]);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    setError("");
    setIsLoading(true);
    setMessages((current) => [...current, createMessage("user", trimmed)]);

    try {
      const response = await fetch("/api/support-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          context: {
            area,
            activeFlow,
            collected,
          },
        }),
      });

      const json = (await response.json()) as ChatResponse | { error?: string };

      if (!response.ok || !("reply" in json)) {
        throw new Error(
          "error" in json && json.error
            ? json.error
            : "Não foi possível responder agora."
        );
      }

      setActiveFlow(json.activeFlow ?? "idle");
      setCollected(json.collected ?? {});
      setMessages((current) => [
        ...current,
        createMessage("assistant", json.reply),
      ]);
    } catch (err) {
      console.error("[SupportChatWidget] Falha na resposta:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível responder agora.";
      setError(message);
      setMessages((current) => [
        ...current,
        createMessage(
          "assistant",
          "Não consegui processar sua mensagem agora. Tente novamente em instantes."
        ),
      ]);
    } finally {
      setIsLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 80);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[95] sm:right-5">
      {isOpen ? (
        <section className="mb-3 flex h-[min(640px,calc(100svh-2rem))] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-[26px] border border-[#40C0A2]/20 bg-white shadow-2xl shadow-zinc-950/20">
          <header className="relative overflow-hidden border-b border-white/10 bg-slate-950 px-4 py-4 text-white">
            <div className="absolute inset-x-0 top-0 h-px bg-[#40C0A2]/60" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/12 bg-white shadow-sm">
                  <Image
                    src="/medturn-logo-transparent.png"
                    alt="MedTurn"
                    width={44}
                    height={44}
                    className="h-11 w-11 object-contain"
                  />
                </div>

                <div>
                  <h2 className="text-[15px] font-black tracking-tight">
                    Assistente MedTurn
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-white/68">
                    Suporte do painel e app
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#40C0A2]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Pronto para ajudar
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar assistente"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.map((message) => {
              const isAssistant = message.role === "assistant";

              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    isAssistant ? "justify-start" : "justify-end"
                  }`}
                >
                  {isAssistant ? (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#40C0A2]/20 bg-white shadow-sm">
                      <Image
                        src="/medturn-logo-transparent.png"
                        alt="MedTurn"
                        width={32}
                        height={32}
                        className="h-8 w-8 object-contain"
                      />
                    </div>
                  ) : null}

                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm ${
                      isAssistant
                        ? "border border-zinc-200/90 bg-white text-zinc-700"
                        : "bg-[#0F766E] text-white shadow-[#0F766E]/10"
                    }`}
                  >
                    <MessageText content={message.content} />
                  </div>
                </div>
              );
            })}

            {isLoading ? (
              <div className="flex items-center gap-2 pl-10 text-xs font-bold text-zinc-500">
                <Loader2 size={14} className="animate-spin" />
                Respondendo...
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-zinc-200 bg-white px-4 py-3">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {visibleQuickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => void sendMessage(action.message)}
                  disabled={isLoading}
                  className="shrink-0 rounded-full border border-[#40C0A2]/20 bg-[#E0FDF8] px-3 py-1.5 text-xs font-bold text-[#0F766E] transition hover:border-[#40C0A2]/45 hover:bg-[#CCFBF1] hover:text-slate-950 disabled:cursor-wait disabled:opacity-60"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {error ? (
              <p className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </p>
            ) : null}

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Digite sua dúvida..."
                disabled={isLoading}
                maxLength={1200}
                className="min-w-0 flex-1 rounded-2xl border border-zinc-300 bg-white px-3.5 py-3 text-sm font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#40C0A2] focus:ring-2 focus:ring-[#40C0A2]/10 disabled:cursor-wait disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isLoading || input.trim().length === 0}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0F766E] text-white shadow-sm transition hover:bg-[#0F5F59] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Enviar mensagem"
                title="Enviar"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="ml-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-[#40C0A2]/25 bg-white shadow-2xl shadow-zinc-950/20 ring-4 ring-[#0F766E]/8 transition hover:scale-[1.03] hover:ring-[#40C0A2]/18"
        aria-label={isOpen ? "Minimizar assistente" : "Abrir assistente"}
        title={isOpen ? "Minimizar assistente" : "Abrir assistente"}
      >
        <Image
          src="/medturn-logo-transparent.png"
          alt="MedTurn"
          width={56}
          height={56}
          className="h-14 w-14 object-contain p-1.5"
        />
      </button>
    </div>
  );
}
