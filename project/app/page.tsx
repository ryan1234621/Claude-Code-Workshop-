import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Award, Leaf, Zap } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { MOCK_PRODUCTS, MOCK_COLLECTIONS } from './lib/mockData';

// ─── Hero Section ────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-[95dvh] flex items-end overflow-hidden bg-parmore-black">
      {/* Background image */}
      <Image
        src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1600&auto=format&fit=crop&q=80"
        alt="Golfer on the fairway wearing Parmore apparel"
        fill
        className="object-cover object-center opacity-60"
        priority
        sizes="100vw"
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

      {/* Announcement bar */}
      <div className="absolute top-[var(--navbar-height)] left-0 right-0 bg-parmore-gold/90 backdrop-blur-sm py-2 text-center z-10">
        <p className="text-xs font-semibold tracking-widest uppercase text-parmore-black">
          Free shipping on orders over $150 · New SS25 arrivals now live
        </p>
      </div>

      {/* Content */}
      <div className="relative container-parmore pb-20 pt-40 md:pb-28">
        <div className="max-w-2xl">
          <p className="label-caps text-parmore-gold mb-4 tracking-[0.2em]">
            SS25 Collection
          </p>
          <h1 className="display-1 text-white mb-6">
            Where the
            <br />
            <em className="not-italic text-gold-shimmer">Fairway Meets</em>
            <br />
            Luxury
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-md mb-10">
            Performance-engineered golf apparel and headwear for the modern golfer. Built to move. Designed to impress.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-parmore-black text-sm font-semibold rounded-sm hover:bg-parmore-cream transition-colors group"
            >
              Shop the Collection
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/40 text-white text-sm font-medium rounded-sm hover:bg-white/10 hover:border-white/60 transition-colors"
            >
              Explore Collections
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 right-8 flex flex-col items-center gap-2 text-white/40">
        <div className="h-10 w-px bg-gradient-to-b from-transparent to-white/40 animate-pulse" />
        <span className="text-2xs tracking-widest uppercase writing-mode-vertical rotate-90 origin-center">Scroll</span>
      </div>
    </section>
  );
}

// ─── Brand Pillars ────────────────────────────────────────────────────────────

function BrandPillars() {
  const pillars = [
    { icon: Zap, label: 'Performance Fabric', description: '4-way stretch, moisture-wicking, UV-protective materials engineered for the course.' },
    { icon: Award, label: 'Luxury Finish', description: 'Impeccable construction with premium trims, thoughtful details, and a refined aesthetic.' },
    { icon: Leaf, label: 'Sustainable Practice', description: 'Responsibly sourced materials and a commitment to reducing our environmental footprint.' },
  ];

  return (
    <section className="bg-parmore-cream py-16 border-y border-parmore-cream">
      <div className="container-parmore grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 lg:gap-12">
        {pillars.map(({ icon: Icon, label, description }) => (
          <div key={label} className="flex flex-col items-start gap-3">
            <div className="p-2 rounded-sm bg-parmore-gold/15">
              <Icon className="h-5 w-5 text-parmore-gold" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold tracking-wide">{label}</h3>
            <p className="text-sm text-parmore-slate leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Featured Collections ─────────────────────────────────────────────────────

function FeaturedCollections() {
  const collections = MOCK_COLLECTIONS.filter((c) => c.featured).slice(0, 3);

  return (
    <section className="py-20 lg:py-28">
      <div className="container-parmore">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="label-caps text-parmore-gold mb-3">Curated Edits</p>
          <h2 className="heading-1 mb-4">Collections</h2>
          <div className="divider-gold" />
        </div>

        {/* Grid: 1 large + 2 smaller */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
          {/* Large feature */}
          {collections[0] && (
            <Link
              href={`/collections/${collections[0].slug}`}
              className="group relative overflow-hidden rounded-sm aspect-[4/5] lg:row-span-2 lg:aspect-auto"
            >
              <Image
                src={collections[0].image}
                alt={collections[0].name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <p className="label-caps text-parmore-gold mb-2">{collections[0].season}</p>
                <h3 className="font-serif text-2xl text-white font-bold mb-1">{collections[0].name}</h3>
                <p className="text-white/70 text-sm mb-4">{collections[0].description}</p>
                <span className="inline-flex items-center gap-1.5 text-white text-sm font-medium group-hover:gap-3 transition-all">
                  Shop Now <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          )}

          {/* 2 smaller */}
          <div className="grid grid-rows-2 gap-4 lg:gap-5">
            {collections.slice(1, 3).map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.slug}`}
                className="group relative overflow-hidden rounded-sm aspect-[16/9] lg:aspect-auto"
              >
                <Image
                  src={col.image}
                  alt={col.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-serif text-xl text-white font-bold mb-1">{col.name}</h3>
                  <span className="inline-flex items-center gap-1.5 text-white/80 text-sm group-hover:text-white group-hover:gap-2.5 transition-all">
                    Explore <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Best Sellers ─────────────────────────────────────────────────────────────

function BestSellers() {
  const bestsellers = MOCK_PRODUCTS.filter((p) => p.best_seller).slice(0, 4);

  return (
    <section className="py-20 lg:py-28 bg-parmore-cream">
      <div className="container-parmore">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
          <div>
            <p className="label-caps text-parmore-gold mb-3">Top Picks</p>
            <h2 className="heading-1">Best Sellers</h2>
          </div>
          <Link
            href="/shop?filter=bestsellers"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-parmore-black hover:text-parmore-gold transition-colors group whitespace-nowrap"
          >
            View all
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {bestsellers.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 2} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── New Arrivals ─────────────────────────────────────────────────────────────

function NewArrivals() {
  const newProducts = MOCK_PRODUCTS.filter((p) => p.new_arrival).slice(0, 3);

  if (newProducts.length === 0) return null;

  return (
    <section className="py-20 lg:py-28">
      <div className="container-parmore">
        <div className="text-center mb-12">
          <p className="label-caps text-parmore-gold mb-3">Fresh Drops</p>
          <h2 className="heading-1">New Arrivals</h2>
          <div className="divider-gold mt-4" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
          {newProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i === 0} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/shop?filter=new"
            className="inline-flex items-center gap-2 px-8 py-3.5 border border-parmore-black text-parmore-black text-sm font-medium rounded-sm hover:bg-parmore-black hover:text-white transition-colors group"
          >
            View All New Arrivals
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Brand Story Banner ───────────────────────────────────────────────────────

function BrandBanner() {
  return (
    <section className="relative py-24 lg:py-36 bg-parmore-navy overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-parmore-gold/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-parmore-gold/5 rounded-full translate-x-1/3 translate-y-1/3" />

      <div className="container-parmore relative text-center text-white max-w-3xl mx-auto">
        <p className="label-caps text-parmore-gold mb-5">Our Philosophy</p>
        <blockquote className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-8">
          &ldquo;Golf is the one game where you dress for excellence before you play it.&rdquo;
        </blockquote>
        <div className="divider-gold mb-6" />
        <p className="text-white/60 text-sm mb-8">
          Parmore was built for golfers who refuse to choose between performance and style. Every piece in our collection is engineered with purpose and finished with intention.
        </p>
        <Link
          href="/about"
          className="inline-flex items-center gap-2 text-parmore-gold text-sm font-medium hover:gap-3 transition-all"
        >
          Our Story <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Hero />
      <BrandPillars />
      <FeaturedCollections />
      <BestSellers />
      <NewArrivals />
      <BrandBanner />
    </>
  );
}
