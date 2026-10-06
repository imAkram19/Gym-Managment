import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Wallet,
  Banknote,
  Coins,
  TrendingUp,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import { ActivityChart } from '../dashboard/ActivityChart';
import { HourlyTrafficChart } from '../dashboard/HourlyTrafficChart';
import { notify } from '../../lib/toast';
import {
  getDashboardStats,
  getRecentPayments,
  getRevenueData,
  getHourlyTrafficData,
} from '../../lib/api/dashboard';
import { clsx } from 'clsx';

export const OwnerVault: React.FC = () => {
  // Always locked on every visit, tab switch, or page navigation
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Clear any historical owner access keys on mount and unmount
  useEffect(() => {
    localStorage.removeItem('irongym_owner_access');
    return () => {
      localStorage.removeItem('irongym_owner_access');
    };
  }, []);

  // Financial Analytics State
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialStats, setFinancialStats] = useState({
    monthlyRevenue: 0,
    totalCollections: 0,
    cashPayments: 0,
    upiPayments: 0,
    otherPayments: 0,
    revenueTrend: 0,
    avgPaymentAmount: 0,
    totalTransactions: 0,
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [hourlyTraffic, setHourlyTraffic] = useState<any[]>([]);
  const [hasLoadedFinancials, setHasLoadedFinancials] = useState(false);

  // Handle Unlock
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = import.meta.env.VITE_OWNER_PASSWORD || 'iron';
    if (password === expected) {
      setIsUnlocked(true);
      setError('');
      localStorage.removeItem('irongym_owner_access');
      notify.success('Owner Vault unlocked.');
    } else {
      setError('Incorrect owner password.');
    }
  };

  // Handle Lock
  const handleLock = () => {
    setIsUnlocked(false);
    setPassword('');
    localStorage.removeItem('irongym_owner_access');
    notify.update('owner-auth', 'success', 'Owner Vault locked.');
  };

  // Load Financial Analytics on demand when unlocked
  const loadFinancialData = async () => {
    if (hasLoadedFinancials) return;
    setFinancialLoading(true);
    try {
      const [stats, payments, chartData, traffic] = await Promise.all([
        getDashboardStats(),
        getRecentPayments(10),
        getRevenueData(),
        getHourlyTrafficData(),
      ]);

      setFinancialStats({
        monthlyRevenue: stats.monthlyRevenue || 0,
        totalCollections: stats.totalCollections || 0,
        cashPayments: stats.cashPayments || 0,
        upiPayments: stats.upiPayments || 0,
        otherPayments: stats.otherPayments || 0,
        revenueTrend: stats.revenueTrend || 0,
        avgPaymentAmount: stats.avgPaymentAmount || 0,
        totalTransactions: stats.totalTransactions || 0,
      });
      setRecentPayments(payments || []);
      setRevenueData(chartData || []);
      setHourlyTraffic(traffic || []);
      setHasLoadedFinancials(true);
    } catch (err) {
      console.error('Failed to load financial data:', err);
      notify.error('Failed to load financial records');
    } finally {
      setFinancialLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      loadFinancialData();
    }
  }, [isUnlocked]);

  // ── 1. LOCKED VIEW ──
  if (!isUnlocked) {
    return (
      <div className="p-px rounded-2xl bg-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-white rounded-[15px] p-6 sm:p-10 flex flex-col items-center justify-center text-center max-w-md mx-auto my-6 space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Owner Vault
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Confidential financial controls and executive analytics. Enter owner password to authenticate.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="w-full space-y-3.5">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter owner password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                required
                className={clsx(
                  'w-full px-4 py-2.5 text-base sm:text-xs rounded-xl border outline-none transition-all pr-10',
                  error
                    ? 'border-red-300 focus:ring-2 focus:ring-red-500/20'
                    : 'border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                )}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && <p className="text-xs text-red-600 font-medium text-left">{error}</p>}

            <button
              type="submit"
              className="w-full min-h-[44px] py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Owner Vault</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── 2. UNLOCKED VIEW ──
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Vault Header Bar */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-slate-900 truncate">
                  Executive Security
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Authenticated
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                Real-time financial tracking and revenue analytics.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLock}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors cursor-pointer shrink-0 min-h-[36px]"
            title="Lock Owner Vault"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Vault</span>
          </button>
        </div>
      </div>

      {/* Financial Analytics Dashboard */}
      <div className="space-y-5 sm:space-y-6">
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <StatCard
            label="This Month"
            value={financialStats.monthlyRevenue}
            isMonetary
            delta={
              financialStats.revenueTrend !== 0
                ? { value: financialStats.revenueTrend, label: 'vs last month' }
                : undefined
            }
            icon={Wallet}
            accentColor="green"
            isLoading={financialLoading}
          />
          <StatCard
            label="Total Collections"
            value={financialStats.totalCollections}
            isMonetary
            icon={TrendingUp}
            accentColor="blue"
            isLoading={financialLoading}
          />
          <StatCard
            label="Cash Received"
            value={financialStats.cashPayments}
            isMonetary
            icon={Banknote}
            accentColor="amber"
            isLoading={financialLoading}
          />
          <StatCard
            label="Online (UPI)"
            value={financialStats.upiPayments}
            isMonetary
            icon={QrCode}
            accentColor="blue"
            isLoading={financialLoading}
          />
        </div>

        {/* Charts: Revenue Trends + Hourly Gym Traffic */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ActivityChart data={revenueData} />
          <HourlyTrafficChart data={hourlyTraffic} />
        </div>

        {/* Recent Transactions & Payment Channels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Payment Method Distribution */}
          <div className="p-px rounded-2xl bg-slate-200/80 shadow-xs lg:col-span-1">
            <div className="bg-white rounded-[15px] p-4 sm:p-5 space-y-4 h-full">
              <h4 className="text-base font-bold text-slate-900 tracking-tight">
                Collection Channels
              </h4>
              <p className="text-xs text-slate-500">
                Breakdown of receipts by payment gateway and counter cash
              </p>

              <div className="space-y-2.5 sm:space-y-3 pt-1">
                <div className="p-3 sm:p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-2 bg-purple-600 text-white rounded-lg">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">UPI / QR Code</p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500">Instant digital settlements</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs sm:text-sm text-purple-700">
                    ₹{financialStats.upiPayments.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-2 bg-amber-600 text-white rounded-lg">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Cash Counter</p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500">Physical front-desk cash</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs sm:text-sm text-amber-700">
                    ₹{financialStats.cashPayments.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-2 bg-slate-600 text-white rounded-lg">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Other / Card</p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500">Bank transfers & POS</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs sm:text-sm text-slate-700">
                    ₹{financialStats.otherPayments.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Audit Ledger */}
          <div className="p-px rounded-2xl bg-slate-200/80 shadow-xs lg:col-span-2">
            <div className="bg-white rounded-[15px] p-4 sm:p-5 space-y-4 h-full">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 tracking-tight">
                    Recent Collections Ledger
                  </h4>
                  <p className="text-xs text-slate-500">
                    Latest membership dues and receipts collected
                  </p>
                </div>
                <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-400">
                  Last 10 records
                </span>
              </div>

              {recentPayments.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No transaction records found.
                </div>
              ) : (
                <>
                  {/* Mobile Compact Cards List (< md) */}
                  <div className="md:hidden space-y-2.5">
                    {recentPayments.map((p) => {
                      const memberName = p.members?.full_name || 'Member';
                      const planLabel = p.admin_note ? p.admin_note.replace(/^Plan Renewal:\s*/i, '') : 'Membership';
                      const method = (p.method || 'cash').toLowerCase();

                      return (
                        <div
                          key={p.id}
                          className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-200">
                              {p.members?.image_url ? (
                                <img src={p.members.image_url} alt="" className="w-full h-full object-cover rounded-full" />
                              ) : (
                                memberName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-slate-900 truncate">
                                {memberName}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={clsx(
                                    'px-1.5 py-0.2 rounded text-[9px] font-bold uppercase font-mono border',
                                    method === 'upi'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : method === 'cash'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  )}
                                >
                                  {method}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={planLabel}>
                                  {planLabel}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="font-mono font-bold text-xs text-emerald-600">
                              ₹{p.amount?.toLocaleString('en-IN')}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {p.date}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Full Table (>= md) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3">Member</th>
                          <th className="py-2.5 px-3">Plan</th>
                          <th className="py-2.5 px-3 text-center">Mode</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                          <th className="py-2.5 px-3 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentPayments.map((p) => {
                          const memberName = p.members?.full_name || 'Member';
                          const planLabel = p.admin_note ? p.admin_note.replace(/^Plan Renewal:\s*/i, '') : 'Membership';
                          const method = (p.method || 'cash').toLowerCase();

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3 font-semibold text-slate-900">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 border border-blue-200">
                                    {p.members?.image_url ? (
                                      <img src={p.members.image_url} alt="" className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                      memberName.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <span className="truncate max-w-[130px] sm:max-w-none">
                                    {memberName}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-slate-600 truncate max-w-[130px]" title={planLabel}>
                                {planLabel}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={clsx(
                                    'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border',
                                    method === 'upi'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : method === 'cash'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  )}
                                >
                                  {method}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                                ₹{p.amount?.toLocaleString('en-IN')}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-xs text-slate-500 whitespace-nowrap">
                                {p.date}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
