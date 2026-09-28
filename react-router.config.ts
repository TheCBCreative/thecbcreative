import type { Config } from '@react-router/dev/config';
import { rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SERVICES } from './app/data/services';
import { SITE } from './app/data/site';

const PAGES = ['/', '/contact', ...SERVICES.map((service) => `/services/${service.slug}`)];

const sitemap = () =>
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map((page) => `  <url><loc>${SITE.url}${page === '/' ? '/' : page}</loc></url>`).join('\n')}
</urlset>
`;

const robots = () => `User-agent: *
Allow: /

Sitemap: ${SITE.url}/sitemap.xml
`;

// A plain-text summary for AI crawlers (llmstxt.org), built from the same data as the pages.
const llms = () => `# ${SITE.name}

> ${SITE.description}

${SITE.name} is a web design and development studio run by ${SITE.founder} in ${SITE.locality}, ${SITE.region}, serving the ${SITE.areaServed}. Every site is custom-designed and custom-coded, accessible from day one, and built for search engines and AI answer engines (AEO).

## Services

${SERVICES.map((service) => `- [${service.title}](${SITE.url}/services/${service.slug}): ${service.description.join(' ')}`).join('\n')}

## Pages

- [Home](${SITE.url}/): About ${SITE.founder}, services, and why human-built sites matter.
- [Contact](${SITE.url}/contact): Start a project — tell ${SITE.founder.split(' ')[0]} about your business and she'll reply personally.
`;

export default {
  ssr: false,
  // '/404' is caught by the "*" route; its HTML becomes 404.html, which Vercel serves for unknown URLs.
  prerender: [...PAGES, '/404'],
  async buildEnd({ reactRouterConfig }) {
    const client = path.join(reactRouterConfig.buildDirectory, 'client');
    await rename(path.join(client, '404', 'index.html'), path.join(client, '404.html'));
    await rm(path.join(client, '404'), { recursive: true, force: true });
    // Every page is pre-rendered, so the SPA fallback is never served.
    await rm(path.join(client, '__spa-fallback.html'), { force: true });
    await Promise.all([
      writeFile(path.join(client, 'sitemap.xml'), sitemap()),
      writeFile(path.join(client, 'robots.txt'), robots()),
      writeFile(path.join(client, 'llms.txt'), llms()),
    ]);
  },
} satisfies Config;
