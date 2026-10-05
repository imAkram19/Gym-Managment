import React, { useState, useEffect } from 'react';

// ── CLOCK DISPLAY — live reception clock ───────────────────
// Renders: 08:43 AM · Wed, Oct 5
// Updates every second — purely presentational
// aria-hidden: true — decorative for sighted reception staff

export const ClockDisplay: React.FC = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className="hidden sm:flex items-center gap-1.5 select-none"
      aria-hidden="true"  // Decorative — reception glances at physical clock
    >
      <span className="text-sm font-mono font-semibold tabular-nums text-[var(--text-primary)] numeric">
        {timeStr}
      </span>
      <span className="text-[var(--border-strong)]">·</span>
      <span className="text-sm text-[var(--text-secondary)]">
        {dateStr}
      </span>
    </div>
  );
};
