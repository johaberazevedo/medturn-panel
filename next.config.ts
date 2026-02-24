import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ✅ a chave é o PATH da rota (não o arquivo)
  outputFileTracingIncludes: {
    '/api/report/scale-pdf': [
      'node_modules/@sparticuz/chromium/**',
    ],
  },
};

export default nextConfig;