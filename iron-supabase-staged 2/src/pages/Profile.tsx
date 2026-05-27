import { useEffect, useState, type ReactNode } from 'react';
import { LogOut, Database, Sparkles, Save } from 'lucide-react';
import { Card, PageHeader } from '@/components/AppShell';
import { useAuth, useDisplayName } from '@/context/AuthContext';
import { hasSupabaseEnv } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';
import { useIronData, type ProfileRecord } from '@/context/IronDataContext';

export default function Profile() {
  const { user, signOut, mode } = useAuth();
  const name = useDisplayName();
  const { profile, saveProfile } = useIronData();
  const [form, setForm] = useState<ProfileRecord>(profile);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(profile), [profile]);

  function patch(patch: Partial<ProfileRecord>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    const { error } = await saveProfile(form);
    setSaving(false);
    setStatus(error ?? 'Saved. This profile will reload with your account.');
  }

  return (
    <>
      <PageHeader eyebrow="Profile" title={name} description={user?.email ?? 'Demo lifter'} />

      <div className="space-y-4 md:space-y-5">
        <Card>
          <div className="eyebrow mb-3">Account</div>
          <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
            <dt className="text-[var(--ink-soft)]">Name</dt>
            <dd>{name}</dd>
            <dt className="text-[var(--ink-soft)]">Email</dt>
            <dd>{user?.email ?? '—'}</dd>
            <dt className="text-[var(--ink-soft)]">Mode</dt>
            <dd className="capitalize">{mode}</dd>
          </dl>
        </Card>

        <Card>
          <div className="eyebrow mb-3">Your information</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name">
              <input className="input" value={form.name} onChange={(e) => patch({ name: e.target.value })} />
            </Field>
            <Field label="Units">
              <select className="input" value={form.units} onChange={(e) => patch({ units: e.target.value as ProfileRecord['units'] })}>
                <option value="lb">Imperial (lb / in)</option>
                <option value="kg">Metric (kg / cm)</option>
              </select>
            </Field>
            <Field label="Sex">
              <select className="input" value={form.sex} onChange={(e) => patch({ sex: e.target.value })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Weight (lb)">
              <input className="input" inputMode="decimal" value={form.weightLb} onChange={(e) => patch({ weightLb: e.target.value })} />
            </Field>
            <Field label="Height (in)">
              <input className="input" inputMode="decimal" value={form.heightIn} onChange={(e) => patch({ heightIn: e.target.value })} />
            </Field>
            <Field label="Age">
              <input className="input" inputMode="numeric" value={form.age} onChange={(e) => patch({ age: e.target.value })} />
            </Field>
            <Field label="Experience">
              <select className="input" value={form.experience} onChange={(e) => patch({ experience: e.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </Field>
            <Field label="Training focus">
              <select className="input" value={form.focus} onChange={(e) => patch({ focus: e.target.value })}>
                <option value="strength">Strength</option>
                <option value="hypertrophy">Hypertrophy</option>
                <option value="powerbuilding">Powerbuilding</option>
                <option value="general">General fitness</option>
              </select>
            </Field>
            <Field label="Activity level">
              <select className="input" value={form.activityLevel} onChange={(e) => patch({ activityLevel: e.target.value })}>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
                <option value="athlete">Athlete</option>
              </select>
            </Field>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button type="button" className="pill" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save profile'}
            </button>
            <span className="text-xs text-[var(--ink-mute)]">{status}</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl surface-soft grid place-items-center text-[var(--accent)] shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="eyebrow mb-1">Supabase</div>
              <div className="font-semibold">
                {hasSupabaseEnv() ? 'Connected' : 'Not yet connected'}
              </div>
              <p className="text-sm text-[var(--ink-soft)] mt-1 max-w-md">
                {hasSupabaseEnv()
                  ? 'Auth is live. Database wiring lands in Stage 3.'
                  : 'Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable real auth.'}
              </p>
            </div>
          </div>
        </Card>

        {/* Extra entry points for the routes that don't fit on the mobile bottom nav. */}
        <Card>
          <div className="flex items-center gap-2 mb-3 text-[var(--ink-soft)]">
            <Sparkles className="w-4 h-4" />
            <span className="eyebrow !text-[var(--ink-soft)]">More</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <ProfileLink to="/goals" label="Goals" />
            <ProfileLink to="/plan" label="Plan" />
            <ProfileLink to="/nutrition" label="Nutrition" />
          </ul>
        </Card>

        <div>
          <button onClick={signOut} className="pill pill-ghost">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      <span className="eyebrow block mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function ProfileLink({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <Link
        to={to}
        className="block surface-soft rounded-xl px-4 py-3 text-[var(--ink)] hover:border-[var(--ink)] transition-colors"
      >
        {label} →
      </Link>
    </li>
  );
}
