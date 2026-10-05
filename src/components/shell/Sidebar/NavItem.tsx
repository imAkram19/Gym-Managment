import React from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

// ── NAV ITEM — pure stateless component (master plan §2.1) ───
// No data fetching. Receives isCollapsed, renders icon rail or full label.

interface NavItemProps {
  label: string;
  path: string;
  icon: LucideIcon;
  isCollapsed: boolean;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({
  label,
  path,
  icon: Icon,
  isCollapsed,
  onClick,
}) => {
  return (
    <NavLink
      to={path}
      end={path === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'relative flex items-center rounded-[var(--radius-md)]',
          'transition-colors duration-150 select-none',
          'focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none',
          isCollapsed
            ? 'justify-center w-10 h-10 mx-auto px-0'
            : 'w-full justify-start text-left px-3 py-2.5 gap-3',
          isActive
            ? 'bg-[var(--accent-light)] text-[var(--accent)] font-semibold shadow-sm'
            : [
                'text-[var(--text-on-sidebar)] opacity-80 font-medium',
                // hover only for pointer devices — animate skill hover gate
                'hover:bg-white/10 hover:opacity-100 hover:text-white',
              ],
        )
      }
      aria-label={isCollapsed ? label : undefined}
      title={isCollapsed ? label : undefined}
    >
      {({ isActive }) => (
        <>
          <Icon
            className={clsx(
              'w-5 h-5 flex-shrink-0 transition-colors duration-150',
              isActive ? 'text-[var(--accent)]' : 'text-current',
            )}
            aria-hidden="true"
          />

          {!isCollapsed && (
            <span className="text-sm tracking-tight truncate">
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};
