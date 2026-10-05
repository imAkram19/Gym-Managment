import React from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { BiometricDevice } from '../../types';
import { clsx } from 'clsx';

interface DeviceStatusPanelProps {
  device: BiometricDevice;
  enrolledCount: number;
  todayScansCount: number;
  onRefresh?: () => void;
  onDelete?: () => void;
  isRefreshing?: boolean;
}

export const DeviceStatusPanel: React.FC<DeviceStatusPanelProps> = ({
  device,
  enrolledCount,
  todayScansCount,
  onRefresh,
  onDelete,
  isRefreshing = false,
}) => {
  const isOnline = device.status === 'online';

  const formatLastPing = (iso?: string) => {
    if (!iso) return 'Never';
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <div className="p-px rounded-2xl bg-slate-200/80 shadow-sm overflow-hidden">
      <div className="bg-white rounded-[15px] overflow-hidden flex flex-col justify-between">
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Status Orb with pulse ring */}
            <div className="relative flex items-center justify-center flex-shrink-0">
              <span
                className={clsx(
                  'w-3 h-3 rounded-full',
                  isOnline
                    ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse'
                    : 'bg-slate-400'
                )}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-slate-900 tracking-tight truncate">
                  {device.name}
                </h4>
                <Badge variant={isOnline ? 'online' : 'offline'} />
              </div>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                {device.ipAddress}:{device.port}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Test Ping Device"
                aria-label="Test Ping Device"
              >
                <RefreshCw className={clsx('w-4 h-4', isRefreshing && 'animate-spin text-blue-600')} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Remove Device"
                aria-label="Remove Device"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Metrics Row */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50/60 border-t border-slate-100">
          <div className="p-3.5 text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
              Last Ping
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 mt-1 block">
              {formatLastPing(device.lastPing)}
            </span>
          </div>

          <div className="p-3.5 text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
              Enrolled Users
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 mt-1 block">
              {enrolledCount}
            </span>
          </div>

          <div className="p-3.5 text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
              Today's Scans
            </span>
            <span className="text-xs font-mono font-bold text-blue-600 mt-1 block">
              {todayScansCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
