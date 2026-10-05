import React from 'react';
import { clsx } from 'clsx';
import {
  Users,
  Search,
  CalendarX,
  Inbox,
  WifiOff,
  AlertCircle,
  FileText,
  Fingerprint,
} from 'lucide-react';

// ── EMPTY STATE — contextual messages per section ─────────────
// Provides context-aware empty states instead of blank tables

export type EmptyStateVariant =
  | 'no-members'
  | 'members'
  | 'no-results'
  | 'no-attendance'
  | 'attendance'
  | 'no-subscriptions'
  | 'subscriptions'
  | 'no-payments'
  | 'payments'
  | 'no-devices'
  | 'devices'
  | 'expiring'
  | 'offline'
  | 'error'
  | 'generic';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const baseVariantConfig: Record<string, {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  iconColor: string;
  iconBg: string;
}> = {
  'no-members': {
    icon: Users,
    title: 'No members yet',
    description: 'Add your first member to get started.',
    iconColor: 'text-[var(--accent)]',
    iconBg: 'bg-[var(--accent-light)]',
  },
  'members': {
    icon: Users,
    title: 'No members found',
    description: 'Try adjusting your search query or filters.',
    iconColor: 'text-[var(--accent)]',
    iconBg: 'bg-[var(--accent-light)]',
  },
  'expiring': {
    icon: AlertCircle,
    title: 'No memberships expiring soon',
    description: 'All members currently have healthy active plans.',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
  },
  'no-results': {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filter to find what you\'re looking for.',
    iconColor: 'text-[var(--text-muted)]',
    iconBg: 'bg-[var(--status-inactive-bg)]',
  },
  'no-attendance': {
    icon: CalendarX,
    title: 'No attendance records',
    description: 'No check-ins have been recorded yet today.',
    iconColor: 'text-[var(--text-muted)]',
    iconBg: 'bg-[var(--status-inactive-bg)]',
  },
  'attendance': {
    icon: CalendarX,
    title: 'No attendance records',
    description: 'No check-ins have been recorded yet today.',
    iconColor: 'text-[var(--text-muted)]',
    iconBg: 'bg-[var(--status-inactive-bg)]',
  },
  'no-subscriptions': {
    icon: FileText,
    title: 'No subscriptions',
    description: 'No active subscription plans found.',
    iconColor: 'text-[var(--accent)]',
    iconBg: 'bg-[var(--accent-light)]',
  },
  'subscriptions': {
    icon: FileText,
    title: 'No subscriptions',
    description: 'No active subscription plans found.',
    iconColor: 'text-[var(--accent)]',
    iconBg: 'bg-[var(--accent-light)]',
  },
  'no-payments': {
    icon: Inbox,
    title: 'No payment records',
    description: 'Payment history will appear here once transactions are recorded.',
    iconColor: 'text-[var(--status-active)]',
    iconBg: 'bg-[var(--status-active-bg)]',
  },
  'payments': {
    icon: Inbox,
    title: 'No payment records',
    description: 'Payment history will appear here once transactions are recorded.',
    iconColor: 'text-[var(--status-active)]',
    iconBg: 'bg-[var(--status-active-bg)]',
  },
  'no-devices': {
    icon: Fingerprint,
    title: 'No devices registered',
    description: 'Connect a biometric device to enable fingerprint check-ins.',
    iconColor: 'text-[var(--accent)]',
    iconBg: 'bg-[var(--accent-light)]',
  },
  'devices': {
    icon: Fingerprint,
    title: 'No devices registered',
    description: 'Connect a biometric device to enable fingerprint check-ins.',
    iconColor: 'text-[var(--accent)]',
    iconBg: 'bg-[var(--accent-light)]',
  },
  'offline': {
    icon: WifiOff,
    title: 'You\'re offline',
    description: 'Check your internet connection. Showing last available data.',
    iconColor: 'text-[var(--status-expiring)]',
    iconBg: 'bg-[var(--status-expiring-bg)]',
  },
  'error': {
    icon: AlertCircle,
    title: 'Something went wrong',
    description: 'Failed to load data. Please refresh or try again.',
    iconColor: 'text-[var(--danger)]',
    iconBg: 'bg-[var(--danger-light)]',
  },
  'generic': {
    icon: Inbox,
    title: 'Nothing here yet',
    description: 'Content will appear here once available.',
    iconColor: 'text-[var(--text-muted)]',
    iconBg: 'bg-[var(--status-inactive-bg)]',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'generic',
  title,
  description,
  action,
  className,
}) => {
  const config = baseVariantConfig[variant] || baseVariantConfig['generic'];
  const Icon = config.icon;

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto',
        className,
      )}
      role="status"
    >
      <div
        className={clsx(
          'w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center mb-4',
          config.iconBg,
        )}
      >
        <Icon className={clsx('w-6 h-6', config.iconColor)} />
      </div>

      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
        {title ?? config.title}
      </h3>

      <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-xs leading-relaxed">
        {description ?? config.description}
      </p>

      {action && (
        <div className="flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
};
