import type { Product } from '@/app/lib/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://parmore.com';

export function buildProductSchema(product: Product): Record<string, unknown> {
  const colors = [...new Set(product.variants.map((v) => v.color.name))];
  const sizes = [...new Set(product.variants.flatMap((v) => v.sizes.map((s) => s.label)))];
  const inStock = product.variants.some((v) => v.sizes.some((s) => s.stock > 0));

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    url: `${SITE_URL}/shop/${product.slug}`,
    sku: product.variants[0]?.sku,
    brand: { '@type': 'Brand', name: 'Parmore' },
    ...(product.materials && { material: product.materials }),
    ...(colors.length && { color: colors.join(', ') }),
    ...(sizes.length && { size: sizes.join(', ') }),
    ...(product.subcategory ?? product.category
      ? { category: `Golf Apparel > ${product.subcategory ?? product.category}` }
      : {}),
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/shop/${product.slug}`,
      priceCurrency: 'USD',
      price: product.price.toFixed(2),
      ...(product.compare_at_price && { highPrice: product.compare_at_price.toFixed(2) }),
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Parmore' },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'USD' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'US' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 5, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'US',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
    },
  };
}

export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Parmore',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      'Premium golf apparel and headwear. Performance-engineered, luxury-finished. For the modern golfer.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '8800 E Chaparral Rd',
      addressLocality: 'Scottsdale',
      addressRegion: 'AZ',
      postalCode: '85250',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@parmore.com',
      availableLanguage: 'English',
    },
    sameAs: [
      'https://instagram.com/parmore',
      'https://twitter.com/parmore',
    ],
  };
}

export function buildFaqSchema(
  items: { question: string; answer: string }[]
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

export function buildReturnPolicySchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MerchantReturnPolicy',
    name: 'Parmore 30-Day Free Return Policy',
    url: `${SITE_URL}/returns`,
    applicableCountry: 'US',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 30,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/FreeReturn',
    refundType: 'https://schema.org/FullRefund',
    description:
      'Items in original, unworn condition may be returned within 30 days of delivery for a full refund. Exchanges accepted within 60 days. Free prepaid return label provided.',
  };
}

export function buildBreadcrumbSchema(
  items: { name: string; url: string }[]
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, url }, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: url,
    })),
  };
}
