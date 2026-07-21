import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { MockDataProvider } from '@/data/provider';
import './globals.css';

const geistSans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Padel Nomads — Curated Padel Community',
    template: '%s · Padel Nomads',
  },
  description:
    'Padel Nomads is a closed, curated padel community. Apply to join, play curated games, climb the leaderboard, and unlock member-only partner offers.',
  keywords: ['padel', 'community', 'Dubai', 'games', 'americano', 'padel club'],
  openGraph: {
    title: 'Padel Nomads — Curated Padel Community',
    description: 'Apply to join a curated padel community: games, leaderboard, member benefits.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <MockDataProvider>
          {children}
          <Toaster position="top-center" richColors />
        </MockDataProvider>
      </body>
    </html>
  );
}
