import { STATIC_CLUB_IDS } from '@/lib/staticParams';

export function generateStaticParams() {
  return STATIC_CLUB_IDS.map((id) => ({ id }));
}

export default function AppClubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
