import React from 'react';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Users,
  Trophy,
  CalendarCheck,
  Fingerprint,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { NavItem } from './NavItem';
import { useSidebar } from './SidebarContext';

// ── SIDEBAR V2 — Collapsible icon rail ↔ expanded panel ──────
// master plan §2.1: CSS variable driven collapse, no JS layout recalculation
// CSS: :root { --sidebar-width: 240px } / [data-sidebar-collapsed] { --sidebar-width: 64px }

const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/',             icon: LayoutDashboard },
  { label: 'Members',      path: '/members',      icon: Users },
  { label: 'Leaderboard',  path: '/leaderboard',  icon: Trophy },
  { label: 'Attendance',   path: '/attendance',   icon: CalendarCheck },
  { label: 'Biometrics',   path: '/biometrics',   icon: Fingerprint },
] as const;

export const Sidebar: React.FC = () => {
  const { isCollapsed, isMobileOpen, toggle, setMobileOpen } = useSidebar();

  const handleMobileClose = () => setMobileOpen(false);
  const handleNavClick = () => {
    // Close mobile drawer on nav (mobile-native skill)
    if (window.innerWidth < 1024) setMobileOpen(false);
  };

  return (
    <>
      {/* ── Mobile overlay ────────────────────────────────── */}
      {/* animate skill: backdrop fades in 150ms ease-out — preventing jarring change */}
      <div
        className={clsx(
          'fixed inset-0 z-30 lg:hidden transition-opacity duration-150',
          isMobileOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        )}
        style={{ background: 'rgba(34,45,66,0.4)', backdropFilter: 'blur(2px)' }}
        onClick={handleMobileClose}
        aria-hidden="true"
      />

      {/* ── Sidebar panel ─────────────────────────────────── */}
      <aside
        className={clsx(
          // Desktop: always visible, width driven by CSS var
          'hidden lg:flex flex-col',
          'h-[100dvh] bg-[var(--surface-sidebar)]',
          // Smooth width transition — CSS variable update (GPU-safe)
          'sidebar-transition overflow-hidden flex-shrink-0',
          'sidebar-safe',
        )}
        style={{ width: isCollapsed ? 64 : 240 }}
        aria-label="Main navigation"
        role="navigation"
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          onToggle={toggle}
          onNavClick={handleNavClick}
          isMobile={false}
        />
      </aside>

      {/* ── Mobile drawer ─────────────────────────────────── */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-40 flex flex-col lg:hidden',
          'h-[100dvh] w-[240px] bg-[var(--surface-sidebar)]',
          // animate skill: translateX — spatial consistency (comes from left)
          // Tool: CSS transition (state toggle, no spring needed)
          // Duration: 250ms --ease-drawer
          'transition-transform duration-250',
          'sidebar-safe',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ transition: 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1)' }}
        aria-label="Main navigation"
        role="navigation"
        aria-hidden={!isMobileOpen}
      >
        <SidebarContent
          isCollapsed={false}
          onToggle={toggle}
          onNavClick={handleNavClick}
          isMobile={true}
          onMobileClose={handleMobileClose}
        />
      </aside>
    </>
  );
};

// ── Internal content (shared between desktop + mobile) ────────
interface SidebarContentProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onNavClick: () => void;
  isMobile: boolean;
  onMobileClose?: () => void;
}

function SidebarContent({ isCollapsed, onToggle, onNavClick, isMobile, onMobileClose }: SidebarContentProps) {
  return (
    <>
      {/* Logo cell */}
      <div
        className={clsx(
          'h-[60px] flex items-center flex-shrink-0',
          'border-b border-white/8',
          isCollapsed ? 'justify-center px-2' : 'justify-between px-5',
        )}
      >
        {/* Logo */}
        <div className={clsx(
          'flex items-center gap-2.5 font-bold text-white',
          isCollapsed && 'justify-center',
        )}>
          <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
            <Dumbbell className="w-4 h-4 text-white" aria-hidden />
          </div>
          {!isCollapsed && (
            <span className="text-sm font-bold tracking-tight text-white truncate">
              Iron Gym
            </span>
          )}
        </div>

        {/* Desktop collapse / Mobile close */}
        {isMobile ? (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-on-sidebar)] hover:bg-white/8 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        ) : !isCollapsed ? (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-on-sidebar)] hover:bg-white/8 hover:text-white transition-colors"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {/* Navigation */}
      <nav
        className={clsx(
          'flex-1 overflow-y-auto scroll-content py-3',
          isCollapsed ? 'px-2' : 'px-3',
          'space-y-1',
        )}
      >
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.path}
            label={item.label}
            path={item.path}
            icon={item.icon}
            isCollapsed={isCollapsed}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* Expand button when collapsed (desktop only) */}
      {!isMobile && isCollapsed && (
        <div className="px-2 pb-4 flex-shrink-0">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-2 rounded-[var(--radius-sm)] text-[var(--text-on-sidebar)] hover:bg-white/8 hover:text-white transition-colors"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" aria-hidden />
          </button>
        </div>
      )}

      {/* Footer: version */}
      {!isCollapsed && (
        <div className="px-5 pb-4 flex-shrink-0">
          <p className="text-[10px] text-white/25 font-mono">Iron Gym v2.0</p>
        </div>
      )}
    </>
  );
}
