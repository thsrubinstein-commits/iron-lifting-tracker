import { NavLink } from 'react-router-dom';
import {
  Home as HomeIcon,
  ClipboardList,
  History,
  Trophy,
  Target,
  CalendarDays,
  Apple,
  User,
  Moon,
  Sun,
} from 'lucide-react';
import { Logo } from './Logo';
import { useTheme } from '@/context/ThemeContext';

type Item = { to: string; label: string; Icon: typeof HomeIcon };

export const navItems: Item[] = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/log', label: 'Log', Icon: ClipboardList },
  { to: '/history', label: 'History', Icon: History },
  { to: '/prs', label: 'PRs', Icon: Trophy },
  { to: '/goals', label: 'Goals', Icon: Target },
  { to: '/plan', label: 'Plan', Icon: CalendarDays },
  { to: '/nutrition', label: 'Nutrition', Icon: Apple },
  { to: '/profile', label: 'Profile', Icon: User },
];

export function TopNav() {
  const { theme, toggle } = useTheme();
  return (
    <header className="hidden md:flex items-center justify-between gap-6 px-8 py-4 border-b border-[var(--border)]">
      <div className="text-[var(--ink)]">
        <Logo />
      </div>
      <nav className="flex items-center gap-1 surface-soft !rounded-full px-1.5 py-1.5">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm transition-colors',
                isActive
                  ? 'bg-[var(--ink)] text-[var(--bg)]'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]',
              ].join(' ')
            }
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>
      <button
        aria-label="Toggle theme"
        onClick={toggle}
        className="w-9 h-9 rounded-full grid place-items-center text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  );
}

export function MobileTopBar() {
  const { theme, toggle } = useTheme();
  return (
    <header className="md:hidden flex items-center justify-between px-5 pt-4 pb-2">
      <Logo />
      <button
        aria-label="Toggle theme"
        onClick={toggle}
        className="w-9 h-9 rounded-full grid place-items-center text-[var(--ink-soft)]"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  );
}

export function MobileBottomNav() {
  // Bottom nav surfaces 5 of the 8 routes; the rest live in Profile.
  const primary = navItems.filter((i) =>
    ['/', '/log', '/history', '/prs', '/profile'].includes(i.to),
  );
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--surface)]/95 backdrop-blur border-t border-[var(--border)] bottom-safe">
      <ul className="grid grid-cols-5">
        {primary.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-1 py-2.5 text-[11px]',
                  isActive ? 'text-[var(--ink)]' : 'text-[var(--ink-mute)]',
                ].join(' ')
              }
            >
              <Icon className="w-5 h-5" strokeWidth={1.75} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
