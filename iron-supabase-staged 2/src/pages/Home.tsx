import { ArrowRight, Trophy, Target, Shuffle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, PageHeader } from '@/components/AppShell';
import { useDisplayName } from '@/context/AuthContext';
import { summarizeLastSevenDays, bestE1RM, relativeTime } from '@/data/mock';
import { useIronData } from '@/context/IronDataContext';

export default function Home() {
  const name = useDisplayName();
  const { workouts, prs, goals, loading, error } = useIronData();
  const { sessions, volume } = summarizeLastSevenDays(workouts);
  const best = prs.length ? bestE1RM(prs) : null;
  const latest = workouts[0] ?? null;
  const topGoal = goals.find((g) => g.pinned) ?? goals[0] ?? null;

  return (
    <div className="space-y-4 md:space-y-5 mt-2">
      {/* Hero */}
      <Card>
        <div className="eyebrow mb-2">Iron</div>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">Hey, {name}.</h1>
        <p className="mt-2 text-[var(--ink-soft)] max-w-lg">
          Start your next lift, check the recommended weight, and log only what matters.
        </p>
        <Link to="/log" className="pill mt-5">
          Start workout <ArrowRight className="w-4 h-4" />
        </Link>
      </Card>

      {/* Stat strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        <StatTile eyebrow="Last 7 days" value={String(sessions)} unit="sessions" />
        <StatTile eyebrow="Volume" value={volume.toLocaleString()} unit="lb" />
        <StatTile eyebrow="Best e1RM" value={best ? String(best.oneRepMax) : '—'} unit={best?.exercise ?? 'no data yet'} />
      </div>

      {/* AI workout pick */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow mb-2">AI workout pick</div>
            <h2 className="text-xl md:text-2xl font-semibold">Legs</h2>
            <p className="mt-1 text-[var(--ink-soft)] max-w-md">
              You last pulled, so hit lower body next.
            </p>
            <p className="mt-3 text-sm text-[var(--ink-mute)] max-w-md">
              Weight targets appear when you choose an exercise in the workout logger.
            </p>
            <Link to="/log" className="accent-link mt-4 inline-flex">
              Pick workout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="w-10 h-10 rounded-xl surface-soft grid place-items-center text-[var(--accent)] shrink-0">
            <Shuffle className="w-4 h-4" />
          </div>
        </div>
      </Card>

      {/* Latest session + Top goal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        <Card>
          <div className="flex items-center gap-2 mb-2 text-[var(--ink-soft)]">
            <Trophy className="w-4 h-4" />
            <span className="eyebrow !text-[var(--ink-soft)]">Latest session</span>
          </div>
          <div className="font-semibold text-lg">{latest?.name ?? 'No sessions yet'}</div>
          <div className="text-sm text-[var(--ink-soft)] mt-1">
            {latest ? relativeTime(latest.date) : loading ? 'Loading…' : 'Log your first workout'}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2 text-[var(--ink-soft)]">
            <Target className="w-4 h-4" />
            <span className="eyebrow !text-[var(--ink-soft)]">Top goal</span>
          </div>
          <div className="font-semibold text-lg">{topGoal?.title ?? 'No goal yet'}</div>
          <div className="text-sm text-[var(--ink-soft)] mt-1">
            {topGoal ? `${topGoal.target} ${topGoal.unit}` : 'Add one from Goals'}
          </div>
        </Card>
      </div>
      {error ? <div className="text-sm text-[var(--accent)]">{error}</div> : null}
    </div>
  );
}

function StatTile({ eyebrow, value, unit }: { eyebrow: string; value: string; unit: string }) {
  return (
    <div className="surface p-5">
      <div className="eyebrow mb-3">{eyebrow}</div>
      <div className="text-3xl md:text-4xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-sm text-[var(--ink-soft)] mt-1">{unit}</div>
    </div>
  );
}

// PageHeader imported for type completeness even though not used here.
export { PageHeader };
