import { STATIC_GAME_IDS } from '@/lib/staticParams';

export function generateStaticParams() {
  return STATIC_GAME_IDS.map((id) => ({ id }));
}

export default function AdminGameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
