import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSupabase, hasSupabaseEnv } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import {
  mockGoals,
  mockNutrition,
  mockPlan,
  mockWorkouts,
  type Goal,
  type NutritionEntry,
  type PR,
  type PlanDay,
  type Workout,
} from '@/data/mock';

export type WorkoutPreset = {
  id: string;
  name: string;
  exercises: string[];
};

export type ProfileRecord = {
  name: string;
  units: 'lb' | 'kg';
  sex: string;
  weightLb: string;
  heightIn: string;
  age: string;
  experience: string;
  focus: string;
  activityLevel: string;
};

type SaveSessionInput = {
  id?: string;
  name: string;
  notes?: string;
  sets: Array<{
    exercise: string;
    setIndex: number;
    reps: number;
    weight: number;
    rpe?: number | null;
  }>;
};

type IronDataState = {
  loading: boolean;
  error: string | null;
  profile: ProfileRecord;
  workouts: Workout[];
  goals: Goal[];
  nutrition: NutritionEntry[];
  prs: PR[];
  plan: PlanDay[];
  presets: WorkoutPreset[];
  suggestions: Record<string, string>;
  reload: () => Promise<void>;
  saveProfile: (profile: ProfileRecord) => Promise<{ error: string | null }>;
  saveSession: (session: SaveSessionInput) => Promise<{ error: string | null }>;
  deleteSession: (id: string) => Promise<{ error: string | null }>;
  savePreset: (preset: Omit<WorkoutPreset, 'id'> & { id?: string }) => Promise<{ error: string | null }>;
};

const DEFAULT_PROFILE: ProfileRecord = {
  name: 'Tommy',
  units: 'lb',
  sex: 'male',
  weightLb: '',
  heightIn: '',
  age: '',
  experience: 'intermediate',
  focus: 'hypertrophy',
  activityLevel: 'active',
};

const IronDataCtx = createContext<IronDataState | null>(null);

