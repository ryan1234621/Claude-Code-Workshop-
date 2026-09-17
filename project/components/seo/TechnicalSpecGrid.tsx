import type { Product } from '@/app/lib/types';

interface TechnicalSpecGridProps {
  product: Product;
}

export function TechnicalSpecGrid({ product }: TechnicalSpecGridProps) {
  const colors = [...new Set(product.variants.map((v) => v.color.name))];
  const sizes = [...new Set(product.variants.flatMap((v) => v.sizes.map((s) => s.label)))];
  const primarySku = product.variants[0]?.sku ?? 'N/A';

  const specs: { label: string; value: string }[] = [
    { label: 'Brand',            value: 'Parmore' },
    { label: 'Style',            value: [product.subcategory, product.category].filter(Boolean).join(' · ') },
    ...(product.materials       ? [{ label: 'Materials',      value: product.materials }] : []),
    { label: 'Available Colors', value: colors.join(', ') },
    { label: 'Available Sizes',  value: sizes.join(', ') },
    ...(product.fit_guide       ? [{ label: 'Fit',            value: product.fit_guide }] : []),
    ...(product.care_instructions ? [{ label: 'Care',         value: product.care_instructions }] : []),
    { label: 'SKU',              value: primarySku },
    { label: 'Price (USD)',      value: `$${product.price.toFixed(2)}` },
    ...(product.compare_at_price ? [{ label: 'Original Price', value: `$${product.compare_at_price.toFixed(2)}` }] : []),
  ];

  return (
    <section
      aria-label="Technical Specifications"
      className="mt-16 pt-10 border-t border-zinc-100"
      itemScope
      itemType="https://schema.org/Product"
    >
      <h2 className="font-serif text-xl font-bold mb-6">Technical Specifications</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3.5">
        {specs.map(({ label, value }) => (
          <div key={label} className="flex gap-3 text-sm items-baseline">
            <dt className="w-36 shrink-0 font-medium text-parmore-black">{label}</dt>
            <dd className="text-parmore-slate leading-snug">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
