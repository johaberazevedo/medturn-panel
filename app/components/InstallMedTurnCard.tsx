'use client';

import { useEffect, useState } from 'react';

const DISMISS_KEY = 'medturn_install_card_dismissed_until';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

function isIosDevice() {
  if (typeof window === 'undefined') return false;

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallMedTurnCard() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone = isStandaloneMode();
    if (standalone) return;

    setIsIos(isIosDevice());

    const dismissedUntil = window.localStorage.getItem(DISMISS_KEY);
    const now = Date.now();

    if (dismissedUntil) {
      const dismissedUntilTs = Number(dismissedUntil);

      if (!Number.isNaN(dismissedUntilTs) && now < dismissedUntilTs) {
        setVisible(false);
        return;
      }

      window.localStorage.removeItem(DISMISS_KEY);
    }

    setVisible(true);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
      setOpen(true);
    };

    const handleAppInstalled = () => {
      setVisible(false);
      setInstallPrompt(null);
      window.localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  function handleDismiss() {
    if (typeof window !== 'undefined') {
      const nextShowAt = Date.now() + SEVEN_DAYS_MS;
      window.localStorage.setItem(DISMISS_KEY, String(nextShowAt));
    }

    setVisible(false);
  }

  async function handleInstall() {
    if (!installPrompt) {
      setOpen(true);
      return;
    }

    setInstalling(true);

    try {
      await installPrompt.prompt();

      const choice = await installPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        setVisible(false);
        window.localStorage.removeItem(DISMISS_KEY);
      } else {
        handleDismiss();
      }

      setInstallPrompt(null);
    } catch (error) {
      console.warn('[InstallMedTurnCard] erro ao instalar:', error);
      setOpen(true);
    } finally {
      setInstalling(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="w-full rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-2xl">
            📲
          </div>

          <div>
            <h2 className="text-sm font-black uppercase tracking-tight text-slate-800">
              Instale o MedTurn
            </h2>

            <p className="text-xs text-slate-500">
              Acesse mais rápido direto pela tela inicial.
            </p>
          </div>
        </div>

        <div className="text-xl text-slate-400">{open ? '−' : '+'}</div>
      </button>

      {open && (
        <div className="mt-4 pl-16">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            {installPrompt ? (
              <>
                <p className="text-xs leading-relaxed text-slate-600">
                  Seu navegador permite instalar o MedTurn como app. Toque abaixo para adicionar à tela inicial.
                </p>

                <button
                  type="button"
                  onClick={handleInstall}
                  disabled={installing}
                  className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white active:scale-[0.99] disabled:opacity-60"
                >
                  {installing ? 'Abrindo...' : 'Instalar agora'}
                </button>
              </>
            ) : isIos ? (
              <>
                <p className="text-xs leading-relaxed text-slate-600">
                  No iPhone ou iPad, toque no botão de compartilhar do Safari e escolha{' '}
                  <span className="font-bold">Adicionar à Tela de Início</span>.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs leading-relaxed text-slate-600">
                  No Chrome ou Edge, procure a opção{' '}
                  <span className="font-bold">Instalar app</span> ou{' '}
                  <span className="font-bold">Adicionar à tela inicial</span>, quando ela estiver disponível.
                </p>
              </>
            )}

            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
              Isso deixa o acesso mais rápido e mais prático no dia a dia.
            </p>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-[11px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-600"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}