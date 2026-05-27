// Placeholder data — replaced in Stages 3 and 4 by Supabase queries.
// Numbers are tuned to match the example shown in the live reference site
// (1 session this week, 8,150 lb volume, best e1RM 260 on pull-up, etc.).

export type Set = { reps: number; weight: number; rpe?: number };
export type Workout = {
  id: string;
  date: string; // ISO
  name: string; // "Pull", "Push", "Legs", "Upper", etc.
  durationMin: number;
  notes?: string;
  sets: Array<{ exercise: string; sets: Set[] }>;
};

export type Goal = {
  id: string;
  title: string;
  metric: string; // "Bench 1RM"
  target: number;
  unit: 'lb' | 'kg' | 'reps';
  current: number;
  pinned?: boolean;
};

export type PR = {
  exercise: string;
  oneRepMax: number; // estimated
  bestSet: { weight: number; reps: number };
  date: string;
};

export type NutritionEntry = {
  id: string;
  date: string; // ISO date
  kcal: number;
  protein: number; // grams
  carbs: number;
  fat: number;
  note?: string;
};

export type PlanDay = {
  day: string; // "Mon"
  focus: string; // "Push"
  exercises: string[];
};

export const mockWorkouts: Workout[] = [
  {
    id: 'w1',
    date: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    name: 'Pull',
    durationMin: 58,
    notes: 'Felt strong. Bumped row by 5 lb.',
    sets: [
      { exercise: 'Pull-up', sets: [
        { reps: 8, weight: 0 }, { reps: 7, weight: 0 }, { reps: 6, weight: 0 },
      ]},
      { exercise: 'Barbell row', sets: [
        { reps: 8, weight: 155 }, { reps: 8, weight: 155 }, { reps: 6, weight: 165 },
      ]},
      { exercise: 'Lat pulldown', sets: [
        { reps: 10, weight: 130 }, { reps: 10, weight: 130 }, { reps: 8, weight: 140 },
      ]},
      { exercise: 'Face pull', sets: [
        { reps: 15, weight: 40 }, { reps: 15, weight: 40 },
      ]},
    ],
  },
  {
    id: 'w2',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    name: 'Legs',
    durationMin: 64,
    sets: [
      { exercise: 'Back squat', sets: [
        { reps: 5, weight: 225 }, { reps: 5, weight: 235 }, { reps: 3, weight: 255 },
      ]},
      { exercise: 'Romanian deadlift', sets: [
        { reps: 8, weight: 205 }, { reps: 8, weight: 205 },
      ]},
      { exercise: 'Walking lunge', sets: [
        { reps: 12, weight: 40 }, { reps: 12, weight: 40 },
      ]},
    ],
  },
  {
    id: 'w3',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    name: 'Push',
    durationMin: 55,
    sets: [
      { exercise: 'Bench press', sets: [
        { reps: 5, weight: 205 }, { reps: 5, weight: 215 }, { reps: 1, weight: 255 },
      ]},
      { exercise: 'Overhead press', sets: [
        { reps: 6, weight: 115 }, { reps: 6, weight: 115 },
      ]},
      { exercise: 'Incline dumbbell press', sets: [
        { reps: 10, weight: 65 }, { reps: 10, weight: 65 },
      ]},
    ],
  },
];

export const mockGoals: Goal[] = [
  { id: 'g1', title: 'Bench 275 x 1', metric: 'Bench 1RM', target: 275, unit: 'lb', current: 255, pinned: true },
  { id: 'g2', title: 'Squat 315 x 5', metric: 'Squat top set', target: 315, unit: 'lb', current: 255 },
  { id: 'g3', title: 'Pull-up 12 reps', metric: 'Bodyweight pull-up', target: 12, unit: 'reps', current: 8 },
];

export const mockPRs: PR[] = [
  // Pull-up tops the list to match the live reference ("Best e1RM 260 — Pull-up").
  { exercise: 'Pull-up', oneRepMax: 260, bestSet: { weight: 0, reps: 11 }, date: '2026-04-12' },
  { exercise: 'Deadlift', oneRepMax: 255, bestSet: { weight: 235, reps: 3 }, date: '2026-03-30' },
  { exercise: 'Bench press', oneRepMax: 255, bestSet: { weight: 255, reps: 1 }, date: '2026-05-02' },
  { exercise: 'Back squat', oneRepMax: 240, bestSet: { weight: 225, reps: 3 }, date: '2026-05-19' },
];

export const mockNutrition: NutritionEntry[] = [
  { id: 'n1', date: new Date().toISOString().slice(0, 10), kcal: 2480, protein: 192, carbs: 264, fat: 78 },
  { id: 'n2', date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), kcal: 2310, protein: 188, carbs: 240, fat: 72 },
  { id: 'n3', date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), kcal: 2640, protein: 205, carbs: 290, fat: 80 },
];

export const mockPlan: PlanDay[] = [
  { day: 'Mon', focus: 'Push', exercises: ['Bench press', 'Overhead press', 'Incline dumbbell press', 'Tricep pushdown'] },
  { day: 'Tue', focus: 'Pull', exercises: ['Pull-up', 'Barbell row', 'Lat pulldown', 'Face pull'] },
  { day: 'Wed', focus: 'Rest', exercises: ['Walk 30 min', 'Mobility flow'] },
  { day: 'Thu', focus: 'Legs', exercises: ['Back squat', 'Romanian deadlift', 'Walking lunge', 'Calf raise'] },
  { day: 'Fri', focus: 'Upper', exercises: ['Bench press', 'Barbell row', 'Lateral raise', 'Chin-up'] },
  { day: 'Sat', focus: 'Optional', exercises: ['Conditioning', 'Carries'] },
  { day: 'Sun', focus: 'Rest', exercises: ['Sleep in. You earned it.'] },
];

// Simple aggregate helpers used by the Home dashboard.
export function summarizeLastSevenDays(workouts: Workout[]) {
  const cutoff = Date.now() - 7 * 86400000;
  const recent = workouts.filter((w) => new Date(w.date).getTime() >= cutoff);
  const volume = recent.reduce((sum, w) => sum + w.sets.reduce(
    (s, ex) => s + ex.sets.reduce((s2, set) => s2 + set.weight * set.reps, 0), 0), 0);
  return { sessions: recent.length, volume };
}

export function bestE1RM(prs: PR[]) {
  return prs.reduce((best, p) => (p.oneRepMax > best.oneRepMax ? p : best), prs[0]);
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diff / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `about ${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
