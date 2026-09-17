import type { Metadata } from 'next';
import Link from 'next/link';
import { RotateCcw, Package, Truck, CreditCard, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { buildReturnPolicySchema, buildFaqSchema, buildOrganizationSchema } from '@/lib/seo/schemaGenerators';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { JsonLd } from '@/components/seo/JsonLd';
import { AeoFaqSection } from '@/components/seo/AeoFaqSection';
import type { FaqItem } from '@/components/seo/AeoFaqSection';

export const metadata: Metadata = buildPageMetadata({
  title: 'Returns & Exchanges',
  description:
    'Parmore offers free 30-day returns and 60-day exchanges on all apparel. Start your return online in minutes — prepaid label included.',
  path: '/returns',
  keywords: ['golf apparel returns', 'free returns', 'exchange policy', 'Parmore returns', '30-day return'],
});

const RETURN_FAQS: FaqItem[] = [
  {
    question: 'How long do I have to return an item?',
    answer:
      'You have 30 days from the delivery date to return any item in its original, unworn, unwashed condition with tags attached. For exchanges, the window extends to 60 days.',
  },
  {
    question: 'Is return shipping free?',
    answer:
      'Yes. Parmore provides a free prepaid UPS or FedEx return label for all eligible returns within the United States. There is no charge for return shipping.',
  },
  {
    question: 'How long does a refund take?',
    answer:
      'Once we receive and inspect your return, your refund is issued to the original payment method within 5–7 business days. You will receive an email confirmation when the refund is processed.',
  },
  {
    question: 'Can I exchange for a different size or color?',
    answer:
      'Yes. Exchanges are accepted within 60 days of delivery. You can exchange for a different size or color of the same item, subject to availability. Start an exchange at your account returns portal.',
  },
  {
    question: 'What items cannot be returned?',
    answer:
      'Final sale items (marked at checkout), personalized or embroidered items, and items that have been worn, washed, or damaged after delivery are not eligible for return.',
  },
  {
    question: 'What condition must items be in for a return?',
    answer:
      'Items must be in original, unworn, unwashed condition with all original tags attached and free from odors, stains, or alterations. Items showing signs of wear will not be accepted.',
  },
  {
    question: 'How do I start a return or exchange?',
    answer:
      'Log in to your Parmore account, go to Orders, and select "Start Return" next to the item you want to return. Follow the prompts to select a reason, confirm your address, and download your free prepaid return label.',
  },
  {
    question: 'What happens after Parmore receives my return?',
    answer:
      'Our team inspects the item within 2 business days of receipt. If approved, your refund is issued within 5–7 business days. If there is an issue with the return, we will contact you by email.',
  },
];

const POLICY_HIGHLIGHTS = [
  { icon: Clock,        heading: '30-Day Return Window',    body: 'Return any eligible item within 30 days of delivery.' },
  { icon: RotateCcw,   heading: '60-Day Exchange Window',  body: 'Exchange for a different size or color within 60 days.' },
  { icon: Truck,        heading: 'Free Return Shipping',    body: 'We provide a prepaid UPS or FedEx label — no cost to you.' },
  { icon: CreditCard,  heading: 'Full Refund Guaranteed',  body: 'Approved returns receive a full refund to the original payment method.' },
  { icon: Package,      heading: 'Fast Processing',        body: 'Returns inspected within 2 business days of receipt.' },
  { icon: CheckCircle2, heading: 'Instant Exchange Option', body: 'We ship your replacement before receiving your return (eligible items).' },
];

const ELIGIBLE_ITEMS = [
  'Apparel in original, unworn, unwashed condition',
  'Items with all original tags attached',
  'Items returned within the applicable window',
  'Standard-priced items (not marked as final sale)',
];

const INELIGIBLE_ITEMS = [
  'Items marked as Final Sale at checkout',
  'Personalized or custom-embroidered garments',
  'Items that have been worn, washed, or altered',
  'Items returned after the return window has closed',
  'Items with odors, stains, or damage not present at delivery',
];

export default function ReturnsPage() {
  const schemas = [
    buildReturnPolicySchema(),
    buildFaqSchema(RETURN_FAQS),
    buildOrganizationSchema(),
  ];

  return (
    <>
      <JsonLd schema={schemas} />

      <div className="pt-[var(--navbar-height)]">
        {/* Hero */}
        <div className="bg-parmore-black text-white py-16">
          <div className="container-parmore text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-parmore-gold/20 mb-6">
              <RotateCcw className="h-7 w-7 text-parmore-gold" strokeWidth={1.5} />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              Returns &amp; Exchanges
            </h1>
            <p className="text-white/70 max-w-xl mx-auto text-base leading-relaxed">
              We stand behind every garment. If something isn&apos;t right, returning or exchanging
              is straightforward — free, fast, and handled online in minutes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/account/returns/new"
                className="inline-flex items-center justify-center gap-2 bg-parmore-gold text-parmore-black px-6 py-3 text-sm font-semibold rounded-sm hover:bg-parmore-gold/90 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Start a Return
              </Link>
              <Link
                href="/account/returns"
                className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-3 text-sm font-semibold rounded-sm hover:bg-white/20 transition-colors"
              >
                Track My Return
              </Link>
            </div>
          </div>
        </div>

        <div className="container-parmore py-16">
          {/* Policy highlights grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
            {POLICY_HIGHLIGHTS.map(({ icon: Icon, heading, body }) => (
              <div
                key={heading}
                className="flex gap-4 p-5 bg-white border border-zinc-100 rounded-sm"
              >
                <div className="h-9 w-9 rounded-sm bg-parmore-cream flex items-center justify-center shrink-0">
                  <Icon className="h-4.5 w-4.5 text-parmore-black" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">{heading}</p>
                  <p className="text-xs text-parmore-slate leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Eligibility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Eligible */}
            <div className="bg-green-50 border border-green-100 rounded-sm p-6">
              <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" strokeWidth={1.5} />
                Eligible for Return
              </h2>
              <ul className="space-y-2">
                {ELIGIBLE_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-green-800">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Ineligible */}
            <div className="bg-red-50 border border-red-100 rounded-sm p-6">
              <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500 shrink-0" strokeWidth={1.5} />
                Not Eligible for Return
              </h2>
              <ul className="space-y-2">
                {INELIGIBLE_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-red-800">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Step-by-step process */}
          <div className="mb-16">
            <h2 className="font-serif text-xl font-bold mb-8">How the Return Process Works</h2>
            <ol className="space-y-6">
              {[
                {
                  step: '01',
                  title: 'Initiate Online',
                  desc: 'Log in to your account, go to Orders, and select "Start Return." Choose your item, reason, and preferred resolution (refund or exchange).',
                },
                {
                  step: '02',
                  title: 'Print Your Label',
                  desc: 'Instantly receive a free prepaid UPS or FedEx return label. Print it at home or at any carrier location.',
                },
                {
                  step: '03',
                  title: 'Pack & Drop Off',
                  desc: 'Pack the item securely in its original packaging if possible. Drop it off at any UPS Store, FedEx Office, or USPS location.',
                },
                {
                  step: '04',
                  title: 'Inspection & Refund',
                  desc: 'We inspect your return within 2 business days of receipt. Approved refunds are issued to your original payment method within 5–7 business days.',
                },
              ].map(({ step, title, desc }) => (
                <li key={step} className="flex gap-5">
                  <span className="font-mono text-2xl font-bold text-parmore-gold shrink-0 w-10">
                    {step}
                  </span>
                  <div>
                    <p className="font-semibold mb-1 text-sm">{title}</p>
                    <p className="text-sm text-parmore-slate leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* FAQ — AEO-optimised */}
          <AeoFaqSection faqs={RETURN_FAQS} title="Return Policy — Frequently Asked Questions" />

          {/* CTA footer */}
          <div className="mt-16 p-8 bg-parmore-cream rounded-sm text-center">
            <p className="font-serif text-xl font-bold mb-2">Ready to start your return?</p>
            <p className="text-sm text-parmore-slate mb-6 max-w-md mx-auto">
              The entire process takes under two minutes. Your prepaid label is ready immediately.
            </p>
            <Link
              href="/account/returns/new"
              className="inline-flex items-center gap-2 bg-parmore-black text-white px-6 py-3 text-sm font-semibold rounded-sm hover:bg-parmore-black/80 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Start a Return
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
