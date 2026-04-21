import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'playwright',
    'playwright-core',
    'playwright-extra',
    'puppeteer-extra',
    'puppeteer-extra-plugin-stealth',
    'puppeteer-extra-plugin',
    'merge-deep',
    'clone-deep',
    'is-plain-object',
  ],
  outputFileTracingIncludes: {
    '/api/scrape': [
      './node_modules/is-plain-object/**',
      './node_modules/clone-deep/**',
      './node_modules/merge-deep/**',
      './node_modules/lazy-cache/**',
      './node_modules/for-own/**',
      './node_modules/shallow-clone/**',
      './node_modules/kind-of/**',
    ],
  },
};

export default nextConfig;
