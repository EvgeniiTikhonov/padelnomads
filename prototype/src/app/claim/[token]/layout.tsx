import { STATIC_INVITE_TOKENS } from '@/lib/staticParams';

export function generateStaticParams() {
  return STATIC_INVITE_TOKENS.map((token) => ({ token }));
}

export default function ClaimLayout({ children }: { children: React.ReactNode }) {
  return children;
}
