import { Card, PageHeader } from '@/components/AppShell';
import { useIronData } from '@/context/IronDataContext';

export default function Plan() {
  const { plan } = useIronData();
  return (
    <>
      <PageHeader
        eyebrow="Plan"
        title="This week, at a glance"
        description="A simple weekly template. Edit the focus, swap days, or let the AI fill the gaps."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {plan.map((d) => (
          <Card key={d.day}>
            <div className="flex items-baseline justify-between mb-3">
              <div className="eyebrow">{d.day}</div>
              <div className="text-base font-semibold text-[var(--ink)]">{d.focus}</div>
            </div>
            <ul className="space-y-1.5 text-sm text-[var(--ink-soft)]">
              {d.exercises.map((ex) => (
                <li key={ex} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[var(--ink-mute)]" />
                  {ex}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
