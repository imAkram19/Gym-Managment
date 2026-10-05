import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LiveHUD } from '../components/dashboard/LiveHUD';
import { LiveCheckInFeed } from '../components/dashboard/LiveCheckInFeed';
import { OwnerFinancialPanel } from '../components/dashboard/OwnerFinancialPanel';
import { SlideOver } from '../components/ui/SlideOver';
import { MemberDetailSheet } from '../components/members/MemberDetailSheet';
import { useLiveCheckIns } from '../hooks/useLiveCheckIns';
import { getBiometricDevices } from '../lib/api/biometrics';
import {
  getDashboardStats,
  getRecentPayments,
  getRevenueData,
  getHourlyTrafficData,
} from '../lib/api/dashboard';
import type { BiometricDevice } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Reception Real-Time Check-In Feed (WebSocket, zero polling)
  const { checkIns, isLoading: isFeedLoading } = useLiveCheckIns(20);

  // Top reception devices & stats
  const [primaryDevice, setPrimaryDevice] = useState<BiometricDevice | null>(null);
  const [activeMembersCount, setActiveMembersCount] = useState<number>(0);
  const [expiringSoonCount, setExpiringSoonCount] = useState<number>(0);

  // Selected member for slide-over drawer
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Financial data state (loaded for owner panel)
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

  useEffect(() => {
    let isMounted = true;

    const loadInitialDashboard = async () => {
      try {
        const [devices, stats, payments, chartData, traffic] = await Promise.all([
          getBiometricDevices(),
          getDashboardStats(),
          getRecentPayments(8),
          getRevenueData(),
          getHourlyTrafficData(),
        ]);

        if (isMounted) {
          if (devices && devices.length > 0) {
            setPrimaryDevice(devices[0]);
          }
          setActiveMembersCount(stats.activeMembers || 0);
          setExpiringSoonCount(stats.expiringSoon || 0);
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
        }
      } catch (err) {
        console.error('Failed to load dashboard overview data:', err);
      }
    };

    loadInitialDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* ── 1. LIVE RECEPTION HUD (Always visible, no lock needed) ── */}
      <div>
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reception Live HUD
          </h1>
          <p className="text-sm text-slate-500">
            Real-time floor check-ins, member status, and biometric gateway.
          </p>
        </div>

        <LiveHUD
          checkedInTodayCount={checkIns.length}
          expiringSoonCount={expiringSoonCount}
          activeMembersCount={activeMembersCount}
          primaryDevice={primaryDevice}
          onAttendanceClick={() => navigate('/attendance')}
          onExpiringClick={() => navigate('/members?filter=expiring')}
          onActiveClick={() => navigate('/members?filter=active')}
          onDeviceClick={() => navigate('/biometrics')}
        />
      </div>

      {/* ── 2. REAL-TIME CHECK-IN FEED ── */}
      <div>
        <LiveCheckInFeed
          checkIns={checkIns}
          isLoading={isFeedLoading}
          onMemberClick={(id) => setSelectedMemberId(id)}
        />
      </div>

      {/* ── 3. OWNER FINANCIAL PANEL (Password protected) ── */}
      <div className="pt-2 border-t border-slate-200">
        <OwnerFinancialPanel
          stats={financialStats}
          recentPayments={recentPayments}
          revenueData={revenueData}
          hourlyTraffic={hourlyTraffic}
        />
      </div>

      {/* ── MEMBER DETAIL SLIDEOVER DRAWER ── */}
      <SlideOver
        isOpen={!!selectedMemberId}
        onClose={() => setSelectedMemberId(null)}
        title="Member Details"
        subtitle="Quick overview from Dashboard"
      >
        {selectedMemberId && (
          <MemberDetailSheet
            memberId={selectedMemberId}
            onClose={() => setSelectedMemberId(null)}
          />
        )}
      </SlideOver>
    </div>
  );
};

export default Dashboard;
