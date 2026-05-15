// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import partytown from '@astrojs/partytown';
import icon from 'astro-icon';
import node from '@astrojs/node';

// https://astro.build/config
// `output: 'static'` keeps all pages prerendered at build time.
// The Node adapter is required so that endpoints with `prerender = false`
// (e.g. /api/send-quote) can run server-side at request time.
export default defineConfig({
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [react(), partytown(), icon()],
});
