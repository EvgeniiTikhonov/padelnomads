import { Link } from 'react-router-dom';
import { Card } from '@/components/ui';

const STEPS = [
  { n: '01', title: 'Apply', body: 'Submit a short application with your level and preferred side.' },
  { n: '02', title: 'Get approved', body: 'Our admins review every application to keep the community curated.' },
  { n: '03', title: 'Play & climb', body: 'Join curated games, earn points, and rise up the leaderboard.' },
];

const HIGHLIGHTS = [
  { title: 'Curated games', body: 'Balanced sessions matched to your level — no more chasing courts on WhatsApp.' },
  { title: 'Live leaderboard', body: 'Earn points from every game and track your rank across the community.' },
  { title: 'Member offers', body: 'Exclusive partner discounts on rackets, courts, recovery, and more.' },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-brand-black/50">
          A closed padel community
        </p>
        <h1 className="heading-display mt-4">Padel Nomads</h1>
        <p className="heading-sub mt-4 normal-case">
          Curated games, real competition, and a community of players who take padel seriously.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/join" className="btn-primary">
            Apply to join
          </Link>
          <Link to="/login" className="btn-secondary">
            Log in
          </Link>
        </div>
      </section>

      {/* Highlights */}
      <section className="border-t border-brand-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 sm:grid-cols-3">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title}>
                <h3 className="font-heading text-lg font-semibold uppercase tracking-tight text-brand-black">
                  {h.title}
                </h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-brand-black/70">{h.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="heading-section text-center">How it works</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <Card key={s.n} className="p-8">
              <p className="font-heading text-3xl font-semibold text-brand-black/15">{s.n}</p>
              <h3 className="mt-4 font-heading text-lg font-semibold uppercase tracking-tight text-brand-black">
                {s.title}
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-brand-black/70">{s.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Card className="bg-brand-black p-10 text-center sm:p-16">
          <h2 className="font-heading text-heading font-semibold uppercase tracking-tight text-brand-white">
            Ready to join the nomads?
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-body text-brand-white/70">
            Membership is by application only. Apply today and start playing curated games with
            players at your level.
          </p>
          <div className="mt-8">
            <Link
              to="/join"
              className="inline-flex items-center justify-center bg-brand-white px-8 py-4 font-heading text-sm font-semibold uppercase tracking-wide text-brand-black transition-colors hover:bg-brand-white/90"
            >
              Apply to join
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
