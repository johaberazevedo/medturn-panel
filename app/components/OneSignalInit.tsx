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
    if (!enabled) return;
    if (bootedRef.current) return;
    bootedRef.current = true;

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    const existing = document.querySelector(
      'script[src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"]'
    );

    const initOneSignal = () => {
      window.OneSignalDeferred!.push(async function (OneSignal) {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_WEB_APP_ID,
          allowLocalhostAsSecureOrigin: true,
        });
      });
    };

    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      script.onload = initOneSignal;
      document.head.appendChild(script);
    } else {
      initOneSignal();
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !externalId) return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal) {
      await OneSignal.login(externalId);
    });
  }, [enabled, externalId]);

  return null;
}