import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Banknote,
  Coins,
  TrendingUp,
  QrCode,
} from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import { ActivityChart } from './ActivityChart';
import { HourlyTrafficChart } from './HourlyTrafficChart';
import { notify } from '../../lib/toast';
import { clsx } from 'clsx';

interface OwnerFinancialPanelProps {
  stats: {
    monthlyRevenue: number;
    totalCollections: number;
    cashPayments: number;
    upiPayments: number;
    otherPayments: number;
    revenueTrend: number;
    avgPaymentAmount: number;
    totalTransactions: number;
  };
  recentPayments: any[];
  revenueData: any[];
  hourlyTraffic: any[];
  loading?: boolean;
}

export const OwnerFinancialPanel: React.FC<OwnerFinancialPanelProps> = ({
  stats,
  recentPayments,
  revenueData,
  hourlyTraffic,
  loading = false,
}) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = import.meta.env.VITE_OWNER_PASSWORD || 'iron';
    if (password === expected) {
      setIsUnlocked(true);
      setError('');
      localStorage.removeItem('irongym_owner_access');
      notify.update('owner-auth', 'success', 'Owner dashboard unlocked.');
    } else {
      setError('Incorrect password.');
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setPassword('');
    localStorage.removeItem('irongym_owner_access');
    notify.update('owner-auth', 'success', 'Financial dashboard locked.');
  };

  if (!isUnlocked) {
    return (
      <div className="p-px rounded-2xl bg-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-white rounded-[15px] p-6 sm:p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto my-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Owner Financial Security
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Revenue figures, cash collections, and financial reports require owner authorization.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="w-full space-y-3">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter owner password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className={clsx(
                  'w-full px-4 py-2.5 text-sm rounded-lg border outline-none pr-10',
                  error
                    ? 'border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-400'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-red-600 font-medium text-left">{error}</p>}
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm shadow-blue-500/20"
            >
              Unlock Financial Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Financial Overview & Analytics</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase font-bold">
              Owner Mode
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time monthly revenue, collections split, and traffic volume
          </p>
        </div>
        <button
          type="button"
          onClick={handleLock}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Lock Panel</span>
        </button>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="This Month Revenue"
          value={stats.monthlyRevenue}
          isMonetary
          delta={{ value: stats.revenueTrend || 12, label: 'vs last mo' }}
          icon={TrendingUp}
          accentColor="blue"
          isLoading={loading}
        />

        <StatCard
          label="UPI Collections"
          value={stats.upiPayments}
          isMonetary
          icon={QrCode}
          accentColor="green"
          isLoading={loading}
        />

        <StatCard
          label="Cash Collections"
          value={stats.cashPayments}
          isMonetary
          icon={Banknote}
          accentColor="amber"
        />

        <StatCard
          label="Total All-Time"
          value={stats.totalCollections}
          isMonetary
          icon={Coins}
          accentColor="zinc"
        />
      </div>

      {/* Charts Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-px rounded-2xl bg-slate-200/80 shadow-xs">
          <div className="bg-white rounded-[15px] p-5">
            <h4 className="text-sm font-bold text-slate-900 mb-3">
              7-Day Revenue Trend
            </h4>
            <ActivityChart data={revenueData} />
          </div>
        </div>

        <div className="p-px rounded-2xl bg-slate-200/80 shadow-xs">
          <div className="bg-white rounded-[15px] p-5">
            <h4 className="text-sm font-bold text-slate-900 mb-3">
              Hourly Traffic Peak Times
            </h4>
            <HourlyTrafficChart data={hourlyTraffic} />
          </div>
        </div>
      </div>

      {/* Recent Payments Stream */}
      <div className="p-px rounded-2xl bg-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-white rounded-[15px] p-5">
          <h4 className="text-sm font-bold text-slate-900 mb-3">
            Recent Payment Transactions
          </h4>
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No recent payment transactions recorded.
              </p>
            ) : (
              recentPayments.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900">{p.memberName}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {p.method}
                    </span>
                    <span className="text-slate-400 font-mono">{p.date}</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-emerald-700">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
