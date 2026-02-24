import type { NextConfig } from "next";

const nextConfig = {
  // ✅ precisa ficar NO ROOT (não em experimental)
  outputFileTracingIncludes: {
    // inclui chromium + brotli files dentro da serverless function
    "app/api/report/scale-pdf/route.ts": [
      "./node_modules/@sparticuz/chromium/**",
      "./node_modules/@sparticuz/chromium-min/**",
    ],
  },
} satisfies NextConfig as NextConfig;

export default nextConfig;