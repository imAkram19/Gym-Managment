import React from 'react';
import { Fingerprint, UserCheck, QrCode, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../ui/EmptyState';
import { formatTime12h } from '../../lib/formatters';
import type { LiveCheckInItem } from '../../hooks/useLiveCheckIns';

interface LiveCheckInFeedProps {
  checkIns: LiveCheckInItem[];
  isLoading?: boolean;
  onMemberClick?: (memberId: string) => void;
}

export const LiveCheckInFeed: React.FC<LiveCheckInFeedProps> = ({
  checkIns,
  isLoading = false,
  onMemberClick,
}) => {
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'fingerprint':
        return <Fingerprint className="w-3.5 h-3.5 text-blue-600" />;
      case 'qr':
        return <QrCode className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <UserCheck className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  return (
    <div className="p-px rounded-2xl bg-slate-200/80 shadow-xs overflow-hidden">
      <div className="bg-white rounded-[15px] p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Live Check-In Feed
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {checkIns.length} today
          </span>
        </div>

        {/* Live List */}
        <div
          role="log"
          aria-live="polite"
          aria-label="Recent check-in feed"
          className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto overscroll-contain"
        >
          {isLoading && checkIns.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Loading today's live feed...
            </div>
          ) : checkIns.length === 0 ? (
            <EmptyState
              variant="attendance"
              title="No check-ins yet today"
              description="Members checking in via K40 fingerprint or manual entry will appear here instantly."
            />
          ) : (
            checkIns.map((item, idx) => (
              <div
                key={item.id}
                style={
                  {
                    '--row-index': Math.min(idx, 12),
                    animationDelay: `${Math.min(idx, 12) * 40}ms`,
                  } as React.CSSProperties
                }
                className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors animate-[fade-in-up_280ms_cubic-bezier(0.23,1,0.32,1)_both]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    {item.memberImage ? (
                      <img
                        src={item.memberImage}
                        alt={item.memberName}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      item.memberName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onMemberClick?.(item.memberId)}
                      className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors text-left truncate block cursor-pointer"
                    >
                      {item.memberName}
                    </button>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatTime12h(item.checkInTime)}
                      </span>
                      <span>·</span>
                      <span className="capitalize">{item.method}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className="p-1.5 rounded-lg bg-slate-100 border border-slate-200"
                    title={`Verified via ${item.method}`}
                  >
                    {getMethodIcon(item.method)}
                  </div>
                  <Link
                    to={`/members/${item.memberId}`}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                    title="View member profile"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
