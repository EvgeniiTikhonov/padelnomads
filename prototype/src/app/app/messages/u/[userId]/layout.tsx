import { STATIC_PLAYER_IDS } from '@/lib/staticParams';

export function generateStaticParams() {
  return STATIC_PLAYER_IDS.map((userId) => ({ userId }));
}

export default function DirectMessageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
