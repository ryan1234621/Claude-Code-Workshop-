// Deterministic bundle matrix for golf apparel.
// Maps source product signals → complementary categories/tags to boost in ranking.

export interface BundleRule {
  sourceMatch: string[];    // subcategory, category, or tag values that trigger this rule
  complements: string[];    // target categories/tags whose products get boosted
  bundleName: string;
  discountPct: number;      // suggested bundle discount displayed in UI
}

export const BUNDLE_RULES: BundleRule[] = [
  {
    sourceMatch: ['polo', 'shirt'],
    complements: ['pants', 'trouser', 'shorts', 'headwear', 'cap', 'hat', 'visor', 'belt'],
    bundleName: 'Complete the Look',
    discountPct: 10,
  },
  {
    sourceMatch: ['trouser', 'pants', 'bottoms'],
    complements: ['polo', 'shirt', 'vest', 'quarter-zip', 'layer', 'belt', 'headwear'],
    bundleName: 'Build the Outfit',
    discountPct: 10,
  },
  {
    sourceMatch: ['shorts'],
    complements: ['polo', 'shirt', 'headwear', 'cap', 'hat'],
    bundleName: 'Summer Round Kit',
    discountPct: 10,
  },
  {
    sourceMatch: ['vest', 'quarter-zip', 'layer'],
    complements: ['polo', 'trouser', 'pants'],
    bundleName: 'Layered Look',
    discountPct: 10,
  },
  {
    sourceMatch: ['jacket', 'outerwear', 'waterproof', 'rain'],
    complements: ['trouser', 'pants', 'polo'],
    bundleName: 'Rain-Ready Kit',
    discountPct: 10,
  },
  {
    sourceMatch: ['headwear', 'cap', 'hat', 'visor', 'bucket'],
    complements: ['polo', 'vest', 'shorts', 'quarter-zip'],
    bundleName: 'Course-Ready Set',
    discountPct: 10,
  },
  {
    sourceMatch: ['accessories', 'belt', 'glove'],
    complements: ['trouser', 'pants', 'polo', 'shorts'],
    bundleName: 'Finish the Look',
    discountPct: 10,
  },
];

interface ProductSignals {
  id: string;
  category: string;
  subcategory?: string;
  tags: string[];
  status?: string;
}

export interface ComplementResult {
  complements: string[];
  rule: BundleRule | null;
}

/** Returns the complement signals and matching rule for a given product. */
export function getComplements(product: ProductSignals): ComplementResult {
  const signals = [
    product.category.toLowerCase(),
    (product.subcategory ?? '').toLowerCase(),
    ...product.tags.map((t) => t.toLowerCase()),
  ].filter(Boolean);

  for (const rule of BUNDLE_RULES) {
    const hit = rule.sourceMatch.some((match) =>
      signals.some((s) => s === match || s.includes(match) || match.includes(s))
    );
    if (hit) return { complements: rule.complements, rule };
  }

  return { complements: [], rule: null };
}

/** Returns IDs of products from a catalog that complement the source product. */
export function findComplementaryProducts(
  source: ProductSignals,
  catalog: ProductSignals[],
  limit = 4,
): string[] {
  const { complements } = getComplements(source);
  if (!complements.length) return [];

  return catalog
    .filter((p) => p.id !== source.id && (p.status ?? 'active') === 'active')
    .filter((p) => {
      const sigs = [
        p.category.toLowerCase(),
        (p.subcategory ?? '').toLowerCase(),
        ...p.tags.map((t) => t.toLowerCase()),
      ];
      return complements.some((c) =>
        sigs.some((s) => s === c || s.includes(c) || c.includes(s))
      );
    })
    .slice(0, limit)
    .map((p) => p.id);
}
