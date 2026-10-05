import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

// ── NOTIF BELL — extracted from TopBar.tsx ───────────────────
// Master plan §2.1: extracted from 22KB TopBar monolith

interface NotificationItem {
  id: string;
  text: string;
  time: string;
  read: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', text: 'New biometric enrollment pending for Device ID 105', time: '5m ago', read: false },
  { id: '2', text: 'Monthly revenue target achieved!', time: '1h ago', read: false },
  { id: '3', text: 'System backup completed successfully', time: '2h ago', read: true },
];

export const NotifBell: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('gym_notifications');
      return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('gym_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDropdown(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const clearAll = () => setNotifications([]);
  const markRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="relative" ref={ref}>
      <button
        className={clsx(
          'relative w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center',
          'text-[var(--text-secondary)] transition-colors duration-100',
          'hover:bg-[var(--surface-ground)] hover:text-[var(--text-primary)]',
          'focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
        )}
        onClick={() => setShowDropdown(v => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={showDropdown}
        aria-haspopup="true"
      >
        <Bell className="w-[18px] h-[18px]" aria-hidden />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white text-[9px] font-bold text-white flex items-center justify-center"
            style={{ background: 'var(--danger)' }}
            aria-hidden
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className={clsx(
            'absolute right-0 top-full mt-2 w-80 z-50',
            'bg-white rounded-[var(--radius-lg)] overflow-hidden',
            'border border-[var(--border-subtle)]',
            'animate-slide-up',
          )}
          style={{ boxShadow: 'var(--shadow-float)' }}
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-dim)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[11px] font-semibold text-[var(--danger)] hover:opacity-80 transition-opacity"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-ground)] transition-colors"
                aria-label="Close notifications"
              >
                <X className="w-3.5 h-3.5" aria-hidden />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto scroll-content">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10 px-4 text-center">
                <CheckCircle className="w-9 h-9 text-[var(--status-active)] mb-2" aria-hidden />
                <p className="text-sm text-[var(--text-secondary)]">All caught up!</p>
              </div>
            ) : (
              <div>
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={clsx(
                      'w-full text-left px-4 py-3 transition-colors duration-100',
                      'border-b border-[var(--border-dim)] last:border-b-0',
                      'hover:bg-[var(--surface-ground)]',
                      !n.read && 'bg-[var(--accent-light)]/40',
                    )}
                  >
                    <p className={clsx(
                      'text-sm text-[var(--text-primary)] leading-snug',
                      !n.read && 'font-medium',
                    )}>
                      {n.text}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-[var(--text-muted)]">{n.time}</span>
                      {!n.read && (
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: 'var(--accent)' }}
                          aria-label="Unread"
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
