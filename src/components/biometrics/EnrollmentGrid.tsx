import React, { useState, useMemo } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FilterChips } from '../ui/FilterChips';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { BiometricEnrollmentWithMember } from '../../lib/api/biometrics';
import { clsx } from 'clsx';

interface EnrollmentGridProps {
  enrollments: BiometricEnrollmentWithMember[];
  onDeleteEnrollment: (enrollmentId: string, memberName: string) => Promise<void>;
  loading?: boolean;
}

export const EnrollmentGrid: React.FC<EnrollmentGridProps> = ({
  enrollments,
  onDeleteEnrollment,
  loading = false,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [deleteTarget, setDeleteTarget] = useState<BiometricEnrollmentWithMember | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = useMemo(() => {
    return enrollments.filter((e) => {
      const matchesSearch =
        e.memberName.toLowerCase().includes(search.toLowerCase()) ||
        String(e.deviceUserId).includes(search);
      
      let matchesFilter = true;
      if (filter === 'active') {
        matchesFilter = e.memberStatus === 'active';
      } else if (filter === 'expired') {
        matchesFilter = e.memberStatus !== 'active';
      }
      return matchesSearch && matchesFilter;
    });
  }, [enrollments, search, filter]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await onDeleteEnrollment(deleteTarget.id, deleteTarget.memberName);
      setDeleteTarget(null);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="p-px rounded-2xl bg-slate-200/80 shadow-xs">
        <div className="bg-white rounded-[15px] p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search member or device user ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <FilterChips
            size="sm"
            value={filter}
            onChange={(val) => setFilter(val as any)}
            options={[
              { value: 'all', label: 'All Enrolled', count: enrollments.length },
              {
                value: 'active',
                label: 'Active Access',
                count: enrollments.filter((e) => e.memberStatus === 'active').length,
              },
              {
                value: 'expired',
                label: 'Expired Plans',
                count: enrollments.filter((e) => e.memberStatus !== 'active').length,
              },
            ]}
          />
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 h-28" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center">
          <EmptyState
            variant="devices"
            title="No enrollments found"
            description="No biometric users match your search and filter criteria."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((e) => (
            <div
              key={e.id}
              className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition-all flex items-start justify-between gap-3"
            >
              <div className="min-w-0 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                  {e.memberImage ? (
                    <img
                      src={e.memberImage}
                      alt={e.memberName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    e.memberName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <Link
                    to={`/members/${e.memberId}`}
                    className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors truncate block"
                  >
                    {e.memberName}
                  </Link>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">
                    Keypad ID: <span className="font-bold text-slate-800">#{e.deviceUserId}</span>
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
                        e.memberStatus === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      )}
                    >
                      {e.memberStatus === 'active' ? 'Active' : 'Expired'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      • {e.syncStatus || 'synced'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDeleteTarget(e)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                title="Remove biometric link"
                aria-label={`Remove biometric link for ${e.memberName}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        variant="warning"
        title="Unlink Biometric Fingerprint?"
        description={
          deleteTarget
            ? `Are you sure you want to remove the fingerprint mapping for ${deleteTarget.memberName} (User ID #${deleteTarget.deviceUserId})?`
            : ''
        }
        confirmLabel="Unlink User"
        isLoading={actionLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
