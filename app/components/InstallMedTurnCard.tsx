'use client';

import { useEffect, useState } from 'react';

const DISMISS_KEY = 'medturn_install_card_dismissed_until';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
}

export default function InstallMedTurnCard() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone = isStandaloneMode();
    if (standalone) return;

    const dismissedUntil = window.localStorage.getItem(DISMISS_KEY);
    const now = Date.now();

    if (!dismissedUntil) {
      setVisible(true);
      return;
    }

    const dismissedUntilTs = Number(dismissedUntil);

    if (Number.isNaN(dismissedUntilTs) || now >= dismissedUntilTs) {
      window.localStorage.removeItem(DISMISS_KEY);
      setVisible(true);
      return;
    }

    setVisible(false);
  }, []);

  function handleDismiss() {
    if (typeof window !== 'undefined') {
      const nextShowAt = Date.now() + SEVEN_DAYS_MS;
      window.localStorage.setItem(DISMISS_KEY, String(nextShowAt));
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="w-full bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-2xl">
            📲
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
              Instale o MedTurn
            </h2>
            <p className="text-xs text-slate-500">
              Abra mais rápido pela tela inicial do seu Android
            </p>
          </div>
        </div>

        <div className="text-slate-400 text-xl">
          {open ? '−' : '+'}
        </div>
      </button>

      {open && (
        <div className="mt-4 pl-16">
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              No Chrome do Android, abra o menu de <span className="font-bold">3 pontinhos</span> e toque em{' '}
              <span className="font-bold">Adicionar à tela inicial</span> ou{' '}
              <span className="font-bold">Instalar app</span>, se essa opção aparecer.
            </p>

            <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
              Isso deixa o acesso mais rápido e com sensação mais próxima de app.
            </p>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleDismiss}
                className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
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