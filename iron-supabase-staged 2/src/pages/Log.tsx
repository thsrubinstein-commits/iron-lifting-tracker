import { useState } from 'react';
import { Plus, Save, Sparkles } from 'lucide-react';
import { Card, PageHeader } from '@/components/AppShell';
import { useIronData } from '@/context/IronDataContext';

type SetRow = { reps: string; weight: string; rpe: string };
type ExerciseBlock = { id: string; name: string; sets: SetRow[] };

const STARTER_OPTIONS = ['Bench press', 'Barbell row', 'Back squat', 'Deadlift', 'Overhead press', 'Pull-up'];

function emptySet(): SetRow {
  return { reps: '', weight: '', rpe: '' };
}

export default function Log() {
  const { saveSession, savePreset, presets, suggestions } = useIronData();
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([
    { id: crypto.randomUUID(), name: 'Bench press', sets: [emptySet(), emptySet(), emptySet()] },
  ]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [presetName, setPresetName] = useState('');

  function addExercise(name = '') {
    setBlocks((b) => [...b, { id: crypto.randomUUID(), name, sets: [emptySet()] }]);
  }
  function updateSet(blockId: string, i: number, patch: Partial<SetRow>) {
    setBlocks((b) =>
      b.map((bl) =>
        bl.id === blockId
          ? { ...bl, sets: bl.sets.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }
          : bl,
      ),
    );
  }
  function addSet(blockId: string) {
    setBlocks((b) => b.map((bl) => (bl.id === blockId ? { ...bl, sets: [...bl.sets, emptySet()] } : bl)));
  }
  function renameBlock(blockId: string, name: string) {
    setBlocks((b) => b.map((bl) => (bl.id === blockId ? { ...bl, name } : bl)));
  }

  function applyPreset(id: string) {
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    setBlocks(preset.exercises.map((name) => ({ id: crypto.randomUUID(), name, sets: [emptySet(), emptySet(), emptySet()] })));
    setPresetName(preset.name);
    setStatus(`Loaded ${preset.name}.`);
  }

  async function handleSavePreset() {
    const exercises = blocks.map((b) => b.name.trim()).filter(Boolean);
    const { error } = await savePreset({ name: presetName || inferSessionName(exercises), exercises });
    setStatus(error ?? 'Preset saved. You can pick it next time.');
  }

  async function handleSave() {
    setStatus(null);
    const completeSets = blocks.flatMap((block) =>
      block.sets
        .map((set, index) => ({
          exercise: block.name.trim(),
          setIndex: index + 1,
          reps: Number(set.reps),
          weight: Number(set.weight || 0),
          rpe: set.rpe ? Number(set.rpe) : null,
        }))
        .filter((set) => set.exercise && Number.isFinite(set.reps) && set.reps > 0 && Number.isFinite(set.weight)),
    );

    setSaving(true);
    const { error } = await saveSession({
      name: inferSessionName(blocks.map((b) => b.name)),
      notes,
      sets: completeSets,
    });
    setSaving(false);
    if (error) {
      setStatus(error);
      return;
    }
    setStatus('Saved. Your workout will stay with this account.');
    setBlocks([{ id: crypto.randomUUID(), name: 'Bench press', sets: [emptySet(), emptySet(), emptySet()] }]);
    setNotes('');
  }

  return (
    <>
      <PageHeader
        eyebrow="Log"
        title="Today's session"
        description="Add the lifts that matter. Iron will infer the rest."
      />

      <div className="space-y-4 md:space-y-5">
        <Card>
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1">
              <label className="eyebrow block mb-2" htmlFor="preset-picker">Choose preset</label>
              <select id="preset-picker" className="input" defaultValue="" onChange={(e) => applyPreset(e.target.value)}>
                <option value="" disabled>Pick a saved workout</option>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>{preset.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="eyebrow block mb-2" htmlFor="preset-name">Preset name</label>
              <input
                id="preset-name"
                className="input"
                placeholder="Push, Pull, Upper..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
            </div>
            <button type="button" className="pill pill-ghost" onClick={handleSavePreset}>
              <Save className="w-4 h-4" /> Save preset
            </button>
          </div>
        </Card>

        {blocks.map((bl) => (
          <Card key={bl.id}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <input
                aria-label="Exercise name"
                className="input !rounded-lg !py-2 !text-base font-medium max-w-xs"
                value={bl.name}
                placeholder="Choose an exercise"
                onChange={(e) => renameBlock(bl.id, e.target.value)}
                list={`exercise-options-${bl.id}`}
              />
              <datalist id={`exercise-options-${bl.id}`}>
                {STARTER_OPTIONS.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-[2.5rem_1fr_1fr_1fr] gap-3 items-center eyebrow">
              <span>#</span>
              <span>Weight</span>
              <span>Reps</span>
              <span>RPE</span>
            </div>
            <div className="mt-2 space-y-2">
              {bl.sets.map((s, i) => (
                <div key={i} className="grid grid-cols-[2.5rem_1fr_1fr_1fr] gap-3 items-center">
                  <span className="text-sm text-[var(--ink-mute)] tabular-nums">{i + 1}</span>
                  <input
                    className="input"
                    inputMode="decimal"
                    placeholder="lb"
                    value={s.weight}
                    onChange={(e) => updateSet(bl.id, i, { weight: e.target.value })}
                  />
                  <input
                    className="input"
                    inputMode="numeric"
                    placeholder="0"
                    value={s.reps}
                    onChange={(e) => updateSet(bl.id, i, { reps: e.target.value })}
                  />
                  <input
                    className="input"
                    inputMode="decimal"
                    placeholder="—"
                    value={s.rpe}
                    onChange={(e) => updateSet(bl.id, i, { rpe: e.target.value })}
                  />
                </div>
              ))}
            </div>

            {suggestions[bl.name] ? (
              <div className="mt-4 flex items-start gap-2 rounded-2xl px-3 py-2 surface-soft text-sm text-[var(--ink-soft)]">
                <Sparkles className="w-4 h-4 mt-0.5 text-[var(--accent)] shrink-0" />
                <span>{suggestions[bl.name]}</span>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => addSet(bl.id)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]"
            >
              <Plus className="w-4 h-4" /> Add set
            </button>
          </Card>
        ))}

        <Card>
          <label className="eyebrow block mb-2" htmlFor="notes">Session notes</label>
          <textarea
            id="notes"
            className="input min-h-24 resize-y"
            placeholder="How did it feel? Anything to remember next time?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Card>

        <div className="flex items-center gap-3">
          <button type="button" className="pill-ghost pill" onClick={() => addExercise()}>
            <Plus className="w-4 h-4" /> Add exercise
          </button>
          <button type="button" className="pill" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save session'}
          </button>
          <span className="text-xs text-[var(--ink-mute)]">{status ?? 'Saves to your signed-in account.'}</span>
        </div>
      </div>
    </>
  );
}

function inferSessionName(exercises: string[]): string {
  const text = exercises.join(' ').toLowerCase();
  if (/bench|press|tricep|chest|shoulder/.test(text)) return 'Push';
  if (/pull|row|curl|lat|chin|bicep/.test(text)) return 'Pull';
  if (/squat|deadlift|lunge|leg|calf|hamstring/.test(text)) return 'Legs';
  return 'Custom';
}
