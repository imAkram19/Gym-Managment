import React, { useEffect, useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { DeviceStatusPanel } from '../components/biometrics/DeviceStatusPanel';
import { EnrollmentGrid } from '../components/biometrics/EnrollmentGrid';
import { ScanSimulator } from '../components/biometrics/ScanSimulator';
import { CheckInFeedback, type CheckInFeedbackData } from '../components/biometrics/CheckInFeedback';
import { FilterChips } from '../components/ui/FilterChips';
import {
  getBiometricDevices,
  createBiometricDevice,
  deleteBiometricDevice,
  getBiometricEnrollments,
  deleteBiometricEnrollment,
} from '../lib/api/biometrics';
import type {
  BiometricEnrollmentWithMember,
} from '../lib/api/biometrics';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/toast';
import type { BiometricDevice } from '../types';

const Biometrics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'enrollments' | 'simulator'>('overview');
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [enrollments, setEnrollments] = useState<BiometricEnrollmentWithMember[]>([]);
  const [todayScansCount, setTodayScansCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add Device Modal
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('ZKTeco K40');
  const [newDeviceIp, setNewDeviceIp] = useState('192.168.1.201');
  const [newDevicePort, setNewDevicePort] = useState(4370);
  const [addDeviceLoading, setAddDeviceLoading] = useState(false);

  // Feedback banner state
  const [feedbackData, setFeedbackData] = useState<CheckInFeedbackData>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deviceData, enrollData] = await Promise.all([
        getBiometricDevices(),
        getBiometricEnrollments(),
      ]);

      setDevices(deviceData);
      setEnrollments(enrollData);

      // Today's scans count
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('biometric_attendance_logs')
        .select('*', { count: 'exact', head: true })
        .gte('scan_timestamp', todayStart.toISOString());

      setTodayScansCount(count || 0);
    } catch (err) {
      console.error('Failed to load biometrics overview:', err);
      notify.error('Failed to load biometrics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefreshPing = async () => {
    setIsRefreshing(true);
    notify.deviceSyncing();
    try {
      await loadData();
      notify.deviceOnline();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddDeviceLoading(true);
    try {
      await createBiometricDevice(newDeviceName, newDeviceIp, Number(newDevicePort));
      notify.update('device-add', 'success', 'Biometric device added successfully');
      setShowAddDevice(false);
      await loadData();
    } catch (err: any) {
      notify.error(err.message || 'Failed to add device');
    } finally {
      setAddDeviceLoading(false);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      await deleteBiometricDevice(deviceId);
      notify.update('device-del', 'success', 'Device removed from gateway');
      await loadData();
    } catch (err: any) {
      notify.error(err.message || 'Failed to delete device');
    }
  };

  const handleDeleteEnrollment = async (enrollmentId: string, memberName: string) => {
    try {
      await deleteBiometricEnrollment(enrollmentId);
      notify.memberUpdated(memberName);
      await loadData();
    } catch (err: any) {
      notify.error(err.message || 'Failed to delete enrollment');
    }
  };

  const handleScanSimulated = (result: {
    type: 'success' | 'denied';
    memberName: string;
    memberId?: string;
    reason?: string;
  }) => {
    const time = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    if (result.type === 'success') {
      setFeedbackData({
        type: 'success',
        memberName: result.memberName,
        memberId: result.memberId || '',
        time,
      });
    } else {
      setFeedbackData({
        type: 'denied',
        memberName: result.memberName,
        memberId: result.memberId,
        reason: result.reason || 'Verification failed',
        time,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── FEEDBACK SCAN BANNER ── */}
      <CheckInFeedback
        data={feedbackData}
        onDismiss={() => setFeedbackData(null)}
      />

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Biometrics Gateway
          </h1>
          <p className="text-sm text-slate-500">
            Hardware terminal monitoring, member fingerprint mapping, and scan simulator.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <FilterChips
            size="md"
            value={activeTab}
            onChange={(val) => setActiveTab(val as any)}
            options={[
              { value: 'overview', label: 'Hardware Terminals' },
              { value: 'enrollments', label: 'Enrolled Users', count: enrollments.length },
              { value: 'simulator', label: 'Scan Simulator' },
            ]}
          />

          <button
            type="button"
            onClick={() => setShowAddDevice(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Terminal</span>
          </button>
        </div>
      </div>

      {/* ── 1. HARDWARE OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((device) => (
              <DeviceStatusPanel
                key={device.id}
                device={device}
                enrolledCount={enrollments.length}
                todayScansCount={todayScansCount}
                onRefresh={handleRefreshPing}
                onDelete={() => handleDeleteDevice(device.id)}
                isRefreshing={isRefreshing}
              />
            ))}
          </div>

          {/* Quick simulator widget on overview */}
          <div className="pt-2">
            <ScanSimulator
              enrollments={enrollments}
              onScanSimulated={handleScanSimulated}
            />
          </div>
        </div>
      )}

      {/* ── 2. ENROLLED USERS TAB ── */}
      {activeTab === 'enrollments' && (
        <EnrollmentGrid
          enrollments={enrollments}
          onDeleteEnrollment={handleDeleteEnrollment}
          loading={loading}
        />
      )}

      {/* ── 3. SIMULATOR TAB ── */}
      {activeTab === 'simulator' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <ScanSimulator
            enrollments={enrollments}
            onScanSimulated={handleScanSimulated}
          />
        </div>
      )}

      {/* ── ADD DEVICE MODAL ── */}
      {showAddDevice && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm"
        >
          <div className="w-full max-w-md p-px rounded-2xl bg-slate-200/90 shadow-2xl overflow-hidden animate-[scale-in_150ms_cubic-bezier(0.23,1,0.32,1)_both]">
            <div className="bg-white rounded-[15px] p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  Connect Biometric Device
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddDevice(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDevice} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Device Name
                  </label>
                  <input
                    type="text"
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      IP Address
                    </label>
                    <input
                      type="text"
                      value={newDeviceIp}
                      onChange={(e) => setNewDeviceIp(e.target.value)}
                      required
                      className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Port
                    </label>
                    <input
                      type="number"
                      value={newDevicePort}
                      onChange={(e) => setNewDevicePort(Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddDevice(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addDeviceLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    {addDeviceLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Connect Terminal</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Biometrics;
