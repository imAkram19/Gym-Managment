import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UserPlus,
  Users,
  LayoutDashboard,
  Trophy,
  CalendarCheck,
  Fingerprint,
  ShieldCheck,
  ArrowRight,
  X,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Badge } from '../../ui/Badge';
import { clsx } from 'clsx';

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddMember?: () => void;
  onSelectMember?: (memberId: string) => void;
}

interface SearchResultMember {
  id: string;
  fullName: string;
  phone?: string;
  status: 'active' | 'inactive' | 'expired';
  imageUrl?: string;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  isOpen,
  onClose,
  onOpenAddMember,
  onSelectMember,
}) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [memberResults, setMemberResults] = useState<SearchResultMember[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global Ctrl+K listener
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Search members from Supabase when query changes
  useEffect(() => {
    if (!query.trim()) {
      setMemberResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('members')
          .select('id, full_name, phone, status, image_url')
          .or(`full_name.ilike.%${query.trim()}%,phone.ilike.%${query.trim()}%`)
          .limit(6);

        if (!error && data) {
          setMemberResults(
            data.map((m: any) => ({
              id: m.id,
              fullName: m.full_name,
              phone: m.phone,
              status: m.status,
              imageUrl: m.image_url,
            }))
          );
        }
      } catch (err) {
        console.error('CommandBar search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(searchTimer);
  }, [query]);

  // Static quick actions & navigation
  const staticActions = [
    {
      id: 'add-member',
      type: 'action',
      label: 'Add New Member',
      icon: UserPlus,
      category: 'Quick Actions',
      handler: () => {
        onClose();
        if (onOpenAddMember) onOpenAddMember();
        else navigate('/members?action=add');
      },
    },
    {
      id: 'nav-members',
      type: 'nav',
      label: 'Members Directory',
      icon: Users,
      category: 'Navigation',
      handler: () => {
        onClose();
        navigate('/members');
      },
    },
    {
      id: 'nav-attendance',
      type: 'nav',
      label: 'Daily Attendance & Check-In',
      icon: CalendarCheck,
      category: 'Navigation',
      handler: () => {
        onClose();
        navigate('/attendance');
      },
    },
    {
      id: 'nav-leaderboard',
      type: 'nav',
      label: 'Leaderboard & Streaks',
      icon: Trophy,
      category: 'Navigation',
      handler: () => {
        onClose();
        navigate('/leaderboard');
      },
    },
    {
      id: 'nav-vault',
      type: 'nav',
      label: 'Owner Vault (Financials & Exports)',
      icon: ShieldCheck,
      category: 'Navigation',
      handler: () => {
        onClose();
        navigate('/vault');
      },
    },
    {
      id: 'nav-biometrics',
      type: 'nav',
      label: 'Dev Tools & Hardware Terminals',
      icon: Fingerprint,
      category: 'Navigation',
      handler: () => {
        onClose();
        navigate('/vault?tab=devtools');
      },
    },
    {
      id: 'nav-dashboard',
      type: 'nav',
      label: 'Live Reception Dashboard',
      icon: LayoutDashboard,
      category: 'Navigation',
      handler: () => {
        onClose();
        navigate('/');
      },
    },
  ];

  // Filter static actions if query is typed
  const filteredActions = query.trim()
    ? staticActions.filter((a) =>
        a.label.toLowerCase().includes(query.trim().toLowerCase())
      )
    : staticActions;

  // Flatten items for keyboard navigation
  const allItems: Array<{
    type: 'member' | 'action';
    data: any;
    handler: () => void;
  }> = [
    ...memberResults.map((m) => ({
      type: 'member' as const,
      data: m,
      handler: () => {
        onClose();
        if (onSelectMember) {
          onSelectMember(m.id);
        } else {
          navigate(`/members/${m.id}`);
        }
      },
    })),
    ...filteredActions.map((a) => ({
      type: 'action' as const,
      data: a,
      handler: a.handler,
    })),
  ];

  // Handle keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(allItems.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? allItems.length - 1 : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].handler();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command search palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 pb-4"
    >
      {/* Backdrop — 150ms instant per Emil's rule */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm cursor-pointer transition-opacity duration-150"
        aria-hidden="true"
      />

      {/* Palette Card */}
      <div
        onKeyDown={handleKeyDown}
        className="relative z-10 w-full max-w-xl p-px rounded-2xl bg-slate-200/90 shadow-2xl overflow-hidden animate-[scale-in_120ms_cubic-bezier(0.23,1,0.32,1)_both]"
      >
        <div className="bg-white rounded-[15px] overflow-hidden flex flex-col max-h-[80vh]">
          {/* Search Header */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
            <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search members by name, phone or type an action..."
              className="w-full text-sm font-medium text-slate-800 placeholder-slate-400 outline-none bg-transparent"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium text-slate-400 bg-slate-100 border border-slate-200">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto overscroll-contain p-2 space-y-1">
            {/* Member Results */}
            {memberResults.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Members
                </div>
                {memberResults.map((m, idx) => {
                  const isCurrent = selectedIndex === idx;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onSelectMember) onSelectMember(m.id);
                        else navigate(`/members/${m.id}`);
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={clsx(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer',
                        isCurrent
                          ? 'bg-blue-50 text-slate-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center overflow-hidden flex-shrink-0 text-xs">
                          {m.imageUrl ? (
                            <img
                              src={m.imageUrl}
                              alt={m.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            m.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {m.fullName}
                          </p>
                          {m.phone && (
                            <p className="text-xs font-mono text-slate-500">
                              {m.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={m.status} />
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick Actions & Navigation */}
            <div>
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {query.trim() ? 'Actions & Pages' : 'Quick Actions'}
              </div>
              {filteredActions.map((action, idx) => {
                const itemIndex = memberResults.length + idx;
                const isCurrent = selectedIndex === itemIndex;
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={action.handler}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    className={clsx(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer',
                      isCurrent
                        ? 'bg-blue-50 text-slate-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          'p-2 rounded-lg',
                          isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">{action.label}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {action.category}
                    </span>
                  </button>
                );
              })}
            </div>

            {query.trim() && allItems.length === 0 && !isSearching && (
              <div className="py-8 text-center text-sm text-slate-400">
                No matching members or actions found for "{query}".
              </div>
            )}
          </div>

          {/* Footer Shortcuts hint */}
          <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] mr-1">
                  ↑
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] mr-1">
                  ↓
                </kbd>
                Navigate
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] mr-1">
                  ↵
                </kbd>
                Select
              </span>
            </div>
            <span>Iron Gym Command</span>
          </div>
        </div>
      </div>
    </div>
  );
};
