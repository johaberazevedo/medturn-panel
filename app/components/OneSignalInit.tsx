'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>;
  }
}

type Props = {
  externalId?: string | null;
  enabled?: boolean;
};

export default function OneSignalInit({ externalId, enabled = false }: Props) {
  const bootedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      console.log('[OneSignalInit] desabilitado');
      return;
    }

    if (bootedRef.current) {
      console.log('[OneSignalInit] já inicializado');
      return;
    }

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_WEB_APP_ID;

    console.log('[OneSignalInit] enabled =', enabled);
    console.log('[OneSignalInit] externalId =', externalId);
    console.log('[OneSignalInit] appId =', appId);

    if (!appId) {
      console.error('[OneSignalInit] NEXT_PUBLIC_ONESIGNAL_WEB_APP_ID não encontrado');
      return;
    }

    bootedRef.current = true;
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    const runInit = () => {
      window.OneSignalDeferred!.push(async function (OneSignal) {
        try {
          console.log('[OneSignalInit] callback executou');

          await OneSignal.init({
            appId,
            allowLocalhostAsSecureOrigin: true,
          });

          console.log('[OneSignalInit] init ok');

          if (externalId) {
            await OneSignal.login(externalId);
            console.log('[OneSignalInit] login ok:', externalId);
          } else {
            console.log('[OneSignalInit] sem externalId, pulando login');
          }
        } catch (error) {
          console.error('[OneSignalInit] erro no init/login:', error);
        }
      });
    };

    const existing = document.querySelector(
      'script[src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"]'
    ) as HTMLScriptElement | null;

    if (existing) {
      console.log('[OneSignalInit] script já existe');
      runInit();
      return;
    }

    console.log('[OneSignalInit] injetando script');

    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    script.onload = () => {
      console.log('[OneSignalInit] script carregado');
      runInit();
    };
    script.onerror = () => {
      console.error('[OneSignalInit] erro ao carregar script do OneSignal');
    };

    document.head.appendChild(script);
  }, [enabled, externalId]);

  return null;
}