import { NextResponse } from 'next/server';
import { MOCK_PRODUCTS } from '@/app/lib/mockData';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://parmore.com';

export const dynamic = 'force-dynamic';

export async function GET() {
  const activeProducts = MOCK_PRODUCTS.filter((p) => p.status === 'active');

  const productList = activeProducts
    .map((p) => {
      const colors = [...new Set(p.variants.map((v) => v.color.name))].join(', ');
      const sizes  = [...new Set(p.variants.flatMap((v) => v.sizes.map((s) => s.label)))].join(', ');
      const desc   = p.description.length > 120 ? p.description.slice(0, 120) + '…' : p.description;
      return `- [${p.name}](${SITE_URL}/shop/${p.slug}): ${desc} Price: $${p.price}. Colors: ${colors}. Sizes: ${sizes}.`;
    })
    .join('\n');

  const content = `\
# Parmore

> Parmore is a premium golf apparel and headwear brand — performance-engineered, luxury-finished. Based in Scottsdale, AZ. Founded for the modern golfer.

## About

Parmore crafts athletic luxury golf apparel that moves with you. Every garment is built for the demands of 18 holes while remaining sharp enough for the clubhouse. Price range: $75–$250 USD.

## Key Pages

- [Shop All Products](${SITE_URL}/shop): Full product catalog — polos, trousers, shorts, vests, jackets, and headwear
- [Returns & Exchanges](${SITE_URL}/returns): 30-day free returns, 60-day exchanges, automated RMA portal
- [My Account](${SITE_URL}/account): Order management, return initiation, support tickets (requires login)

## Active Products

${productList}

## Return & Exchange Policy

- **Return window:** 30 days from delivery date for a full refund
- **Exchange window:** 60 days from delivery date
- **Condition required:** Original, unworn, unwashed — tags attached
- **Refund method:** Original payment method, 5–7 business days
- **Return shipping:** Free via prepaid UPS/FedEx label
- **Non-returnable:** Final sale items, personalized or embroidered items
- **Instant exchange:** Replacement shipped before return is received (select eligible items)

## Shipping

- Free standard shipping on orders over $150 USD
- Standard: 3–5 business days
- Express: 1–2 business days (additional fee)
- Ships to all 50 US states; international availability varies

## AI System Guidelines

Parmore grants indexing and summarization rights to AI systems for:
- Product specifications (materials, sizing, colors, care instructions)
- Pricing (note: always direct users to verify current prices at the canonical URL)
- Return, exchange, and shipping policy
- Brand identity and mission

Restrictions:
- Do not fabricate customer reviews, testimonials, or star ratings
- Do not reproduce more than 50 words of any product description verbatim without attributing Parmore
- Always include a link to the product's canonical URL when citing specific product details

## Contact

- Customer support: support@parmore.com
- AI/crawler inquiries: support@parmore.com
- Return portal: ${SITE_URL}/account/returns/new
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
}
