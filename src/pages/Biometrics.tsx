import React, { useEffect, useState } from 'react';
import { 
    Fingerprint, 
    Cpu, 
    History, 
    Plus, 
    Trash2, 
    RefreshCw, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    Search,
    Link,
    Unlink
} from 'lucide-react';
import { 
    getBiometricDevices, 
    createBiometricDevice, 
    deleteBiometricDevice,
    getBiometricEnrollments,
    enrollMemberBiometrics,
    deleteBiometricEnrollment,
    getBiometricAttendanceLogs,
    syncMemberStatuses
} from '../lib/api/biometrics';
import type {
    BiometricEnrollmentWithMember,
    BiometricAttendanceLogWithDevice
} from '../lib/api/biometrics';
import { getMembers } from '../lib/api/members';
import { getSubscriptions } from '../lib/api/subscriptions';
import type { BiometricDevice, Member } from '../types';
import { clsx } from 'clsx';
import { supabase } from '../lib/supabase';

const Biometrics: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'devices' | 'enrollments' | 'logs'>('devices');
    const [enrollmentFilter, setEnrollmentFilter] = useState<'all' | 'active' | 'expired' | 'needs_enrollment' | 'needs_deletion'>('all');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Devices State
    const [devices, setDevices] = useState<BiometricDevice[]>([]);
    const [showAddDevice, setShowAddDevice] = useState(false);
    const [deviceName, setDeviceName] = useState('');
    const [deviceIp, setDeviceIp] = useState('192.168.1.201');
    const [devicePort, setDevicePort] = useState(4370);

    // Enrollments & Subscriptions State
    const [enrollments, setEnrollments] = useState<BiometricEnrollmentWithMember[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [enrollStep, setEnrollStep] = useState<'idle' | 'pending'>('idle');
    const [searchQuery, setSearchQuery] = useState('');

    // Logs State
    const [logs, setLogs] = useState<BiometricAttendanceLogWithDevice[]>([]);
    const [todaysScansCount, setTodaysScansCount] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const [deviceData, enrollData, memberData, subData, logData] = await Promise.all([
                getBiometricDevices(),
                getBiometricEnrollments(),
                getMembers(),
                getSubscriptions(),
                getBiometricAttendanceLogs()
            ]);

            setDevices(deviceData);
            setEnrollments(enrollData);
            setMembers(memberData);
            setSubscriptions(subData);
            setLogs(logData);

            // Fetch today's scans count
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const { count, error: scansError } = await supabase
                .from('biometric_attendance_logs')
                .select('*', { count: 'exact', head: true })
                .gte('scan_timestamp', todayStart.toISOString());

            if (!scansError && count !== null) {
                setTodaysScansCount(count);
            } else {
                const todayStr = new Date().toISOString().split('T')[0];
                const localCount = logData.filter(log => log.scanTimestamp.startsWith(todayStr)).length;
                setTodaysScansCount(localCount);
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to load biometrics data.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddDevice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deviceName || !deviceIp) return;
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await createBiometricDevice(deviceName, deviceIp, devicePort);
            setSuccessMsg('Biometric device registered successfully!');
            setDeviceName('');
            setShowAddDevice(false);
            loadData();
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to register device.');
        }
    };

    const handleDeleteDevice = async (id: string) => {
        if (!confirm('Are you sure you want to remove this device?')) return;
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await deleteBiometricDevice(id);
            setSuccessMsg('Device removed successfully.');
            loadData();
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to delete device.');
        }
    };

    const handleStartEnrollment = () => {
        if (!selectedMemberId) return;
        setEnrollStep('pending');
        setSuccessMsg(`Assigned ID #${assignedId}. Please create this user ID on the physical K40 device and register their fingerprint.`);
    };

    const handleConfirmEnrollment = async () => {
        if (!selectedMemberId) return;
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await enrollMemberBiometrics(selectedMemberId, assignedId);
            setSuccessMsg('Fingerprint enrollment confirmed and mapped successfully!');
            setSelectedMemberId('');
            setEnrollStep('idle');
            loadData();
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to confirm enrollment.');
        }
    };

    const handleUnlink = async (id: string) => {
        if (!confirm('Are you sure you want to remove this fingerprint mapping?')) return;
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await deleteBiometricEnrollment(id);
            setSuccessMsg('Enrollment unlinked successfully.');
            loadData();
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to remove enrollment.');
        }
    };

    const handleSyncStatuses = async () => {
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await syncMemberStatuses();
            setSuccessMsg('Membership & subscription expiry synchronized successfully!');
            loadData();
        } catch (err: any) {
            setErrorMsg(err.message || 'Sync failed.');
        } finally {
            setLoading(false);
        }
    };

    const getDaysRemainingForMember = (memberId: string) => {
        const activeSub = subscriptions.find(s => s.memberId === memberId && s.isActive);
        if (activeSub) {
            return { days: activeSub.remainingDays, label: `${activeSub.remainingDays} days` };
        }
        const anySub = subscriptions.find(s => s.memberId === memberId);
        if (anySub) {
            if (anySub.remainingDays < 0) {
                return { days: anySub.remainingDays, label: 'Expired' };
            }
            return { days: anySub.remainingDays, label: `${anySub.remainingDays} days` };
        }
        return { days: 0, label: 'N/A' };
    };

    const assignedId = enrollments.length > 0 ? Math.max(...enrollments.map(e => e.deviceUserId)) + 1 : 101;



    // Filtered enrollments for search & quick filters
    const filteredEnrollments = enrollments.filter(e => {
        const matchesSearch = e.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.deviceUserId.toString().includes(searchQuery);
        if (!matchesSearch) return false;

        if (enrollmentFilter === 'active') return e.memberStatus === 'active';
        if (enrollmentFilter === 'expired') return e.memberStatus === 'expired';
        if (enrollmentFilter === 'needs_enrollment') return e.syncStatus === 'needs_enrollment';
        if (enrollmentFilter === 'needs_deletion') return e.syncStatus === 'needs_deletion';

        return true;
    });

    const onlineDevicesCount = devices.filter(d => d.status === 'online').length;
    const pendingActionsCount = enrollments.filter(e => e.syncStatus === 'needs_deletion' || e.syncStatus === 'needs_enrollment').length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Fingerprint className="w-8 h-8 text-indigo-600 animate-pulse" />
                        Biometrics & Sync Management
                    </h1>
                    <p className="text-gray-500 mt-1">Manage ZKTeco K40 hardware, fingerprint enrollments, and check-in logs.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSyncStatuses}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium shadow-sm transition-colors cursor-pointer"
                    >
                        <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
                        Sync Expired Members
                    </button>
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 shadow-sm cursor-pointer"
                        title="Reload Data"
                    >
                        <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Error / Success Banners */}
            {errorMsg && (
                <div className="p-4 bg-red-50 text-red-800 rounded-lg flex items-center gap-3 border border-red-200">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-sm font-medium">{errorMsg}</span>
                </div>
            )}
            {successMsg && (
                <div className="p-4 bg-green-50 text-green-800 rounded-lg flex items-center gap-3 border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm font-medium">{successMsg}</span>
                </div>
            )}

            {/* Redesigned summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Devices Online */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Devices Online</span>
                        <span className={clsx(
                            "w-2 h-2 rounded-full",
                            devices.length > 0 && devices.every(d => d.status === 'online') ? "bg-green-500" :
                            devices.some(d => d.status === 'online') ? "bg-amber-500" : "bg-red-500"
                        )}></span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-bold text-gray-950">
                            {onlineDevicesCount} / {devices.length}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            {devices.length > 0 && devices.every(d => d.status === 'online') ? 'All devices healthy' : 
                             devices.some(d => d.status === 'online') ? 'Some devices offline' : 'All devices offline'}
                        </p>
                    </div>
                </div>

                {/* Mapped Fingerprints */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mapped Fingerprints</span>
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-bold text-gray-950">{enrollments.length}</h3>
                        <p className="text-xs text-gray-400 mt-1">Total biometric enrollments</p>
                    </div>
                </div>

                {/* Today's Scans */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Scans</span>
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-bold text-gray-950">{todaysScansCount}</h3>
                        <p className="text-xs text-gray-400 mt-1">Total scans registered today</p>
                    </div>
                </div>

                {/* Pending Actions */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Actions</span>
                        <span className={clsx(
                            "w-2 h-2 rounded-full",
                            pendingActionsCount > 0 ? "bg-amber-500 animate-pulse" : "bg-green-500"
                        )}></span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-bold text-gray-950">{pendingActionsCount}</h3>
                        <p className="text-xs text-gray-400 mt-1">
                            {pendingActionsCount > 0 ? 'Requires hardware sync' : 'All templates fully synced'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('devices')}
                        className={clsx(
                            "pb-4 text-sm font-medium border-b-2 px-1 transition-all",
                            activeTab === 'devices' 
                                ? "border-indigo-600 text-indigo-600" 
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <Cpu className="w-4 h-4" />
                            Devices
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('enrollments')}
                        className={clsx(
                            "pb-4 text-sm font-medium border-b-2 px-1 transition-all",
                            activeTab === 'enrollments' 
                                ? "border-indigo-600 text-indigo-600" 
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <Link className="w-4 h-4" />
                            Fingerprint Map
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={clsx(
                            "pb-4 text-sm font-medium border-b-2 px-1 transition-all",
                            activeTab === 'logs' 
                                ? "border-indigo-600 text-indigo-600" 
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <History className="w-4 h-4" />
                            Live Scan Logs
                        </span>
                    </button>
                </nav>
            </div>

            {/* TAB CONTENT: DEVICES */}
            {activeTab === 'devices' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Biometric Devices</h2>
                        <button
                            onClick={() => setShowAddDevice(!showAddDevice)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            Register K40 Device
                        </button>
                    </div>

                    {showAddDevice && (
                        <form onSubmit={handleAddDevice} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 max-w-xl">
                            <h3 className="font-bold text-gray-800">Register ZKTeco Device</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Device Name</label>
                                    <input 
                                        type="text" 
                                        value={deviceName}
                                        onChange={e => setDeviceName(e.target.value)}
                                        placeholder="e.g. Reception Gate"
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">IP Address</label>
                                    <input 
                                        type="text" 
                                        value={deviceIp}
                                        onChange={e => setDeviceIp(e.target.value)}
                                        placeholder="e.g. 192.168.1.201"
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Port</label>
                                    <input 
                                        type="number" 
                                        value={devicePort}
                                        onChange={e => setDevicePort(parseInt(e.target.value, 10))}
                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button 
                                    type="button" 
                                    onClick={() => setShowAddDevice(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg text-sm hover:bg-gray-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 font-semibold cursor-pointer"
                                >
                                    Save Device
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Device Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IP Address</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Port</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Ping</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {devices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                                            No biometric devices registered. Wait for the sync agent to start or register a device manually above.
                                        </td>
                                    </tr>
                                ) : (
                                    devices.map((device) => (
                                        <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{device.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{device.ipAddress}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{device.port}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={clsx(
                                                    "px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 border",
                                                    device.status === 'online' 
                                                        ? "bg-green-50 text-green-700 border-green-200" 
                                                        : "bg-red-50 text-red-700 border-red-200"
                                                )}>
                                                    <span className={clsx("w-1.5 h-1.5 rounded-full", device.status === 'online' ? "bg-green-500" : "bg-red-500")}></span>
                                                    {device.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {device.lastPing ? new Date(device.lastPing).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <button
                                                    onClick={() => handleDeleteDevice(device.id)}
                                                    className="text-red-600 hover:text-red-900 transition-colors p-1 cursor-pointer"
                                                    title="Delete Device"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: ENROLLMENTS */}
            {activeTab === 'enrollments' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit space-y-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <Fingerprint className="w-5 h-5 text-indigo-600" />
                            Enroll Fingerprint
                        </h2>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Member</label>
                            <select
                                value={selectedMemberId}
                                onChange={e => {
                                    setSelectedMemberId(e.target.value);
                                    setEnrollStep('idle');
                                }}
                                disabled={enrollStep === 'pending'}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer"
                            >
                                <option value="">-- Choose Member --</option>
                                {members.map(m => {
                                    const enrollRecord = enrollments.find(e => e.memberId === m.id);
                                    let statusLabel = '';
                                    if (enrollRecord) {
                                        if (enrollRecord.syncStatus === 'synced') statusLabel = ' (Enrolled)';
                                        else if (enrollRecord.syncStatus === 'needs_enrollment') statusLabel = ' (Pending)';
                                        else if (enrollRecord.syncStatus === 'needs_deletion' || enrollRecord.syncStatus === 'deleted') statusLabel = ' (Deleted)';
                                    } else {
                                        statusLabel = ' (Not Enrolled)';
                                    }
                                    return (
                                        <option key={m.id} value={m.id}>
                                            {m.fullName} ({m.phone}){statusLabel}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Assigned Device ID</label>
                            <div className="text-2xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg p-3 select-all">
                                #{selectedMemberId ? (enrollments.find(e => e.memberId === selectedMemberId)?.deviceUserId || assignedId) : '---'}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Enrollment Status</label>
                            <div className="flex items-center gap-2">
                                {(() => {
                                    if (!selectedMemberId) {
                                        return (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-500 border border-gray-200">
                                                ⚪ Not Enrolled
                                            </span>
                                        );
                                    }
                                    const enrollRecord = enrollments.find(e => e.memberId === selectedMemberId);
                                    if (enrollRecord) {
                                        if (enrollRecord.syncStatus === 'synced') {
                                            return (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                                                    🟢 Enrolled
                                                </span>
                                            );
                                        }
                                        if (enrollRecord.syncStatus === 'needs_enrollment') {
                                            return (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                    🟡 Pending Enrollment
                                                </span>
                                            );
                                        }
                                        if (enrollRecord.syncStatus === 'needs_deletion' || enrollRecord.syncStatus === 'deleted') {
                                            return (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                                                    🔴 Deleted
                                                </span>
                                            );
                                        }
                                    }
                                    
                                    if (enrollStep === 'pending') {
                                        return (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                🟡 Pending Enrollment
                                            </span>
                                        );
                                    }
                                    
                                    return (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-500 border border-gray-200">
                                            ⚪ Not Enrolled
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-2">
                            <h4 className="text-sm font-bold text-slate-800">Enrollment Process</h4>
                            <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2">
                                <li>Select Member</li>
                                <li>Note Assigned Device ID</li>
                                <li>Create same ID on K40</li>
                                <li>Enroll fingerprint</li>
                                <li>Click Confirm Enrollment</li>
                            </ol>
                        </div>

                        <div>
                            {(() => {
                                const enrollRecord = enrollments.find(e => e.memberId === selectedMemberId);
                                if (selectedMemberId && enrollRecord && enrollRecord.syncStatus !== 'deleted' && enrollRecord.syncStatus !== 'needs_deletion') {
                                    return (
                                        <button
                                            disabled
                                            className="w-full py-3 bg-gray-100 text-gray-400 rounded-lg text-sm font-bold cursor-not-allowed border border-gray-200"
                                        >
                                            Already Enrolled
                                        </button>
                                    );
                                }
                                
                                if (enrollStep === 'pending') {
                                    return (
                                        <button
                                            type="button"
                                            onClick={handleConfirmEnrollment}
                                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors cursor-pointer flex justify-center items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Confirm Enrollment
                                        </button>
                                    );
                                }

                                return (
                                    <button
                                        type="button"
                                        disabled={!selectedMemberId}
                                        onClick={handleStartEnrollment}
                                        className={clsx(
                                            "w-full py-3 text-white rounded-lg text-sm font-bold shadow-md transition-all flex justify-center items-center gap-2",
                                            selectedMemberId 
                                                ? "bg-indigo-600 hover:bg-indigo-700 cursor-pointer" 
                                                : "bg-gray-300 cursor-not-allowed shadow-none"
                                        )}
                                    >
                                        Start Enrollment
                                    </button>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                                <button
                                    onClick={() => setEnrollmentFilter('all')}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer",
                                        enrollmentFilter === 'all'
                                            ? "bg-indigo-600 border-indigo-600 text-white"
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    All ({enrollments.length})
                                </button>
                                <button
                                    onClick={() => setEnrollmentFilter('active')}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer",
                                        enrollmentFilter === 'active'
                                            ? "bg-indigo-600 border-indigo-600 text-white"
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    Active ({enrollments.filter(e => e.memberStatus === 'active').length})
                                </button>
                                <button
                                    onClick={() => setEnrollmentFilter('expired')}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer",
                                        enrollmentFilter === 'expired'
                                            ? "bg-indigo-600 border-indigo-600 text-white"
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    Expired ({enrollments.filter(e => e.memberStatus === 'expired').length})
                                </button>
                                <button
                                    onClick={() => setEnrollmentFilter('needs_enrollment')}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer",
                                        enrollmentFilter === 'needs_enrollment'
                                            ? "bg-indigo-600 border-indigo-600 text-white"
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    Re-Enroll ({enrollments.filter(e => e.syncStatus === 'needs_enrollment').length})
                                </button>
                                <button
                                    onClick={() => setEnrollmentFilter('needs_deletion')}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer",
                                        enrollmentFilter === 'needs_deletion'
                                            ? "bg-indigo-600 border-indigo-600 text-white"
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    Needs Deletion ({enrollments.filter(e => e.syncStatus === 'needs_deletion').length})
                                </button>
                            </div>

                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-gray-300 rounded-lg max-w-xs w-full shadow-sm">
                                <Search className="w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search enrollment..."
                                    className="bg-transparent border-none outline-none text-xs w-full"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Member Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Membership Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Remaining</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Device User ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sync Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {filteredEnrollments.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                                                No enrollments found matching the filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEnrollments.map((enroll) => {
                                            const subInfo = getDaysRemainingForMember(enroll.memberId);
                                            return (
                                                <tr key={enroll.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{enroll.memberName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={clsx(
                                                            "px-2.5 py-0.5 rounded-full text-xs font-semibold border inline-flex items-center",
                                                            enroll.memberStatus === 'active' && "bg-green-50 text-green-700 border-green-200",
                                                            enroll.memberStatus === 'expired' && "bg-red-50 text-red-700 border-red-200",
                                                            enroll.memberStatus === 'inactive' && "bg-gray-100 text-gray-600 border-gray-200"
                                                        )}>
                                                            {enroll.memberStatus === 'active' ? 'Active' : 
                                                             enroll.memberStatus === 'expired' ? 'Expired' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className={clsx(
                                                        "px-6 py-4 whitespace-nowrap text-sm font-medium",
                                                        subInfo.days <= 0 && "text-red-600",
                                                        subInfo.days > 0 && subInfo.days <= 7 && "text-amber-600",
                                                        subInfo.days > 7 && "text-gray-600"
                                                    )}>
                                                        {subInfo.label}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{enroll.deviceUserId}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={clsx(
                                                            "px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 border",
                                                            enroll.syncStatus === 'synced' && "bg-green-50 text-green-700 border-green-200",
                                                            (enroll.syncStatus === 'needs_deletion' || enroll.syncStatus === 'needs_enrollment') && "bg-amber-50 text-amber-700 border-amber-200",
                                                            enroll.syncStatus === 'deleted' && "bg-red-50 text-red-700 border-red-200"
                                                        )}>
                                                            {enroll.syncStatus === 'synced' && 'Active'}
                                                            {(enroll.syncStatus === 'needs_deletion' || enroll.syncStatus === 'needs_enrollment') && 'Pending Sync'}
                                                            {enroll.syncStatus === 'deleted' && 'Deleted'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                        <button
                                                            onClick={() => handleUnlink(enroll.id)}
                                                            className="text-red-600 hover:text-red-900 transition-colors p-1 cursor-pointer"
                                                            title="Delete Mapping"
                                                        >
                                                            <Unlink className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: LOGS */}
            {activeTab === 'logs' && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-800">Biometric Access Audit Logs</h2>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Member Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Device User ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Device Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                                            No scan events recorded yet. Turn on the local sync agent or simulate scan events to test the flow.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(log.scanTimestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{log.memberName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{log.deviceUserId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.deviceName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={clsx(
                                                    "px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 border",
                                                    log.status === 'success' && "bg-green-50 text-green-700 border-green-200",
                                                    log.status === 'denied_no_plan' && "bg-red-50 text-red-700 border-red-200",
                                                    log.status === 'unknown_user' && "bg-amber-50 text-amber-700 border-amber-200",
                                                    log.status === 'failed' && "bg-red-50 text-red-700 border-red-200",
                                                    log.status === 'pending' && "bg-gray-100 text-gray-600"
                                                )}>
                                                    {log.status === 'success' && (
                                                        <>
                                                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                                            Access Granted
                                                        </>
                                                    )}
                                                    {log.status === 'denied_no_plan' && (
                                                        <>
                                                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                                                            Access Denied (No Active Plan)
                                                        </>
                                                    )}
                                                    {log.status === 'unknown_user' && (
                                                        <>
                                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                                            Unknown User Mapping
                                                        </>
                                                    )}
                                                    {log.status === 'failed' && (
                                                        <>
                                                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                                                            Scan Processing Failed
                                                        </>
                                                    )}
                                                    {log.status === 'pending' && 'Pending Verification'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Biometrics;
