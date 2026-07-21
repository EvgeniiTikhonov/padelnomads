import { STATIC_PLAYER_IDS } from '@/lib/staticParams';

export function generateStaticParams() {
  return STATIC_PLAYER_IDS.map((id) => ({ id }));
}

export default function PlayerProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
