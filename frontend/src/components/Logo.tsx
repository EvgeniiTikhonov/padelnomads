import { Link } from 'react-router-dom';

/**
 * Padel Nomads logo with stylized "P" (vertical stroke extending down, curving right).
 * Safe zone: padding equal to 1em (P diameter) around the logo per brand guidelines.
 */
export default function Logo({ className = '', href = '/', size = 'md' }) {
  const sizes = {
    sm: { text: 'text-lg', stroke: 2 },
    md: { text: 'text-xl', stroke: 2.5 },
    lg: { text: 'text-2xl', stroke: 3 },
  };
  const s = sizes[size as keyof typeof sizes] ?? sizes.md;

  const content = (
    <span
      className={`font-heading font-bold uppercase tracking-tight text-brand-black ${s.text} ${className}`}
      aria-label="Padel Nomads"
    >
      <span className="inline-flex items-baseline gap-0.05em">
        {/* Stylized P: vertical stroke extends down and curves right */}
        <span className="relative inline-block">
          <svg
            viewBox="0 0 24 48"
            className="inline-block h-[1.2em] w-[0.5em] align-baseline"
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M4 4v40M4 4h10a8 8 0 1 1 0 16H4" />
            <path d="M4 24h10" />
          </svg>
        </span>
        <span>ADEL NOMADS</span>
      </span>
    </span>
  );

  const wrapped = (
    <span className="block logo-safe-zone" style={{ padding: '1em' }}>
      {content}
    </span>
  );

  if (href) {
    return (
      <Link to={href} className="block w-fit focus:outline-none focus:ring-2 focus:ring-brand-black focus:ring-offset-2 focus:ring-offset-brand-white rounded">
        {wrapped}
      </Link>
    );
  }
  return wrapped;
}
