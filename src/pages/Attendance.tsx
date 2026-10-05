import React, { useEffect, useState } from 'react';
import { Flame, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CheckInPanel } from '../components/attendance/CheckInPanel';
import { AttendanceLog, type AttendanceRecordItem } from '../components/attendance/AttendanceLog';
import { FilterChips } from '../components/ui/FilterChips';
import { HourlyTrafficChart } from '../components/dashboard/HourlyTrafficChart';
import { SlideOver } from '../components/ui/SlideOver';
import { MemberDetailSheet } from '../components/members/MemberDetailSheet';
import { getMembers } from '../lib/api/members';
import { getMemberAttendanceMetrics } from '../lib/api/attendance';
import { getHourlyTrafficData } from '../lib/api/dashboard';
import { supabase } from '../lib/supabase';
import type { Member } from '../types';
import type { MemberAttendanceStat } from '../lib/api/attendance';
import { clsx } from 'clsx';

const Attendance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'log' | 'leaderboard' | 'traffic'>('log');
  const [members, setMembers] = useState<Member[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecordItem[]>([]);
  const [metrics, setMetrics] = useState<MemberAttendanceStat[]>([]);
  const [hourlyTraffic, setHourlyTraffic] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersData, logsData, metricsData, trafficData] = await Promise.all([
        getMembers(),
        supabase
          .from('attendance')
          .select(`
            id,
            member_id,
            date,
            check_in_time,
            method,
            members:member_id (
              full_name,
              image_url
            )
          `)
          .order('date', { ascending: false })
          .order('check_in_time', { ascending: false })
          .limit(100),
        getMemberAttendanceMetrics(),
        getHourlyTrafficData(),
      ]);

      setMembers(membersData);
      setMetrics(metricsData);
      setHourlyTraffic(trafficData);

      if (logsData.data) {
        const formatted: AttendanceRecordItem[] = logsData.data.map((l: any) => ({
          id: l.id,
          memberId: l.member_id,
          memberName: l.members?.full_name || 'Member',
          memberImage: l.members?.image_url,
          date: l.date,
          checkInTime: l.check_in_time,
          method: l.method || 'manual',
        }));
        setAttendanceLogs(formatted);
      }
    } catch (err) {
      console.error('Failed to load attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Attendance & Floor Access
          </h1>
          <p className="text-sm text-slate-500">
            Real-time gym visits, manual reception check-in, and member consistency streaks.
          </p>
        </div>

        <FilterChips
          size="md"
          value={activeTab}
          onChange={(val) => setActiveTab(val as any)}
          options={[
            { value: 'log', label: 'Attendance Log', count: attendanceLogs.length },
            { value: 'leaderboard', label: 'Streak Leaderboard' },
            { value: 'traffic', label: 'Traffic Analysis' },
          ]}
        />
      </div>

      {/* ── 1. LOG TAB (Manual Check-In Form + Attendance Table) ── */}
      {activeTab === 'log' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <CheckInPanel members={members} onCheckInSuccess={loadData} />
          </div>
          <div className="lg:col-span-2">
            <AttendanceLog
              logs={attendanceLogs}
              loading={loading}
              onSelectMember={(id) => setSelectedMemberId(id)}
            />
          </div>
        </div>
      )}

      {/* ── 2. LEADERBOARD TAB (Streaks & Consistency) ── */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-transparent border border-amber-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                👑
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Dedicated Leaderboard & Hall of Fame</h4>
                <p className="text-xs text-slate-500">View the full interactive podium, monthly warriors, and TV reception display</p>
              </div>
            </div>
            <Link
              to="/leaderboard"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 transition-all shrink-0 shadow-sm"
            >
              <span>Open Leaderboard Tab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.slice(0, 12).map((item, index) => (
              <div
                key={item.memberId}
                onClick={() => setSelectedMemberId(item.memberId)}
                className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0',
                      index === 0
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : index === 1
                        ? 'bg-slate-200 text-slate-700'
                        : index === 2
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">
                      {item.fullName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {item.totalVisits} total sessions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 font-bold text-xs font-mono">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>{item.currentStreak}d streak</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. TRAFFIC ANALYSIS TAB ── */}
      {activeTab === 'traffic' && (
        <div className="p-px rounded-2xl bg-slate-200/80 shadow-xs">
          <div className="bg-white rounded-[15px] p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hourly Peak Attendance Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Visual analysis of the busiest workout hours at Iron Gym
              </p>
            </div>
            <HourlyTrafficChart data={hourlyTraffic} />
          </div>
        </div>
      )}

      {/* ── SLIDEOVER MEMBER DETAILS ── */}
      <SlideOver
        isOpen={!!selectedMemberId}
        onClose={() => setSelectedMemberId(null)}
        title="Member Details"
        subtitle="Quick attendance overview"
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

export default Attendance;
