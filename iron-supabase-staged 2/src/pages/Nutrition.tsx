import { Card, PageHeader } from '@/components/AppShell';
import { useIronData } from '@/context/IronDataContext';

export default function Nutrition() {
  const { nutrition, loading } = useIronData();
  const today = nutrition[0] ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const protein = today.protein;
  const proteinTarget = 200;
  const kcalTarget = 2500;

  return (
    <>
      <PageHeader
        eyebrow="Nutrition"
        title="Eat for the lift"
        description="Quick daily totals — no calorie-counting tyranny. Hit protein, stay close to your kcal target."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        <Card className="sm:col-span-2">
          <div className="eyebrow mb-2">Today</div>
          <div className="grid grid-cols-3 gap-4">
            <Macro label="kcal" value={today.kcal} target={kcalTarget} unit="kcal" />
            <Macro label="Protein" value={protein} target={proteinTarget} unit="g" emphasize />
            <Macro label="Carbs" value={today.carbs} unit="g" />
          </div>
        </Card>
        <Card>
          <div className="eyebrow mb-2">Fat</div>
          <div className="text-3xl font-semibold tabular-nums">{today.fat}</div>
          <div className="text-sm text-[var(--ink-soft)] mt-1">grams</div>
        </Card>
      </div>

      <div className="mt-5">
        <div className="eyebrow mb-3">Earlier this week</div>
        <Card>
          <ul className="divide-y divide-[var(--border)]">
            {nutrition.length === 0 && (
              <li className="py-3 text-sm text-[var(--ink-soft)]">
                {loading ? 'Loading your food log…' : 'No nutrition entries saved yet.'}
              </li>
            )}
            {nutrition.slice(1).map((n) => (
              <li key={n.id} className="py-3 flex items-center justify-between text-sm">
                <span className="text-[var(--ink)]">
                  {new Date(n.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-[var(--ink-soft)] tabular-nums">
                  {n.kcal} kcal · {n.protein}g protein
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

function Macro({
  label,
  value,
  target,
  unit,
  emphasize,
}: {
  label: string;
  value: number;
  target?: number;
  unit: string;
  emphasize?: boolean;
}) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : null;
  return (
    <div>
      <div className="eyebrow mb-1">{label}</div>
      <div
        className="text-3xl font-semibold tabular-nums"
        style={emphasize ? { color: 'var(--accent)' } : undefined}
      >
        {value}
      </div>
      <div className="text-xs text-[var(--ink-soft)] mt-1">
        {target ? `${value}/${target} ${unit}` : `${unit}`}
      </div>
      {pct !== null && (
        <div className="mt-2 h-1 w-full rounded-full bg-[var(--surface-2)] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: emphasize ? 'var(--accent)' : 'var(--ink)' }}
          />
        </div>
      )}
    </div>
  );
}
