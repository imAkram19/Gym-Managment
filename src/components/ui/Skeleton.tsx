import React from 'react';
import { clsx } from 'clsx';

// ── SKELETON — layout-matching pulse skeletons ───────────────
// animate skill: CSS animation (runs off main thread, stays smooth under load)
// Purpose: state indication (loading state legible)
// Frequency: occasional (page loads) ✓

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

// Primitive skeleton shape
export const Skeleton: React.FC<SkeletonProps> = ({ className, style }) => (
  <div
    className={clsx('skeleton rounded', className)}
    style={style}
    aria-hidden="true"
  />
);

// ── PAGE-SPECIFIC SKELETON LAYOUTS ───────────────────────────

// Dashboard stats row skeleton
export const DashboardStatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-busy="true" aria-label="Loading dashboard stats...">
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className="p-px rounded-[var(--radius-xl)]"
        style={{ background: 'var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="rounded-[calc(var(--radius-xl)-1px)] bg-white p-5">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ))}
  </div>
);

// Members list table skeleton
export const MembersListSkeleton: React.FC<{ rows?: number; count?: number }> = ({ rows = 8, count }) => {
  const rowCount = count ?? rows;
  return (
    <div aria-busy="true" aria-label="Loading members...">
      {[...Array(rowCount)].map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border-dim)]"
        style={{ animationDelay: `${i * 40}ms` }}
      >
        {/* Avatar */}
        <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
        {/* Name + phone */}
        <div className="flex-1 min-w-0">
          <Skeleton className="h-3.5 w-32 mb-1.5" />
          <Skeleton className="h-3 w-24" />
        </div>
        {/* Badge */}
        <Skeleton className="h-5 w-16 rounded-full" />
        {/* Days left */}
        <Skeleton className="h-3.5 w-12" />
        {/* Action */}
        <Skeleton className="h-7 w-7 rounded-md" />
      </div>
    ))}
  </div>
  );
};

// Alias for generic table/member loading
export const MembersSkeleton = MembersListSkeleton;

// Precise Mobile Card Skeleton
export const MobileCardSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading cards...">
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3"
      >
        {/* Top Header: Avatar + Name/Phone + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full shrink-0" />
        </div>

        {/* 2 Meta Tiles */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-xl p-2.5 space-y-1">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <div className="bg-slate-50/80 rounded-xl p-2.5 space-y-1">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        </div>

        {/* 3 Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-11 rounded-xl shrink-0" />
        </div>
      </div>
    ))}
  </div>
);


// Attendance log skeleton
export const AttendanceSkeleton: React.FC<{ rows?: number }> = ({ rows = 10 }) => (
  <div aria-busy="true" aria-label="Loading attendance...">
    {[...Array(rows)].map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border-dim)]"
      >
        <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Skeleton className="h-3.5 w-28 mb-1.5" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-3.5 w-16 font-mono" />
      </div>
    ))}
  </div>
);

// Member detail skeleton
export const MemberDetailSkeleton: React.FC = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading member details...">
    {/* Header */}
    <div className="flex items-center gap-4">
      <Skeleton className="w-16 h-16 rounded-full" />
      <div>
        <Skeleton className="h-5 w-36 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    {/* Info grid */}
    <div className="grid grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <Skeleton className="h-3 w-16 mb-1.5" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
    {/* Subscription card */}
    <div
      className="p-px rounded-[var(--radius-xl)]"
      style={{ background: 'var(--border-subtle)' }}
    >
      <div className="rounded-[calc(var(--radius-xl)-1px)] bg-white p-5 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  </div>
);

// Card skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={clsx(
      'p-px rounded-[var(--radius-xl)]',
      className,
    )}
    style={{ background: 'var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}
    aria-busy="true"
  >
    <div className="rounded-[calc(var(--radius-xl)-1px)] bg-white p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  </div>
);
