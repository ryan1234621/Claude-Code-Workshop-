import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://parmore.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/account/', '/admin/', '/api/'],
      },
      {
        // AI search & answer engines — explicitly allowed to index product and policy pages
        userAgent: ['GPTBot', 'Claude-Web', 'PerplexityBot', 'Amazonbot', 'Applebot-Extended'],
        allow: ['/', '/shop/', '/returns', '/llms.txt'],
        disallow: ['/account/', '/admin/', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
