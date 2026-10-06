import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar/Sidebar';
import { TopBar } from './TopBar/TopBar';
import { SidebarProvider } from './Sidebar/SidebarContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

// ── APP SHELL — CSS Grid layout ───────────────────────────────
// master plan §2.1: CSS Grid (not flex tricks) for proper layout
// --sidebar-width CSS variable drives column, animated by sidebar-transition class
// 100dvh — never 100vh (iOS URL bar overflow bug)
// Mobile: sidebar hidden, bottom nav shown

export const AppShell: React.FC = () => {
  return (
    <SidebarProvider>
      <AppShellInner />
    </SidebarProvider>
  );
};

function AppShellInner() {
  const isOnline = useNetworkStatus();

  return (
    <div className="app-shell flex" style={{ height: '100dvh', overflow: 'hidden' }}>
      {/* Sidebar — flex-shrink-0, width controlled by CSS var */}
      <Sidebar />

      {/* Main area: topbar + scrollable content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Offline Banner when network disconnected */}
        {!isOnline && (
          <div
            role="status"
            aria-live="assertive"
            className="bg-red-600 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2 flex-shrink-0 z-30"
          >
            <WifiOff className="w-3.5 h-3.5 animate-pulse" />
            <span>Offline Mode: Network disconnected. Reconnecting to Supabase...</span>
          </div>
        )}

        {/* TopBar: sticky, glass-fixed backdrop-blur */}
        <TopBar />

        {/* Page content — scrollable, overscroll contained */}
        <main
          className="flex-1 overflow-y-auto overscroll-contain scroll-content"
          id="main-content"
          tabIndex={-1}
        >
          {/* Skip-to-content anchor target */}
          <div className="p-4 pb-24 lg:p-6 lg:pb-8 xl:p-8 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav — shown only on small screens */}
      <MobileBottomNav />
    </div>
  );
}

// ── Mobile Bottom Nav ─────────────────────────────────────────
// master plan §4.3: 5-icon bottom nav for tablets/phones
// Matches the 5 core sections of the desktop sidebar identically

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Trophy, CalendarCheck, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

const MOBILE_NAV_ITEMS = [
  { label: 'Dashboard',     path: '/',             icon: LayoutDashboard },
  { label: 'Members',       path: '/members',      icon: Users },
  { label: 'Leaderboard',   path: '/leaderboard',  icon: Trophy },
  { label: 'Attendance',    path: '/attendance',   icon: CalendarCheck },
  { label: 'Owner Vault',   path: '/vault',        icon: ShieldCheck },
] as const;

function MobileBottomNav() {
  return (
    <nav
      className="mobile-nav lg:hidden z-30"
      aria-label="Mobile navigation"
      role="navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {MOBILE_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-[var(--radius-md)]',
                'touch-target transition-colors duration-100',
                isActive
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              )
            }
            aria-label={item.label}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={clsx('w-5 h-5', isActive && 'text-[var(--accent)]')}
                  aria-hidden
                />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
