import React, { useMemo, useState } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DataTable, type ColumnDef } from '../ui/DataTable';
import { EmptyState } from '../ui/EmptyState';

export interface AttendanceRecordItem {
  id: string;
  memberId: string;
  memberName: string;
  memberImage?: string;
  date: string;
  checkInTime: string;
  method: 'manual' | 'qr' | 'fingerprint';
}

interface AttendanceLogProps {
  logs: AttendanceRecordItem[];
  loading?: boolean;
  onSelectMember?: (memberId: string) => void;
}

export const AttendanceLog: React.FC<AttendanceLogProps> = ({
  logs,
  loading = false,
  onSelectMember,
}) => {
  const [search, setSearch] = useState('');

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    return logs.filter((log) =>
      log.memberName.toLowerCase().includes(search.toLowerCase())
    );
  }, [logs, search]);

  const columns: ColumnDef<AttendanceRecordItem>[] = useMemo(
    () => [
      {
        key: 'memberName',
        header: 'Member',
        sortable: true,
        accessor: (row) => row.memberName,
        render: (row) => (
          <Link
            to={`/members/${row.memberId}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-3 min-w-0 group"
            title="View member profile"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-xs overflow-hidden border border-blue-200">
              {row.memberImage ? (
                <img
                  src={row.memberImage}
                  alt={row.memberName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                row.memberName.charAt(0).toUpperCase()
              )}
            </div>
            <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
              {row.memberName}
            </span>
          </Link>
        ),
      },
      {
        key: 'date',
        header: 'Date',
        sortable: true,
        align: 'center',
        width: '150px',
        accessor: (row) => row.date,
        render: (row) => (
          <span className="font-mono text-xs text-slate-600 font-medium">
            {row.date}
          </span>
        ),
      },
      {
        key: 'checkInTime',
        header: 'Time In',
        sortable: true,
        align: 'center',
        width: '130px',
        accessor: (row) => row.checkInTime,
        render: (row) => (
          <span className="font-mono text-xs text-slate-800 font-bold tabular-nums">
            {row.checkInTime}
          </span>
        ),
      },
      {
        key: 'method',
        header: 'Method',
        align: 'center',
        width: '150px',
        render: (row) => {
          const config = {
            fingerprint: { label: 'Fingerprint', color: 'bg-blue-50 text-blue-700 border-blue-200' },
            qr: { label: 'QR Scan', color: 'bg-purple-50 text-purple-700 border-purple-200' },
            manual: { label: 'Manual Entry', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          }[row.method] || { label: row.method, color: 'bg-slate-50 text-slate-700 border-slate-200' };

          return (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border shadow-2xs ${config.color}`}
            >
              {config.label}
            </span>
          );
        },
      },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        width: '80px',
        render: (row) => (
          <Link
            to={`/members/${row.memberId}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors inline-flex items-center"
            title="View member profile"
            aria-label={`View member profile for ${row.memberName}`}
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        ),
      },
    ],
    []
  );

  const renderAttendanceMobileCard = (log: AttendanceRecordItem) => {
    const methodConfig = {
      fingerprint: { label: 'Fingerprint', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      qr: { label: 'QR Scan', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      manual: { label: 'Manual Entry', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    }[log.method] || { label: log.method, color: 'bg-slate-50 text-slate-700 border-slate-200' };

    return (
      <div
        className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col gap-3"
      >
        {/* Top: Avatar + Member Name + Time In */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs overflow-hidden border border-blue-200 shadow-2xs">
              {log.memberImage ? (
                <img
                  src={log.memberImage}
                  alt={log.memberName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                log.memberName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-900 text-sm leading-snug break-words">
                {log.memberName}
              </h4>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                {log.date}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/80 tabular-nums inline-block">
              {log.checkInTime}
            </span>
          </div>
        </div>

        {/* Bottom: Method Badge + Profile Action */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border shadow-2xs ${methodConfig.color}`}>
            {methodConfig.label}
          </span>

          <Link
            to={`/members/${log.memberId}`}
            onClick={(e) => e.stopPropagation()}
            className="h-9 px-3 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200/80 hover:border-blue-200 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-colors active:scale-[0.98]"
          >
            <span>Profile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="p-px rounded-2xl bg-slate-200/80 shadow-xs">
        <div className="bg-white rounded-[15px] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search attendance by member name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-xs font-mono text-slate-400 whitespace-nowrap text-right sm:text-left">
            {filteredLogs.length} records
          </span>
        </div>
      </div>

      {/* Virtualized Table */}
      <DataTable
        data={filteredLogs}
        columns={columns}
        rowKey={(row) => row.id}
        isLoading={loading}
        onRowClick={(row) => onSelectMember?.(row.memberId)}
        renderMobileCard={renderAttendanceMobileCard}
        emptyState={
          <EmptyState
            variant="attendance"
            title={search ? `No records matching "${search}"` : 'No attendance records'}
            description="Attendance entries will appear here as members check in."
          />
        }
      />
    </div>
  );
};
