export interface FaqItem {
  question: string;
  answer: string;
}

interface AeoFaqSectionProps {
  faqs: FaqItem[];
  title?: string;
}

export function AeoFaqSection({ faqs, title = 'Frequently Asked Questions' }: AeoFaqSectionProps) {
  if (!faqs.length) return null;

  return (
    <section
      aria-label="Frequently Asked Questions"
      className="mt-16 pt-10 border-t border-zinc-100 pb-4"
    >
      <h2 className="font-serif text-xl font-bold mb-7">{title}</h2>
      <dl className="space-y-6">
        {faqs.map(({ question, answer }) => (
          <div key={question}>
            <dt className="text-sm font-semibold text-parmore-black mb-1.5">{question}</dt>
            <dd className="text-sm text-parmore-slate leading-relaxed max-w-2xl">{answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
