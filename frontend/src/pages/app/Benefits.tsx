import { Link } from 'react-router-dom';
import { PageHeader, Card } from '@/components/ui';

const BENEFITS = [
  {
    title: 'Curated games',
    body: 'Access to balanced, well-organised games matched to your level — no more chasing courts on WhatsApp.',
  },
  {
    title: 'Community events',
    body: 'Invitations to mini-tournaments, socials, and seasonal competitions exclusive to members.',
  },
  {
    title: 'Partner offers',
    body: 'Member-only discounts on rackets, court rentals, recovery, and nutrition from our partners.',
  },
  {
    title: 'Priority access',
    body: 'Get first pick on high-demand sessions and limited-capacity special events.',
  },
  {
    title: 'Ranking & stats',
    body: 'Track your progress with a community leaderboard, points, and personal performance stats.',
  },
  {
    title: 'Member-only activities',
    body: 'Skill clinics, coaching pop-ups, and off-court gatherings to grow the nomad network.',
  },
];

export default function Benefits() {
  return (
    <div>
      <PageHeader
        title="Membership benefits"
        subtitle="What it means to be part of the Padel Nomads community."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BENEFITS.map((b) => (
          <Card key={b.title} className="p-6">
            <h3 className="font-heading text-base font-semibold uppercase tracking-tight text-brand-black">
              {b.title}
            </h3>
            <p className="mt-3 font-body text-sm leading-relaxed text-brand-black/70">{b.body}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-8">
        <h3 className="heading-sub">Explore partner offers</h3>
        <p className="mt-3 font-body text-body text-brand-black/70">
          Your membership unlocks exclusive discounts and perks from our partners.
        </p>
        <div className="mt-6">
          <Link to="/app/offers" className="btn-primary">
            View offers
          </Link>
        </div>
      </Card>
    </div>
  );
}
