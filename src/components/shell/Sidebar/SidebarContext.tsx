import React, { createContext, useContext, useState, useCallback } from 'react';

// ── SIDEBAR CONTEXT — CSS variable–driven collapse ──────────
// Master plan §2.1: collapse state via Context, drives --sidebar-width CSS var
// CSS grid transitions the column, no JS layout re-trigger

interface SidebarContextValue {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggle: () => void;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isCollapsed: false,
  isMobileOpen: false,
  toggle: () => {},
  setMobileOpen: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setMobileOpen] = useState(false);

  const toggle = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, isMobileOpen, toggle, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
