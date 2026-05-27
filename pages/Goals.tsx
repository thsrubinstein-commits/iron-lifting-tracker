import { Pin, Target } from 'lucide-react';
import { Card, PageHeader } from '@/components/AppShell';
import { useIronData } from '@/context/IronDataContext';

export default function Goals() {
  const { goals, loading } = useIronData();
  return (
    <>
      <PageHeader
        eyebrow="Goals"
        title="What you're chasing"
        description="Pin one as your top goal — it'll show up on the Home dashboard."
      />
      <div className="space-y-4 md:space-y-5">
        {goals.length === 0 && (
          <Card>
            <div className="font-semibold">No goals saved yet.</div>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              {loading ? 'Loading your goals…' : 'Goal creation will be the next small wiring step.'}
            </p>
          </Card>
        )}
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.current / g.target) * 100));
          return (
            <Card key={g.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-[var(--ink-soft)]" />
                    <span className="eyebrow !text-[var(--ink-soft)]">{g.metric}</span>
                  </div>
                  <div className="text-xl md:text-2xl font-semibold tracking-tight">{g.title}</div>
                  <div className="text-sm text-[var(--ink-soft)] mt-1 tabular-nums">
                    {g.current} / {g.target} {g.unit}
                  </div>
                </div>
                {g.pinned && (
                  <span className="inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 surface-soft text-[var(--accent)]">
                    <Pin className="w-3 h-3" /> Pinned
                  </span>
                )}
              </div>
              <div className="mt-4 h-1.5 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: 'var(--accent)' }}
                  aria-label={`${pct}% to goal`}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
