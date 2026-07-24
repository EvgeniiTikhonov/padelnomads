import { STATIC_GAME_IDS } from '@/lib/staticParams';

export function generateStaticParams() {
  return STATIC_GAME_IDS.map((gameId) => ({ gameId }));
}

export default function GameChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
