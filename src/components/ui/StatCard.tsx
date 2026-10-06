import React from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ── STAT CARD — Double-Bezel Architecture (high-end-visual-design skill)
// Pure UI component — NO data fetching (master plan §6.2)
// Used on Dashboard for: Total Members, Active, Expiring, Revenue

type AccentColor = 'blue' | 'green' | 'amber' | 'red' | 'zinc';

interface StatCardDelta {
  value: number;   // e.g. 12 or -3
  label: string;   // e.g. 'vs last month'
}

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: StatCardDelta;
  icon: LucideIcon;
  accentColor?: AccentColor;
  onClick?: () => void;
  isMonetary?: boolean;   // renders ₹ prefix with mono font
  isLoading?: boolean;
  className?: string;
}

const accentMap: Record<AccentColor, { iconBg: string; iconText: string; ring: string }> = {
  blue:  { iconBg: 'bg-[var(--accent-light)]',          iconText: 'text-[var(--accent)]',         ring: 'ring-[var(--accent-mid)]' },
  green: { iconBg: 'bg-[var(--status-active-bg)]',      iconText: 'text-[var(--status-active)]',   ring: 'ring-green-200' },
  amber: { iconBg: 'bg-[var(--status-expiring-bg)]',    iconText: 'text-[var(--status-expiring)]', ring: 'ring-amber-200' },
  red:   { iconBg: 'bg-[var(--danger-light)]',          iconText: 'text-[var(--danger)]',          ring: 'ring-[var(--danger-border)]' },
  zinc:  { iconBg: 'bg-[var(--status-inactive-bg)]',    iconText: 'text-[var(--status-inactive)]', ring: 'ring-slate-200' },
};

function formatValue(value: string | number, isMonetary: boolean): string {
  if (typeof value === 'number') {
    if (isMonetary) {
      return `₹${value.toLocaleString('en-IN')}`;
    }
    return value.toLocaleString('en-IN');
  }
  return value;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  delta,
  icon: Icon,
  accentColor = 'blue',
  onClick,
  isMonetary = false,
  isLoading = false,
  className,
}) => {
  const accent = accentMap[accentColor];
  const isPositive = delta && delta.value > 0;
  const isNegative = delta && delta.value < 0;

  const cardContent = (
    // high-end-visual-design skill: Double-Bezel (Doppelrand) architecture
    // Outer shell: subtle border ring on ground bg
    <div
      className={clsx(
        'p-px rounded-[var(--radius-xl)]',
        'transition-shadow duration-200',
        onClick && 'cursor-pointer',
        className,
      )}
      style={{ background: 'var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {/* Inner core: pure white with top-highlight */}
      <div
        className="rounded-[calc(var(--radius-xl)-1px)] bg-white p-3.5 sm:p-5 overflow-hidden"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)' }}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <StatCardSkeleton />
        ) : (
          <div className="flex items-start justify-between gap-2.5 sm:gap-4">
            {/* Left: label + value + delta */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5 sm:mb-2 truncate">
                {label}
              </p>
              <p className={clsx(
                'text-lg sm:text-[1.85rem] font-bold leading-tight tracking-tight numeric text-[var(--text-primary)] truncate',
                isMonetary && 'font-mono',
              )}>
                {formatValue(value, isMonetary)}
              </p>
              {delta && (
                <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
                  {isPositive && <TrendingUp className="w-3 h-3 text-[var(--status-active)]" aria-hidden />}
                  {isNegative && <TrendingDown className="w-3 h-3 text-[var(--danger)]" aria-hidden />}
                  {!isPositive && !isNegative && <Minus className="w-3 h-3 text-[var(--text-muted)]" aria-hidden />}
                  <span className={clsx(
                    'text-[10px] sm:text-[11px] font-semibold truncate',
                    isPositive && 'text-[var(--status-active)]',
                    isNegative && 'text-[var(--danger)]',
                    !isPositive && !isNegative && 'text-[var(--text-muted)]',
                  )}>
                    {isPositive ? '+' : ''}{delta.value}% {delta.label}
                  </span>
                </div>
              )}
            </div>

            {/* Right: icon box */}
            <div className={clsx(
              'w-8 h-8 sm:w-10 sm:h-10 rounded-[var(--radius-md)] flex-shrink-0',
              'flex items-center justify-center',
              accent.iconBg,
            )}>
              <Icon className={clsx('w-4 h-4 sm:w-5 sm:h-5', accent.iconText)} aria-hidden />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return cardContent;
};

// Layout-matching skeleton
function StatCardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading stat...">
      <div className="skeleton h-3 w-20 mb-3 rounded" />
      <div className="skeleton h-8 w-28 mb-2 rounded" />
      <div className="skeleton h-3 w-16 rounded" />
    </div>
  );
}
