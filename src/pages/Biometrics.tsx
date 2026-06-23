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
import type { BiometricDevice, Member } from '../types';
import { clsx } from 'clsx';

const Biometrics: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'devices' | 'enrollments' | 'logs'>('devices');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Devices State
    const [devices, setDevices] = useState<BiometricDevice[]>([]);
    const [showAddDevice, setShowAddDevice] = useState(false);
    const [deviceName, setDeviceName] = useState('');
    const [deviceIp, setDeviceIp] = useState('192.168.1.201');
    const [devicePort, setDevicePort] = useState(4370);

    // Enrollments State
    const [enrollments, setEnrollments] = useState<BiometricEnrollmentWithMember[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [deviceUserId, setDeviceUserId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Logs State
    const [logs, setLogs] = useState<BiometricAttendanceLogWithDevice[]>([]);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            if (activeTab === 'devices') {
                const data = await getBiometricDevices();
                setDevices(data);
            } else if (activeTab === 'enrollments') {
                const [enrollData, memberData] = await Promise.all([
                    getBiometricEnrollments(),
                    getMembers()
                ]);
                setEnrollments(enrollData);
                setMembers(memberData);
            } else if (activeTab === 'logs') {
                const logData = await getBiometricAttendanceLogs();
                setLogs(logData);
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

    const handleEnroll = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMemberId || !deviceUserId) return;
        setErrorMsg('');
        setSuccessMsg('');
        try {
            const parsedUserId = parseInt(deviceUserId, 10);
            if (isNaN(parsedUserId)) {
                throw new Error('Device User ID must be a valid number.');
            }
            await enrollMemberBiometrics(selectedMemberId, parsedUserId);
            setSuccessMsg('Member enrolled successfully!');
            setSelectedMemberId('');
            setDeviceUserId('');
            loadData();
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to enroll member.');
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
            if (activeTab === 'enrollments') {
                loadData();
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Sync failed.');
        } finally {
            setLoading(false);
        }
    };

    // Filter members that are not enrolled yet
    const enrolledMemberIds = new Set(enrollments.map(e => e.memberId));
    const nonEnrolledMembers = members.filter(m => !enrolledMemberIds.has(m.id));

    // Filtered enrollments for search
    const filteredEnrollments = enrollments.filter(e => 
        e.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.deviceUserId.toString().includes(searchQuery)
    );

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
                        className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium shadow-sm transition-colors"
                    >
                        <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
                        Sync Expired Members
                    </button>
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 shadow-sm"
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
                            Devices ({devices.length})
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
                            Fingerprint Map ({enrollments.length})
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
                            Live Scan Logs ({logs.length})
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
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
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
                                    className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg text-sm hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 font-semibold"
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
                                        <tr key={device.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{device.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{device.ipAddress}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{device.port}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={clsx(
                                                    "px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1",
                                                    device.status === 'online' 
                                                        ? "bg-green-50 text-green-700" 
                                                        : "bg-gray-100 text-gray-600"
                                                )}>
                                                    <span className={clsx("w-1.5 h-1.5 rounded-full", device.status === 'online' ? "bg-green-500" : "bg-gray-400")}></span>
                                                    {device.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {device.lastPing ? new Date(device.lastPing).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <button
                                                    onClick={() => handleDeleteDevice(device.id)}
                                                    className="text-red-600 hover:text-red-900 transition-colors p-1"
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
                    {/* Enrollment form */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Link className="w-5 h-5 text-indigo-600" />
                            Enroll Fingerprint
                        </h2>
                        <form onSubmit={handleEnroll} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Gym Member</label>
                                <select
                                    value={selectedMemberId}
                                    onChange={e => setSelectedMemberId(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">-- Choose Member --</option>
                                    {nonEnrolledMembers.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.fullName} ({m.phone}) [{m.status}]
                                        </option>
                                    ))}
                                </select>
                                {nonEnrolledMembers.length === 0 && (
                                    <p className="text-xs text-gray-500 mt-1">All members are currently enrolled.</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Device User ID (Keypad ID)</label>
                                <input
                                    type="number"
                                    value={deviceUserId}
                                    onChange={e => setDeviceUserId(e.target.value)}
                                    placeholder="e.g. 101"
                                    min="1"
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">The numeric user ID assigned to their profile on the physical K40 keyboard.</p>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold transition-colors"
                            >
                                Map Fingerprint ID
                            </button>
                        </form>
                    </div>

                    {/* Enrollments List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center gap-4">
                            <h2 className="text-lg font-bold text-gray-800">Fingerprint Enrollments</h2>
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
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Member Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Device User ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Enrolled At</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {filteredEnrollments.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                                                No enrollments found. Map a gym member to a keypad user ID using the panel on the left.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEnrollments.map((enroll) => (
                                            <tr key={enroll.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{enroll.memberName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={clsx(
                                                        "px-2 py-0.5 rounded-full text-xs font-semibold",
                                                        enroll.memberStatus === 'active' && "bg-green-50 text-green-700",
                                                        enroll.memberStatus === 'expired' && "bg-red-50 text-red-700",
                                                        enroll.memberStatus === 'inactive' && "bg-gray-100 text-gray-600"
                                                    )}>
                                                        {enroll.memberStatus.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{enroll.deviceUserId}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {enroll.enrolledAt ? new Date(enroll.enrolledAt).toLocaleDateString() : 'Unknown'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    <button
                                                        onClick={() => handleUnlink(enroll.id)}
                                                        className="text-red-600 hover:text-red-900 transition-colors p-1"
                                                        title="Delete Mapping"
                                                    >
                                                        <Unlink className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
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
                                        <tr key={log.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(log.scanTimestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{log.memberName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{log.deviceUserId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.deviceName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={clsx(
                                                    "px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1",
                                                    log.status === 'success' && "bg-green-50 text-green-700 border border-green-200",
                                                    log.status === 'denied_no_plan' && "bg-red-50 text-red-700 border border-red-200",
                                                    log.status === 'unknown_user' && "bg-amber-50 text-amber-700 border border-amber-200",
                                                    log.status === 'failed' && "bg-red-50 text-red-700 border border-red-200",
                                                    log.status === 'pending' && "bg-gray-100 text-gray-600"
                                                )}>
                                                    {log.status === 'success' && (
                                                        <>
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            Access Granted
                                                        </>
                                                    )}
                                                    {log.status === 'denied_no_plan' && (
                                                        <>
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            Access Denied (No Active Plan)
                                                        </>
                                                    )}
                                                    {log.status === 'unknown_user' && (
                                                        <>
                                                            <AlertTriangle className="w-3.5 h-3.5" />
                                                            Unknown User Mapping
                                                        </>
                                                    )}
                                                    {log.status === 'failed' && (
                                                        <>
                                                            <XCircle className="w-3.5 h-3.5" />
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
