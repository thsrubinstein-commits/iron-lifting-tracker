import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

type Mode = 'signin' | 'signup';

export function AuthScreen() {
  const { signInWithPassword, signUpWithPassword, enterDemoMode, mode: authMode } = useAuth();
  const { theme, toggle } = useTheme();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    const result = mode === 'signin'
      ? await signInWithPassword(email.trim(), password)
      : await signUpWithPassword(email.trim(), password, name.trim());
    setSubmitting(false);
    if (result.error) setError(result.error);
    const maybeMessage = 'message' in result ? result.message : undefined;
    if (typeof maybeMessage === 'string') setNotice(maybeMessage);
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="flex items-center justify-between px-5 md:px-8 py-4">
        <Logo />
        <button
          aria-label="Toggle theme"
          onClick={toggle}
          className="w-9 h-9 rounded-full grid place-items-center text-[var(--ink-soft)] hover:text-[var(--ink)]"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      <main className="flex-1 grid place-items-center px-5 pb-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="eyebrow mb-3">{authMode === 'supabase' ? 'Welcome back' : 'Stage 1 preview'}</div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              {mode === 'signin' ? 'Sign in to Iron.' : 'Start lifting smarter.'}
            </h1>
            <p className="mt-2 text-[var(--ink-soft)]">
              {mode === 'signin'
                ? 'Pick up where you left off — your PRs are waiting.'
                : 'Track lifts, watch PRs climb, and keep nutrition honest.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="surface p-5 md:p-6 space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="eyebrow block mb-1.5" htmlFor="name">Name</label>
                <input
                  id="name"
                  className="input"
                  placeholder="Tommy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label className="eyebrow block mb-1.5" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="eyebrow block mb-1.5" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="text-sm rounded-xl px-3 py-2"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                {error}
              </div>
            )}
            {notice && (
              <div
                role="status"
                className="text-sm rounded-xl px-3 py-2"
                style={{ background: 'var(--surface-strong)', color: 'var(--ink)' }}
              >
                {notice}
              </div>
            )}

            <button type="submit" disabled={submitting} className="pill w-full justify-center mt-1">
              {submitting ? 'One sec…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-sm text-[var(--ink-soft)] pt-1">
              {mode === 'signin' ? (
                <>
                  New here?{' '}
                  <button type="button" className="accent-link !inline" onClick={() => setMode('signup')}>
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have one?{' '}
                  <button type="button" className="accent-link !inline" onClick={() => setMode('signin')}>
                    Sign in
                  </button>
                </>
              )}
            </div>
          </form>

          <button
            type="button"
            onClick={() => enterDemoMode(name || email.split('@')[0] || 'Tommy')}
            className="mt-4 w-full rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-center text-sm font-medium text-[var(--ink)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--ink)]"
          >
            Continue without account — test the app →
          </button>

          {authMode === 'demo' && (
            <p className="mt-6 text-xs text-center text-[var(--ink-mute)] leading-relaxed">
              No Supabase keys detected. The auth form is staged, but until
              <code className="font-mono mx-1">VITE_SUPABASE_URL</code>
              and
              <code className="font-mono mx-1">VITE_SUPABASE_PUBLISHABLE_KEY</code>
              are set, sign-in is a local-only preview.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
