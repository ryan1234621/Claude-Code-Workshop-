import type { MetadataRoute } from 'next';
import { MOCK_PRODUCTS } from '@/app/lib/mockData';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://parmore.com';
const NOW = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: NOW,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/shop`,
      lastModified: NOW,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/returns`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  const productPages: MetadataRoute.Sitemap = MOCK_PRODUCTS
    .filter((p) => p.status === 'active')
    .map((p) => ({
      url: `${SITE_URL}/shop/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: p.featured || p.best_seller ? 0.9 : 0.8,
    }));

  return [...staticPages, ...productPages];
}
