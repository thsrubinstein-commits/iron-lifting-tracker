import { useState } from 'react';
import { Save, Trash2, X } from 'lucide-react';
import { Card, PageHeader } from '@/components/AppShell';
import { relativeTime } from '@/data/mock';
import { useIronData } from '@/context/IronDataContext';
import type { Workout } from '@/data/mock';

type EditingWorkout = Workout & {
  editableSets: Array<{ exercise: string; setIndex: number; weight: string; reps: string; rpe: string }>;
};

export default function History() {
  const { workouts, loading, saveSession, deleteSession, suggestions } = useIronData();
  const [editing, setEditing] = useState<EditingWorkout | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  function startEditing(workout: Workout) {
    setStatus(null);
    setEditing({
      ...workout,
      editableSets: workout.sets.flatMap((ex) =>
        ex.sets.map((set, index) => ({
          exercise: ex.exercise,
          setIndex: index + 1,
          weight: String(set.weight || ''),
          reps: String(set.reps || ''),
          rpe: set.rpe == null ? '' : String(set.rpe),
        })),
      ),
    });
  }

  function updateEdit(index: number, patch: Partial<EditingWorkout['editableSets'][number]>) {
    setEditing((current) => current ? {
      ...current,
      editableSets: current.editableSets.map((set, i) => (i === index ? { ...set, ...patch } : set)),
    } : current);
  }

  async function saveEdit() {
    if (!editing) return;
    const { error } = await saveSession({
      id: editing.id,
      name: editing.name,
      notes: editing.notes,
      sets: editing.editableSets
        .filter((set) => set.exercise.trim() && Number(set.reps) > 0)
        .map((set, index) => ({
          exercise: set.exercise,
          setIndex: index + 1,
          weight: Number(set.weight || 0),
          reps: Number(set.reps),
          rpe: set.rpe ? Number(set.rpe) : null,
        })),
    });
    setStatus(error ?? 'Workout updated.');
    if (!error) setEditing(null);
  }

  async function removeWorkout(id: string) {
    const { error } = await deleteSession(id);
    setStatus(error ?? 'Workout deleted.');
  }

  return (
    <>
      <PageHeader
        eyebrow="History"
        title="Every session you've logged"
        description="Tap a session to revisit the sets, weights, and notes from that day."
      />
      <div className="space-y-3 md:space-y-4">
        {workouts.length === 0 && (
          <Card>
            <div className="font-semibold">No sessions saved yet.</div>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              {loading ? 'Loading your sessions…' : 'Log a workout and it will stay with your account.'}
            </p>
          </Card>
        )}
        {workouts.map((w) => {
          const totalSets = w.sets.reduce((n, ex) => n + ex.sets.length, 0);
          const totalVolume = w.sets.reduce(
            (s, ex) => s + ex.sets.reduce((s2, set) => s2 + set.weight * set.reps, 0),
            0,
          );
          const isEditing = editing?.id === w.id;
          return (
            <Card key={w.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="eyebrow mb-1">{relativeTime(w.date)}</div>
                  {isEditing ? (
                    <input
                      className="input !py-2 !text-xl font-semibold"
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    />
                  ) : (
                    <div className="text-xl font-semibold">{w.name}</div>
                  )}
                  {w.notes ? (
                    <p className="text-sm text-[var(--ink-soft)] mt-1 max-w-md">{w.notes}</p>
                  ) : null}
                </div>
                <dl className="text-right text-sm text-[var(--ink-soft)] grid gap-1">
                  <div>
                    <span className="tabular-nums font-semibold text-[var(--ink)]">{w.durationMin}</span> min
                  </div>
                  <div>
                    <span className="tabular-nums font-semibold text-[var(--ink)]">{totalSets}</span> sets
                  </div>
                  <div>
                    <span className="tabular-nums font-semibold text-[var(--ink)]">
                      {totalVolume.toLocaleString()}
                    </span>{' '}
                    lb
                  </div>
                </dl>
              </div>

              {isEditing ? (
                <div className="mt-4 border-t border-[var(--border)] pt-4 space-y-2">
                  <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 eyebrow">
                    <span>Exercise</span><span>Weight</span><span>Reps</span><span>RPE</span>
                  </div>
                  {editing.editableSets.map((set, index) => (
                    <div key={index} className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2">
                      <input className="input" value={set.exercise} onChange={(e) => updateEdit(index, { exercise: e.target.value })} />
                      <input className="input" inputMode="decimal" value={set.weight} onChange={(e) => updateEdit(index, { weight: e.target.value })} />
                      <input className="input" inputMode="numeric" value={set.reps} onChange={(e) => updateEdit(index, { reps: e.target.value })} />
                      <input className="input" inputMode="decimal" value={set.rpe} onChange={(e) => updateEdit(index, { rpe: e.target.value })} />
                    </div>
                  ))}
                  <textarea
                    className="input min-h-20"
                    placeholder="Notes"
                    value={editing.notes ?? ''}
                    onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  />
                  <div className="flex items-center gap-2 pt-2">
                    <button type="button" className="pill" onClick={saveEdit}><Save className="w-4 h-4" /> Save edits</button>
                    <button type="button" className="pill pill-ghost" onClick={() => setEditing(null)}><X className="w-4 h-4" /> Cancel</button>
                  </div>
                </div>
              ) : (
              <ul className="mt-4 border-t border-[var(--border)] pt-4 space-y-1.5 text-sm">
                {w.sets.map((ex) => (
                  <li key={ex.exercise} className="flex items-center justify-between gap-4">
                    <span className="text-[var(--ink)]">{ex.exercise}</span>
                    <span className="text-[var(--ink-soft)] tabular-nums">
                      {ex.sets.map((s) => (s.weight ? `${s.weight}×${s.reps}` : `BW×${s.reps}`)).join('  ·  ')}
                    </span>
                  </li>
                ))}
              </ul>
              )}
              {!isEditing && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button type="button" className="pill pill-ghost" onClick={() => startEditing(w)}>Edit workout</button>
                  <button type="button" className="pill pill-ghost" onClick={() => removeWorkout(w.id)}><Trash2 className="w-4 h-4" /> Delete</button>
                </div>
              )}
              {w.sets.map((ex) => suggestions[ex.exercise] ? (
                <p key={ex.exercise} className="mt-3 text-sm text-[var(--accent)]">{suggestions[ex.exercise]}</p>
              ) : null)}
            </Card>
          );
        })}
        {status ? <p className="text-sm text-[var(--ink-soft)]">{status}</p> : null}
      </div>
    </>
  );
}
