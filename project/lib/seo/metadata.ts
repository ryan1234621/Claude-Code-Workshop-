import type { Metadata } from 'next';
import type { Product } from '@/app/lib/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://parmore.com';

export function canonicalUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}

export function buildProductMetadata(product: Product): Metadata {
  const title = product.name;
  const description = `${product.description.slice(0, 155).trimEnd()}…`;
  const imageUrl = product.images[0];
  const url = canonicalUrl(`/shop/${product.slug}`);

  return {
    title,
    description,
    keywords: [
      product.name,
      product.subcategory ?? product.category,
      'golf apparel',
      'Parmore',
      ...(product.tags ?? []),
    ].filter(Boolean),
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: `${title} | Parmore`,
      description,
      siteName: 'Parmore',
      ...(imageUrl && {
        images: [{ url: imageUrl, width: 800, height: 1000, alt: product.name }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Parmore`,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export function buildPageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  imageUrl?: string;
  keywords?: string[];
}): Metadata {
  const url = canonicalUrl(opts.path);
  return {
    title: opts.title,
    description: opts.description,
    ...(opts.keywords && { keywords: opts.keywords }),
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: `${opts.title} | Parmore`,
      description: opts.description,
      siteName: 'Parmore',
      ...(opts.imageUrl && { images: [{ url: opts.imageUrl }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${opts.title} | Parmore`,
      description: opts.description,
      ...(opts.imageUrl && { images: [opts.imageUrl] }),
    },
  };
}
