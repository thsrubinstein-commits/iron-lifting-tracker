import type { ReactNode } from 'react';
import { TopNav, MobileTopBar, MobileBottomNav } from './Nav';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full flex flex-col">
      <TopNav />
      <MobileTopBar />
      <main className="flex-1 w-full max-w-3xl md:max-w-4xl mx-auto px-5 md:px-8 pt-2 pb-28 md:pb-12">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 md:mb-8">
      {eyebrow ? <div className="eyebrow mb-2">{eyebrow}</div> : null}
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--ink)]">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 text-[var(--ink-soft)] max-w-xl">{description}</p>
      ) : null}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`surface p-5 md:p-6 ${className}`}>{children}</section>;
}
