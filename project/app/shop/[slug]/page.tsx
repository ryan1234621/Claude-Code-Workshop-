import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MOCK_PRODUCTS } from '@/app/lib/mockData';
import {
  buildProductSchema,
  buildOrganizationSchema,
  buildFaqSchema,
  buildBreadcrumbSchema,
} from '@/lib/seo/schemaGenerators';
import { buildProductMetadata, canonicalUrl } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { TechnicalSpecGrid } from '@/components/seo/TechnicalSpecGrid';
import { AeoFaqSection } from '@/components/seo/AeoFaqSection';
import { ProductPageClient } from './ProductPageClient';
import type { Product } from '@/app/lib/types';
import type { FaqItem } from '@/components/seo/AeoFaqSection';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://parmore.com';

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  return MOCK_PRODUCTS
    .filter((p) => p.status === 'active')
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = MOCK_PRODUCTS.find((p) => p.slug === params.slug);
  if (!product) return { title: 'Product Not Found' };
  return buildProductMetadata(product);
}

function buildProductFaqs(product: Product): FaqItem[] {
  const colors = [...new Set(product.variants.map((v) => v.color.name))];
  const sizes  = [...new Set(product.variants.flatMap((v) => v.sizes.map((s) => s.label)))];
  const colorList = colors.length > 1
    ? `${colors.slice(0, -1).join(', ')} and ${colors[colors.length - 1]}`
    : colors[0] ?? 'one color';

  return [
    {
      question: `What sizes does the ${product.name} come in?`,
      answer: `The ${product.name} is available in ${sizes.join(', ')}. If your size shows as out of stock, check back — stock is replenished regularly.`,
    },
    ...(product.materials ? [{
      question: `What is the ${product.name} made from?`,
      answer: `The ${product.name} is crafted from ${product.materials}, chosen for performance and durability on the course.`,
    }] : []),
    ...(product.fit_guide ? [{
      question: `How does the ${product.name} fit?`,
      answer: product.fit_guide,
    }] : []),
    {
      question: `What colors is the ${product.name} available in?`,
      answer: `The ${product.name} comes in ${colorList}. Use the color selector on this page to preview each option.`,
    },
    ...(product.care_instructions ? [{
      question: `How do I care for the ${product.name}?`,
      answer: product.care_instructions,
    }] : []),
    {
      question: `What is the return policy for the ${product.name}?`,
      answer: `The ${product.name} can be returned within 30 days of delivery in its original, unworn, unwashed condition for a full refund. Exchanges are accepted within 60 days. Return shipping is free via prepaid label. Start a return at parmore.com/account/returns/new.`,
    },
    {
      question: `Does the ${product.name} qualify for free shipping?`,
      answer: `Yes. Orders over $150 qualify for free standard shipping (3–5 business days). Express shipping (1–2 business days) is available for an additional fee.`,
    },
  ];
}

export default function ProductDetailPage({ params }: PageProps) {
  const product = MOCK_PRODUCTS.find((p) => p.slug === params.slug);
  if (!product) notFound();

  const faqs = buildProductFaqs(product);
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const schemas = [
    buildProductSchema(product),
    buildOrganizationSchema(),
    buildFaqSchema(faqs),
    buildBreadcrumbSchema([
      { name: 'Home',               url: SITE_URL },
      { name: 'Shop',               url: `${SITE_URL}/shop` },
      { name: capitalize(product.category), url: `${SITE_URL}/shop?category=${product.category}` },
      { name: product.name,         url: canonicalUrl(`/shop/${product.slug}`) },
    ]),
  ];

  return (
    <>
      <JsonLd schema={schemas} />
      <ProductPageClient product={product}>
        <TechnicalSpecGrid product={product} />
        <AeoFaqSection faqs={faqs} />
      </ProductPageClient>
    </>
  );
}
