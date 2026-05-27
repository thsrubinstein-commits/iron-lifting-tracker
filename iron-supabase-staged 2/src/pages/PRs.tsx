import { Trophy } from 'lucide-react';
import { Card, PageHeader } from '@/components/AppShell';
import { useIronData } from '@/context/IronDataContext';

export default function PRs() {
  const { prs, loading } = useIronData();
  return (
    <>
      <PageHeader
        eyebrow="Personal records"
        title="What you've actually moved"
        description="e1RM is estimated from your heaviest qualifying set. Beat any number and we'll celebrate it."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        {prs.length === 0 && (
          <Card className="sm:col-span-2">
            <div className="font-semibold">No PRs yet.</div>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              {loading ? 'Loading your records…' : 'Save a workout with weighted sets and Iron will calculate them.'}
            </p>
          </Card>
        )}
        {prs.map((pr) => (
          <Card key={pr.exercise}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="eyebrow mb-1">{pr.exercise}</div>
                <div className="text-3xl md:text-4xl font-semibold tracking-tight tabular-nums">
                  {pr.oneRepMax}
                </div>
                <div className="text-sm text-[var(--ink-soft)] mt-1">estimated 1RM</div>
              </div>
              <div className="w-10 h-10 rounded-xl surface-soft grid place-items-center text-[var(--accent)] shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between text-sm text-[var(--ink-soft)]">
              <span>
                Best set:{' '}
                <span className="text-[var(--ink)] tabular-nums">
                  {pr.bestSet.weight ? `${pr.bestSet.weight} × ${pr.bestSet.reps}` : `BW × ${pr.bestSet.reps}`}
                </span>
              </span>
              <span className="tabular-nums">{new Date(pr.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
