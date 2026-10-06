import React, { useState, useEffect, useMemo } from 'react';
import { X, FileSpreadsheet, Download, Search, RefreshCw, CheckSquare, Square } from 'lucide-react';
import { FilterChips } from '../ui/FilterChips';
import { Badge } from '../ui/Badge';
import { supabase } from '../../lib/supabase';
import { notify } from '../../lib/toast';
import { clsx } from 'clsx';

export interface ExportMemberRow {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  gender: string;
  status: string;
  joinDate: string;
  planName: string;
  startDate: string;
  endDate: string;
  remainingDays: number | null;
}

interface ExportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportMembersModal: React.FC<ExportMembersModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<ExportMemberRow[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Escape key listener & body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Load member records once on open
  useEffect(() => {
    if (!isOpen || hasLoaded) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('members')
          .select(`
            id,
            full_name,
            phone,
            email,
            gender,
            status,
            join_date,
            subscriptions (
              id,
              plan_name,
              start_date,
              end_date,
              is_active
            )
          `)
          .is('deleted_at', null)
          .order('full_name');

        if (error) throw error;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const rows: ExportMemberRow[] = (data || []).map((m: any) => {
          const subs = m.subscriptions || [];
          const activeSub = subs.find((s: any) => s.is_active) || subs[0] || null;

          let remainingDays: number | null = null;
          if (activeSub?.end_date) {
            const end = new Date(activeSub.end_date);
            end.setHours(0, 0, 0, 0);
            remainingDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          }

          return {
            id: m.id,
            fullName: m.full_name || 'Unnamed',
            phone: m.phone || 'N/A',
            email: m.email || 'N/A',
            gender: m.gender || 'N/A',
            status: m.status || 'unknown',
            joinDate: m.join_date ? new Date(m.join_date).toLocaleDateString('en-IN') : 'N/A',
            planName: activeSub?.plan_name || 'No Plan',
            startDate: activeSub?.start_date ? new Date(activeSub.start_date).toLocaleDateString('en-IN') : 'N/A',
            endDate: activeSub?.end_date ? new Date(activeSub.end_date).toLocaleDateString('en-IN') : 'N/A',
            remainingDays,
          };
        });

        setMembers(rows);
        setSelectedIds(new Set(rows.map((r) => r.id)));
        setHasLoaded(true);
      } catch (err: any) {
        console.error('Failed to load members for export:', err);
        notify.error(err.message || 'Failed to load member records');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, hasLoaded]);

  // In-memory filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // 1. Status Filter
      if (statusFilter === 'active' && m.status !== 'active') return false;
      if (statusFilter === 'expired' && m.status !== 'expired') return false;
      if (statusFilter === 'inactive' && m.status !== 'inactive') return false;
      if (statusFilter === 'expiring') {
        if (m.remainingDays === null || m.remainingDays < 0 || m.remainingDays > 7) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = m.fullName.toLowerCase().includes(query);
        const matchesPhone = m.phone.toLowerCase().includes(query);
        const matchesEmail = m.email.toLowerCase().includes(query);
        const matchesPlan = m.planName.toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesPlan) return false;
      }

      return true;
    });
  }, [members, statusFilter, searchQuery]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredMembers.forEach((m) => next.add(m.id));
      return next;
    });
  };

  const handleDeselectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredMembers.forEach((m) => next.delete(m.id));
      return next;
    });
  };

  // Pure Client-Side Excel Export (UTF-8 CSV with Excel Byte-Order Mark)
  const handleDownloadExcel = () => {
    const selectedMembers = members.filter((m) => selectedIds.has(m.id));

    if (selectedMembers.length === 0) {
      notify.error('No members selected for download');
      return;
    }

    const headers = [
      'Full Name',
      'Phone Number',
      'Email Address',
      'Gender',
      'Membership Status',
      'Current Plan',
      'Plan Start Date',
      'Plan End Date',
      'Days Remaining',
      'Join Date',
    ];

    const escapeCsv = (val: string | number | null | undefined) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = selectedMembers.map((m) => [
      escapeCsv(m.fullName),
      escapeCsv(m.phone),
      escapeCsv(m.email),
      escapeCsv(m.gender),
      escapeCsv(m.status.toUpperCase()),
      escapeCsv(m.planName),
      escapeCsv(m.startDate),
      escapeCsv(m.endDate),
      escapeCsv(m.remainingDays !== null ? m.remainingDays : 'N/A'),
      escapeCsv(m.joinDate),
    ]);

    // Prepend UTF-8 BOM (\uFEFF) so Microsoft Excel natively opens special characters without garbling
    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `IronGym_Members_Export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notify.success(`Exported ${selectedMembers.length} member records to Excel.`);
  };

  if (!isOpen) return null;

  const isAllFilteredSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((m) => selectedIds.has(m.id));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-sm animate-[fade-in_150ms_ease-out]"
    >
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-[scale-in_150ms_cubic-bezier(0.23,1,0.32,1)_both]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 id="export-modal-title" className="text-base font-bold text-slate-900 leading-tight">
                Export Members to Excel
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Filter and select members to download as a clean Microsoft Excel (.csv) workbook.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Status Chips */}
            <div className="overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
              <FilterChips
                size="sm"
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as any)}
                options={[
                  { value: 'all', label: 'All Members', count: members.length },
                  {
                    value: 'active',
                    label: 'Active',
                    count: members.filter((m) => m.status === 'active').length,
                  },
                  {
                    value: 'expiring',
                    label: 'Expiring Soon',
                    count: members.filter(
                      (m) => m.remainingDays !== null && m.remainingDays >= 0 && m.remainingDays <= 7
                    ).length,
                  },
                  {
                    value: 'expired',
                    label: 'Expired',
                    count: members.filter((m) => m.status === 'expired').length,
                  },
                  {
                    value: 'inactive',
                    label: 'Inactive',
                    count: members.filter((m) => m.status === 'inactive').length,
                  },
                ]}
              />
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name, phone, plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Selection Status & Batch Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500">
            <span className="font-medium">
              Showing <strong className="text-slate-800">{filteredMembers.length}</strong> matching members
              {' '}(<strong className="text-emerald-700">{selectedIds.size}</strong> selected for export)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
              >
                Select All Filtered
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleDeselectAllFiltered}
                className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="flex-1 overflow-y-auto min-h-[240px]">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs">Loading member database records...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-600">No matching members found</p>
              <p className="text-xs mt-1">Try clearing your search query or switching filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider backdrop-blur-sm">
                  <tr>
                    <th className="py-2.5 px-4 w-10 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (isAllFilteredSelected) handleDeselectAllFiltered();
                          else handleSelectAllFiltered();
                        }}
                        className="text-slate-600 hover:text-emerald-600 flex items-center justify-center mx-auto"
                        title={isAllFilteredSelected ? 'Deselect all' : 'Select all'}
                      >
                        {isAllFilteredSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </th>
                    <th className="py-2.5 px-4">Member</th>
                    <th className="py-2.5 px-4">Phone</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Active Plan</th>
                    <th className="py-2.5 px-4">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((m) => {
                    const isSelected = selectedIds.has(m.id);
                    return (
                      <tr
                        key={m.id}
                        onClick={() => handleToggleSelect(m.id)}
                        className={clsx(
                          'cursor-pointer transition-colors',
                          isSelected ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50/80'
                        )}
                      >
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(m.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                          />
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {m.fullName}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">
                          {m.phone}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant={m.status as any} />
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {m.planName}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">
                          {m.endDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500">
            Selected: <strong className="text-slate-800">{selectedIds.size}</strong> records ready to export
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={loading || selectedIds.size === 0}
              className={clsx(
                'flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm min-h-[38px]',
                selectedIds.size > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              )}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel ({selectedIds.size})</span>
              <Download className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
