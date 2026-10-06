import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { AttendanceLog, type AttendanceRecordItem } from '../components/attendance/AttendanceLog';
import { SlideOver } from '../components/ui/SlideOver';
import { MemberDetailSheet } from '../components/members/MemberDetailSheet';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/toast';

const Attendance: React.FC = () => {
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
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
        .limit(100);

      if (error) throw error;

      if (data) {
        const formatted: AttendanceRecordItem[] = data.map((l: any) => ({
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
    } catch (err: any) {
      console.error('Failed to load attendance logs:', err);
      notify.error('Failed to load attendance logs');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Attendance History
          </h1>
          <p className="text-sm text-slate-500">
            Real-time gym visits and historical check-in audit trail.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={loading || isRefreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── FULL-WIDTH ATTENDANCE AUDIT LOG ── */}
      <div className="w-full">
        <AttendanceLog
          logs={attendanceLogs}
          loading={loading}
          onSelectMember={(id) => setSelectedMemberId(id)}
        />
      </div>

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
