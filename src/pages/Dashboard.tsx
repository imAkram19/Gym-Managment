import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LiveHUD } from '../components/dashboard/LiveHUD';
import { LiveCheckInFeed } from '../components/dashboard/LiveCheckInFeed';
import { SlideOver } from '../components/ui/SlideOver';
import { MemberDetailSheet } from '../components/members/MemberDetailSheet';
import { useLiveCheckIns } from '../hooks/useLiveCheckIns';
import { getBiometricDevices } from '../lib/api/biometrics';
import { getDashboardStats } from '../lib/api/dashboard';
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

  useEffect(() => {
    let isMounted = true;

    const loadInitialDashboard = async () => {
      try {
        const [devices, stats] = await Promise.all([
          getBiometricDevices(),
          getDashboardStats(),
        ]);

        if (isMounted) {
          if (devices && devices.length > 0) {
            setPrimaryDevice(devices[0]);
          }
          setActiveMembersCount(stats.activeMembers || 0);
          setExpiringSoonCount(stats.expiringSoon || 0);
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
