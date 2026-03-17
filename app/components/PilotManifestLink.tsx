'use client';

import { useEffect } from 'react';

type Props = {
  enabled?: boolean;
};

export default function PilotManifestLink({ enabled = false }: Props) {
  useEffect(() => {
    if (!enabled) return;

    const existing = document.querySelector('link[rel="manifest"][href="/manifest.json"]');
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/manifest.json';
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [enabled]);

  return null;
}