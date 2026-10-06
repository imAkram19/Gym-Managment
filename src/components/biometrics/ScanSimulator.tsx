import React, { useState } from 'react';
import { Fingerprint, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { notify } from '../../lib/toast';
import type { BiometricEnrollmentWithMember } from '../../lib/api/biometrics';

interface ScanSimulatorProps {
  enrollments: BiometricEnrollmentWithMember[];
  onScanSimulated?: (result: {
    type: 'success' | 'denied';
    memberName: string;
    memberId?: string;
    reason?: string;
  }) => void;
}

export const ScanSimulator: React.FC<ScanSimulatorProps> = ({
  enrollments,
  onScanSimulated,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSimulateScan = async (type: 'valid' | 'expired' | 'unknown') => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      if (type === 'unknown') {
        // Log unknown scan
        await supabase.from('biometric_attendance_logs').insert([
          {
            device_user_id: 999,
            scan_timestamp: now.toISOString(),
            status: 'unknown_user',
            processed: true,
          },
        ]);

        notify.error('Unknown fingerprint scanned');
        onScanSimulated?.({
          type: 'denied',
          memberName: 'Unknown Person',
          reason: 'Fingerprint ID #999 not registered on any gym member',
        });
        return;
      }

      const enrollment = enrollments.find(
        (e) => String(e.deviceUserId) === selectedUserId
      );

      if (!enrollment) {
        notify.error('Please select an enrolled member first');
        return;
      }

      if (type === 'valid') {
        // 1. Insert attendance check-in
        const { error: attError } = await supabase.from('attendance').insert([
          {
            member_id: enrollment.memberId,
            date: todayStr,
            check_in_time: timeStr,
            method: 'fingerprint',
          },
        ]);
        if (attError) throw attError;

        // 2. Insert biometric log
        await supabase.from('biometric_attendance_logs').insert([
          {
            device_user_id: enrollment.deviceUserId,
            scan_timestamp: now.toISOString(),
            status: 'success',
            processed: true,
          },
        ]);

        notify.checkInSuccess(enrollment.memberName);
        onScanSimulated?.({
          type: 'success',
          memberName: enrollment.memberName,
          memberId: enrollment.memberId,
        });
      } else if (type === 'expired') {
        // Log denied scan
        await supabase.from('biometric_attendance_logs').insert([
          {
            device_user_id: enrollment.deviceUserId,
            scan_timestamp: now.toISOString(),
            status: 'denied_no_plan',
            processed: true,
          },
        ]);

        notify.checkInDenied(enrollment.memberName, 'Membership expired or inactive');
        onScanSimulated?.({
          type: 'denied',
          memberName: enrollment.memberName,
          memberId: enrollment.memberId,
          reason: 'Membership expired. Renewal required for floor access.',
        });
      }
    } catch (err: any) {
      console.error('Scan simulator error:', err);
      notify.error(err.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-px rounded-2xl bg-slate-200/80 shadow-sm overflow-hidden">
      <div className="bg-white rounded-[15px] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Hardware Scan Simulator
              </h4>
              <p className="text-xs text-slate-500">
                Test biometric check-in logic without physical K40 hardware
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase font-bold">
            Dev Tool
          </span>
        </div>

        {/* Member selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Select Enrolled Member
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">-- Choose member (Device ID) --</option>
            {enrollments.map((e) => (
              <option key={e.id} value={String(e.deviceUserId)}>
                #{e.deviceUserId} - {e.memberName} ({e.syncStatus || 'synced'})
              </option>
            ))}
          </select>
        </div>

        {/* Simulation Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            disabled={!selectedUserId || loading}
            onClick={() => handleSimulateScan('valid')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>Valid Scan</span>
          </button>

          <button
            type="button"
            disabled={!selectedUserId || loading}
            onClick={() => handleSimulateScan('expired')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>Denied Scan</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSimulateScan('unknown')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            <span>Unknown Scan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
