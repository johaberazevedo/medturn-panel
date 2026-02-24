import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    // ✅ aponte pro TS (fonte)
    "app/api/report/scale-pdf/route.ts": [
      "./node_modules/@sparticuz/chromium/**/*",
    ],
  },
};

export default nextConfig;