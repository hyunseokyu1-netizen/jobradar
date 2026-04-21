import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sparticuz/chromium', 'playwright-core'],
  outputFileTracingIncludes: {
    '/api/scrape': ['./node_modules/@sparticuz/chromium/**', './node_modules/playwright-core/**'],
  },
};

export default nextConfig;
