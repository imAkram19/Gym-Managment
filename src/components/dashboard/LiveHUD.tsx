import React from 'react';
import { Users, UserCheck, AlertTriangle, Fingerprint } from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import type { BiometricDevice } from '../../types';
import { clsx } from 'clsx';

interface LiveHUDProps {
  checkedInTodayCount: number;
  expiringSoonCount: number;
  activeMembersCount: number;
  primaryDevice?: BiometricDevice | null;
  onExpiringClick?: () => void;
  onActiveClick?: () => void;
  onAttendanceClick?: () => void;
  onDeviceClick?: () => void;
}

export const LiveHUD: React.FC<LiveHUDProps> = ({
  checkedInTodayCount,
  expiringSoonCount,
  activeMembersCount,
  primaryDevice,
  onExpiringClick,
  onActiveClick,
  onAttendanceClick,
  onDeviceClick,
}) => {
  const isDeviceOnline = primaryDevice?.status === 'online';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Checked In Today */}
      <StatCard
        label="Checked In Today"
        value={checkedInTodayCount}
        icon={UserCheck}
        accentColor="green"
        onClick={onAttendanceClick}
      />

      {/* 2. Expiring Soon */}
      <StatCard
        label="Expiring ≤ 7 Days"
        value={expiringSoonCount}
        icon={AlertTriangle}
        accentColor="amber"
        onClick={onExpiringClick}
      />

      {/* 3. Active Members */}
      <StatCard
        label="Active Members"
        value={activeMembersCount}
        icon={Users}
        accentColor="blue"
        onClick={onActiveClick}
      />

      {/* 4. Biometric Terminal Status */}
      <div
        onClick={onDeviceClick}
        role="button"
        tabIndex={0}
        aria-label="Biometric device status"
        className="p-px rounded-2xl bg-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]"
      >
        <div className="bg-white rounded-[15px] p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
              K40 Biometrics
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={clsx(
                  'w-2.5 h-2.5 rounded-full',
                  isDeviceOnline
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
                    : 'bg-slate-400'
                )}
              />
              <span
                className={clsx(
                  'text-xs font-bold uppercase',
                  isDeviceOnline ? 'text-emerald-700' : 'text-slate-500'
                )}
              >
                {isDeviceOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-slate-900 truncate">
                {primaryDevice?.name || 'ZKTeco K40'}
              </span>
              <Fingerprint className="w-5 h-5 text-blue-600 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">
              {primaryDevice?.ipAddress ? `${primaryDevice.ipAddress}:${primaryDevice.port}` : '192.168.1.201:4370'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
