import { type ReactNode } from 'react';

/**
 * Call-to-action block per brand guidelines: heading (Suissi-style, caps),
 * body text (Montserrat), and optional primary button.
 */
export default function CTABlock({
  heading,
  body,
  action,
  className = '',
}: {
  heading: string;
  body: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-brand-black/10 bg-white p-10 sm:p-14 ${className}`}>
      <h2 className="heading-section">{heading}</h2>
      <div className="body-lg mt-6 max-w-2xl">{body}</div>
      {action && <div className="mt-10">{action}</div>}
    </section>
  );
}
