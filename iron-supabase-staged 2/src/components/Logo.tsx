export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <line x1="7" y1="16" x2="25" y2="16" />
          <line x1="9" y1="11" x2="9" y2="21" />
          <line x1="23" y1="11" x2="23" y2="21" />
          <line x1="6" y1="13.5" x2="6" y2="18.5" />
          <line x1="26" y1="13.5" x2="26" y2="18.5" />
        </g>
      </svg>
      <span className="font-semibold tracking-tight">Iron</span>
    </span>
  );
}
