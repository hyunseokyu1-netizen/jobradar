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
      './node_modules/arr-union/**',
      './node_modules/clone-deep/**',
      './node_modules/debug/**',
      './node_modules/deepmerge/**',
      './node_modules/for-in/**',
      './node_modules/for-own/**',
      './node_modules/fs-extra/**',
      './node_modules/is-buffer/**',
      './node_modules/is-extendable/**',
      './node_modules/is-plain-object/**',
      './node_modules/isobject/**',
      './node_modules/jsonfile/**',
      './node_modules/kind-of/**',
      './node_modules/lazy-cache/**',
      './node_modules/merge-deep/**',
      './node_modules/mixin-object/**',
      './node_modules/ms/**',
      './node_modules/playwright-extra/**',
      './node_modules/puppeteer-extra-plugin/**',
      './node_modules/puppeteer-extra-plugin-stealth/**',
      './node_modules/puppeteer-extra-plugin-user-data-dir/**',
      './node_modules/puppeteer-extra-plugin-user-preferences/**',
      './node_modules/shallow-clone/**',
      './node_modules/universalify/**',
    ],
  },
};

export default nextConfig;