export function IronDataProvider({ children }: { children: ReactNode }) {
  const { user, mode } = useAuth();
  const supa = getSupabase();
  const useRemote = Boolean(supa && user && user.id !== 'demo-user' && mode === 'supabase' && hasSupabaseEnv());
  const [loading, setLoading] = useState(useRemote);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRecord>(DEFAULT_PROFILE);
  const [workouts, setWorkouts] = useState<Workout[]>(mockWorkouts);
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [nutrition, setNutrition] = useState<NutritionEntry[]>(mockNutrition);
  const [presets, setPresets] = useState<WorkoutPreset[]>(defaultPresets());
  const plan = mockPlan;

  const loadRemote = useCallback(async () => {
    if (!supa || !user || !useRemote) {
      setProfile({
        ...DEFAULT_PROFILE,
        name: user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Tommy',
      });
      setWorkouts(mockWorkouts);
      setGoals(mockGoals);
      setNutrition(mockNutrition);
      setPresets(defaultPresets());
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [
        profileResult,
        sessionsResult,
        goalsResult,
        nutritionResult,
        presetsResult,
      ] = await Promise.all([
        supa.from('profile').select('*').eq('user_id', user.id).maybeSingle(),
        supa.from('sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }),
        supa.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supa.from('calorie_entries').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(14),
        supa.from('calendar_days').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (sessionsResult.error) throw sessionsResult.error;
      if (goalsResult.error) throw goalsResult.error;
      if (nutritionResult.error) throw nutritionResult.error;
      if (presetsResult.error) throw presetsResult.error;

      const profileRow = profileResult.data as Record<string, unknown> | null;
      setProfile(rowToProfile(profileRow, user.email ?? undefined));

      const sessionRows = (sessionsResult.data ?? []) as Array<Record<string, unknown>>;
      const sessionIds = sessionRows.map((s) => s.id).filter(Boolean);
      let setRows: Array<Record<string, unknown>> = [];
      if (sessionIds.length) {
        const setsResult = await supa
          .from('sets')
          .select('*')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: true });
        if (setsResult.error) throw setsResult.error;
        setRows = (setsResult.data ?? []) as Array<Record<string, unknown>>;
      }
      setWorkouts(rowsToWorkouts(sessionRows, setRows));
      setGoals(((goalsResult.data ?? []) as Array<Record<string, unknown>>).map(rowToGoal));
      setNutrition(((nutritionResult.data ?? []) as Array<Record<string, unknown>>).map(rowToNutritionEntry));
      const remotePresets = ((presetsResult.data ?? []) as Array<Record<string, unknown>>).map(rowToPreset);
      setPresets(remotePresets.length ? remotePresets : defaultPresets());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load Iron data.');
    } finally {
      setLoading(false);
    }
  }, [supa, user, useRemote]);

  useEffect(() => {
    void loadRemote();
  }, [loadRemote]);

  const saveProfile = useCallback<IronDataState['saveProfile']>(async (next) => {
    setProfile(next);
    if (!supa || !user || !useRemote) return { error: null };
    const { error } = await supa.from('profile').upsert({
      user_id: user.id,
      name: next.name || 'Lifter',
      units: next.units,
      sex: next.sex || null,
      weight_kg: next.weightLb ? Number(next.weightLb) * 0.45359237 : null,
      height_cm: next.heightIn ? Number(next.heightIn) * 2.54 : null,
      age: next.age ? Number(next.age) : null,
      experience: next.experience || 'intermediate',
      focus: next.focus || 'hypertrophy',
      activity_level: next.activityLevel || 'active',
    }, { onConflict: 'user_id' });
    if (error) return { error: error.message };
    await loadRemote();
    return { error: null };
  }, [loadRemote, supa, useRemote, user]);

  const saveSession = useCallback<IronDataState['saveSession']>(async (sessionInput) => {
    if (!sessionInput.sets.length) return { error: 'Add at least one complete set before saving.' };
    if (!supa || !user || !useRemote) {
      const now = new Date().toISOString();
      const grouped = groupInputSets(sessionInput.sets);
      setWorkouts((current) => {
        const nextWorkout = { id: sessionInput.id ?? crypto.randomUUID(), date: now, name: sessionInput.name, durationMin: 0, notes: sessionInput.notes, sets: grouped };
        return sessionInput.id ? current.map((w) => (w.id === sessionInput.id ? nextWorkout : w)) : [nextWorkout, ...current];
      });
      return { error: null };
    }

    const now = Date.now();
    if (sessionInput.id) {
      const { error: updateError } = await supa
        .from('sessions')
        .update({
          template: sessionInput.name.toLowerCase(),
          name: sessionInput.name,
          notes: sessionInput.notes || null,
        })
        .eq('id', sessionInput.id)
        .eq('user_id', user.id);
      if (updateError) return { error: updateError.message };
      const { error: deleteSetsError } = await supa
        .from('sets')
        .delete()
        .eq('session_id', sessionInput.id)
        .eq('user_id', user.id);
      if (deleteSetsError) return { error: deleteSetsError.message };
      const { error: newSetsError } = await supa.from('sets').insert(
        sessionInput.sets.map((s) => ({
          user_id: user.id,
          session_id: sessionInput.id,
          exercise_key: slugify(s.exercise),
          exercise_name: s.exercise,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe ?? null,
          set_index: s.setIndex,
          created_at: now,
        })),
      );
      if (newSetsError) return { error: newSetsError.message };
      await loadRemote();
      return { error: null };
    }

    const { data: createdSession, error: sessionError } = await supa
      .from('sessions')
      .insert({
        user_id: user.id,
        template: sessionInput.name.toLowerCase(),
        name: sessionInput.name,
        started_at: now,
        ended_at: now,
        notes: sessionInput.notes || null,
      })
      .select('id')
      .single();
    if (sessionError) return { error: sessionError.message };

    const sessionId = (createdSession as { id: number | string }).id;
    const { error: setsError } = await supa.from('sets').insert(
      sessionInput.sets.map((s) => ({
        user_id: user.id,
        session_id: sessionId,
        exercise_key: slugify(s.exercise),
        exercise_name: s.exercise,
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe ?? null,
        set_index: s.setIndex,
        created_at: now,
      })),
    );
    if (setsError) return { error: setsError.message };
    await loadRemote();
    return { error: null };
  }, [loadRemote, supa, useRemote, user]);

  const deleteSession = useCallback<IronDataState['deleteSession']>(async (id) => {
    if (!supa || !user || !useRemote) {
      setWorkouts((current) => current.filter((w) => w.id !== id));
      return { error: null };
    }
    const { error: setsError } = await supa.from('sets').delete().eq('session_id', id).eq('user_id', user.id);
    if (setsError) return { error: setsError.message };
    const { error: sessionError } = await supa.from('sessions').delete().eq('id', id).eq('user_id', user.id);
    if (sessionError) return { error: sessionError.message };
    await loadRemote();
    return { error: null };
  }, [loadRemote, supa, useRemote, user]);

  const savePreset = useCallback<IronDataState['savePreset']>(async (preset) => {
    const cleaned = {
      id: preset.id ?? crypto.randomUUID(),
      name: preset.name.trim() || 'Workout preset',
      exercises: preset.exercises.map((e) => e.trim()).filter(Boolean),
    };
    if (!cleaned.exercises.length) return { error: 'Add at least one exercise before saving a preset.' };
    setPresets((current) => preset.id ? current.map((p) => (p.id === preset.id ? cleaned : p)) : [cleaned, ...current]);
    if (!supa || !user || !useRemote) return { error: null };
    const payload = {
      user_id: user.id,
      day_index: 0,
      split_key: slugify(cleaned.name),
      workout_name: cleaned.name,
      exercise_keys: cleaned.exercises,
      is_pr_day: false,
      notes: 'Iron preset',
      updated_at: Date.now(),
    };
    const query = preset.id && /^\d+$/.test(preset.id)
      ? supa.from('calendar_days').update(payload).eq('id', preset.id).eq('user_id', user.id)
      : supa.from('calendar_days').insert(payload);
    const { error } = await query;
    if (error) return { error: error.message };
    await loadRemote();
    return { error: null };
  }, [loadRemote, supa, useRemote, user]);

  const prs = useMemo(() => computePRs(workouts), [workouts]);
  const suggestions = useMemo(() => computeSuggestions(workouts), [workouts]);

  const value = useMemo<IronDataState>(
    () => ({
      loading,
      error,
      profile,
      workouts,
      goals,
      nutrition,
      prs,
      plan,
      presets,
      suggestions,
      reload: loadRemote,
      saveProfile,
      saveSession,
      deleteSession,
      savePreset,
    }),
    [deleteSession, error, goals, loadRemote, loading, nutrition, plan, presets, profile, prs, savePreset, saveProfile, saveSession, suggestions, workouts],
  );

  return <IronDataCtx.Provider value={value}>{children}</IronDataCtx.Provider>;
}

export function useIronData(): IronDataState {
  const v = useContext(IronDataCtx);
  if (!v) throw new Error('useIronData must be used inside <IronDataProvider>');
  return v;
}

function rowToProfile(row: Record<string, unknown> | null, email?: string): ProfileRecord {
  if (!row) {
    return { ...DEFAULT_PROFILE, name: email?.split('@')[0] || DEFAULT_PROFILE.name };
  }
  return {
    name: String(row.name ?? email?.split('@')[0] ?? 'Lifter'),
    units: String(row.units ?? 'lb') === 'kg' ? 'kg' : 'lb',
    sex: String(row.sex ?? 'male'),
    weightLb: row.weight_kg ? String(Math.round(Number(row.weight_kg) / 0.45359237)) : '',
    heightIn: row.height_cm ? String(Math.round(Number(row.height_cm) / 2.54)) : '',
    age: row.age ? String(row.age) : '',
    experience: String(row.experience ?? 'intermediate'),
    focus: String(row.focus ?? 'hypertrophy'),
    activityLevel: String(row.activity_level ?? 'active'),
  };
}

function rowsToWorkouts(sessionRows: Array<Record<string, unknown>>, setRows: Array<Record<string, unknown>>): Workout[] {
  const setsBySession = new Map<string, Array<Record<string, unknown>>>();
  for (const row of setRows) {
    const key = String(row.session_id);
    setsBySession.set(key, [...(setsBySession.get(key) ?? []), row]);
  }
  return sessionRows.map((session) => {
    const rows = setsBySession.get(String(session.id)) ?? [];
    const byExercise = new Map<string, Array<Record<string, unknown>>>();
    for (const row of rows) {
      const exercise = String(row.exercise_name ?? row.exercise_key ?? 'Exercise');
      byExercise.set(exercise, [...(byExercise.get(exercise) ?? []), row]);
    }
    return {
      id: String(session.id),
      date: new Date(Number(session.started_at) || Date.now()).toISOString(),
      name: String(session.name ?? session.template ?? 'Workout'),
      durationMin: durationMinutes(session.started_at, session.ended_at),
      notes: session.notes ? String(session.notes) : undefined,
      sets: Array.from(byExercise.entries()).map(([exercise, exerciseSets]) => ({
        exercise,
        sets: exerciseSets
          .sort((a, b) => Number(a.set_index ?? 0) - Number(b.set_index ?? 0))
          .map((row) => ({
            reps: Number(row.reps ?? 0),
            weight: Number(row.weight ?? 0),
            rpe: row.rpe == null ? undefined : Number(row.rpe),
          })),
      })),
    };
  });
}

function rowToGoal(row: Record<string, unknown>): Goal {
  return {
    id: String(row.id),
    title: String(row.title ?? 'Goal'),
    metric: String(row.type ?? row.exercise_key ?? 'Target'),
    target: Number(row.target_value ?? 0),
    unit: String(row.unit ?? 'lb') as Goal['unit'],
    current: Number(row.current_value ?? 0),
    pinned: String(row.status ?? 'active') === 'active',
  };
}

function rowToNutritionEntry(row: Record<string, unknown>): NutritionEntry {
  return {
    id: String(row.id),
    date: String(row.date ?? new Date().toISOString().slice(0, 10)),
    kcal: Number(row.calories ?? 0),
    protein: Number(row.protein_g ?? 0),
    carbs: Number(row.carbs_g ?? 0),
    fat: Number(row.fat_g ?? 0),
    note: row.name ? String(row.name) : undefined,
  };
}

function rowToPreset(row: Record<string, unknown>): WorkoutPreset {
  const rawExercises = row.exercise_keys;
  const exercises = Array.isArray(rawExercises)
    ? rawExercises.map(String)
    : typeof rawExercises === 'string'
      ? rawExercises.replace(/[{}"]/g, '').split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  return {
    id: String(row.id),
    name: String(row.workout_name ?? row.split_key ?? 'Workout preset'),
    exercises,
  };
}

function defaultPresets(): WorkoutPreset[] {
  return [
    { id: 'preset-push', name: 'Push', exercises: ['Bench press', 'Overhead press', 'Incline dumbbell press', 'Tricep pushdown'] },
    { id: 'preset-pull', name: 'Pull', exercises: ['Pull-up', 'Barbell row', 'Lat pulldown', 'Face pull'] },
    { id: 'preset-legs', name: 'Legs', exercises: ['Back squat', 'Romanian deadlift', 'Walking lunge', 'Calf raise'] },
    { id: 'preset-full-body', name: 'Full Body', exercises: ['Back squat', 'Bench press', 'Barbell row', 'Overhead press'] },
  ];
}

function groupInputSets(sets: SaveSessionInput['sets']): Workout['sets'] {
  const byExercise = new Map<string, Workout['sets'][number]['sets']>();
  for (const set of sets) {
    byExercise.set(set.exercise, [...(byExercise.get(set.exercise) ?? []), {
      reps: set.reps,
      weight: set.weight,
      rpe: set.rpe ?? undefined,
    }]);
  }
  return Array.from(byExercise.entries()).map(([exercise, exerciseSets]) => ({ exercise, sets: exerciseSets }));
}

function computePRs(workouts: Workout[]): PR[] {
  const best = new Map<string, PR>();
  for (const workout of workouts) {
    for (const exercise of workout.sets) {
      for (const set of exercise.sets) {
        if (!set.reps) continue;
        const e1rm = Math.round(set.weight * (1 + set.reps / 30));
        const current = best.get(exercise.exercise);
        if (!current || e1rm > current.oneRepMax) {
          best.set(exercise.exercise, {
            exercise: exercise.exercise,
            oneRepMax: e1rm,
            bestSet: { weight: set.weight, reps: set.reps },
            date: workout.date,
          });
        }
      }
    }
  }
  return Array.from(best.values()).sort((a, b) => b.oneRepMax - a.oneRepMax);
}

function computeSuggestions(workouts: Workout[]): Record<string, string> {
  const byExercise = new Map<string, Array<{ date: number; weight: number; reps: number }>>();
  for (const workout of workouts) {
    for (const exercise of workout.sets) {
      const top = exercise.sets
        .filter((set) => set.reps > 0)
        .sort((a, b) => (b.weight * b.reps) - (a.weight * a.reps))[0];
      if (!top) continue;
      byExercise.set(exercise.exercise, [
        ...(byExercise.get(exercise.exercise) ?? []),
        { date: new Date(workout.date).getTime(), weight: top.weight, reps: top.reps },
      ]);
    }
  }

  const suggestions: Record<string, string> = {};
  for (const [exercise, entries] of byExercise.entries()) {
    const recent = entries.sort((a, b) => b.date - a.date).slice(0, 3);
    if (recent.length < 2) continue;
    const sameWeight = recent.every((entry) => entry.weight === recent[0].weight);
    const sameOrHigherReps = recent.every((entry) => entry.reps >= recent[0].reps - 1);
    if (sameWeight && sameOrHigherReps && recent[0].weight > 0) {
      suggestions[exercise] = `You have repeated ${recent[0].weight} lb on ${exercise}. Try ${recent[0].weight + 5} lb next time, or keep ${recent[0].weight} lb and add 1–2 reps.`;
    } else if (sameWeight) {
      suggestions[exercise] = `Stay at ${recent[0].weight || 'bodyweight'} for ${exercise}, but aim for cleaner reps before adding load.`;
    }
  }
  return suggestions;
}

function durationMinutes(startedAt: unknown, endedAt: unknown): number {
  const start = Number(startedAt);
  const end = Number(endedAt);
  if (!start || !end || end <= start) return 0;
  return Math.max(0, Math.round((end - start) / 60_000));
}

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'exercise';
}
