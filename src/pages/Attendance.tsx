import React, { useEffect, useState } from 'react';
import { Fingerprint, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getTodaysAttendance, checkInMember } from '../lib/api/attendance';
import { getBiometricEnrollments } from '../lib/api/biometrics';
import type { BiometricEnrollmentWithMember } from '../lib/api/biometrics';
import { clsx } from 'clsx';
import { supabase } from '../lib/supabase';

const Attendance: React.FC = () => {
    const [identifier, setIdentifier] = useState('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [enrolledMembers, setEnrolledMembers] = useState<BiometricEnrollmentWithMember[]>([]);
    const [selectedDeviceUserId, setSelectedDeviceUserId] = useState<string>('');
    const [expiringCount, setExpiringCount] = useState(0);

    const fetchLogs = async () => {
        const data = await getTodaysAttendance();
        setLogs(data);
    };

    const fetchEnrolled = async () => {
        try {
            const data = await getBiometricEnrollments();
            setEnrolledMembers(data);
            if (data.length > 0) {
                setSelectedDeviceUserId(data[0].deviceUserId.toString());
            }
        } catch (err) {
            console.error("Failed to load enrolled members for simulation", err);
        }
    };

    const fetchExpiringCount = async () => {
        try {
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];
            const todayStr = new Date().toISOString().split('T')[0];

            const { count, error } = await supabase
                .from('subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true)
                .lte('end_date', sevenDaysStr)
                .gte('end_date', todayStr);

            if (!error && count !== null) {
                setExpiringCount(count);
            }
        } catch (err) {
            console.error("Failed to fetch expiring count", err);
        }
    };

    useEffect(() => {
        fetchLogs();
        fetchEnrolled();
        fetchExpiringCount();
    }, []);

    const handleCheckIn = async (method: 'manual' | 'fingerprint') => {
        if (!identifier && method === 'manual') return;

        setLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            if (method === 'fingerprint') {
                if (!selectedDeviceUserId) {
                    throw new Error("No members are enrolled in biometrics. Please enroll a member first.");
                }

                // Call the local simulator agent running on reception PC (localhost:4371)
                try {
                    const response = await fetch('http://localhost:4371/simulate-scan', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ deviceUserId: parseInt(selectedDeviceUserId, 10) })
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        setStatus('success');
                        setMessage(result.message || "Simulated check-in successful!");
                    } else {
                        setStatus('error');
                        setMessage(result.message || "Access denied by biometric agent.");
                    }
                } catch (netErr) {
                    throw new Error("Unable to connect to local sync agent. Please ensure you have run 'npm start' inside the 'sync-agent/' directory on port 4371.");
                }
            } else {
                const result = await checkInMember(identifier, method);
                setStatus('success');
                setMessage(`Welcome, ${result.memberName}!`);
                setIdentifier('');
            }
            fetchLogs(); // Refresh list
            fetchExpiringCount(); // Refresh expiring count
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || "Check-in failed");
        } finally {
            setLoading(false);
            // Clear status after 5 seconds for simulator messages
            setTimeout(() => {
                setStatus('idle');
                setMessage('');
            }, 5000);
        }
    };

    const getPeakHour = (logs: any[]) => {
        if (!logs || logs.length === 0) return 'N/A';
        const hourCounts: { [key: number]: number } = {};
        logs.forEach(log => {
            if (!log.check_in_time) return;
            const parts = log.check_in_time.split(':');
            if (parts.length > 0) {
                const hour = parseInt(parts[0], 10);
                if (!isNaN(hour)) {
                    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                }
            }
        });

        if (Object.keys(hourCounts).length === 0) return 'N/A';

        let peakHour = 6;
        let maxCount = 0;
        Object.keys(hourCounts).forEach(h => {
            const hour = parseInt(h, 10);
            if (hourCounts[hour] > maxCount) {
                maxCount = hourCounts[hour];
                peakHour = hour;
            }
        });
        const startHour = peakHour;
        const endHour = (peakHour + 1) % 24;
        const formatHour = (h: number) => {
            const ampm = h >= 12 ? 'PM' : 'AM';
            const displayHour = h % 12 || 12;
            return `${displayHour.toString().padStart(2, '0')}:00 ${ampm}`;
        };
        return `${formatHour(startHour)} - ${formatHour(endHour)}`;
    };

    const activePresentCount = logs.filter(log => log.members?.status === 'active').length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Attendance & Access</h1>
                <p className="text-gray-500 text-sm">Reception desk check-in system and real-time operations.</p>
            </div>

            {/* Row of 4 Compact Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Today's Check-ins */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Check-ins</p>
                    <p className="text-3xl font-bold mt-2 text-gray-900">{logs.length}</p>
                </div>
                
                {/* Active Members Present */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Members Present</p>
                    <p className="text-3xl font-bold mt-2 text-gray-900">{activePresentCount}</p>
                </div>

                {/* Peak Hour */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Peak Hour</p>
                    <p className="text-lg font-bold mt-3.5 text-gray-900 truncate">{getPeakHour(logs)}</p>
                </div>

                {/* Expiring Members */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiring Members</p>
                    <p className="text-3xl font-bold mt-2 text-gray-900">{expiringCount}</p>
                </div>
            </div>

            {/* Quick Check-In Panel (Full Width) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b border-gray-150 pb-3">
                    <Fingerprint className="w-5 h-5 text-indigo-600" />
                    Quick Check-in
                </h2>

                {/* Status Message */}
                {status !== 'idle' && (
                    <div className={clsx(
                        "p-4 rounded-lg flex items-center gap-3 border text-sm font-medium",
                        status === 'success' ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                    )}>
                        {status === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        <span>{message}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Left: Manual Entry */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Phone / Member ID</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="Enter member phone number or ID..."
                                className="flex-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                                onKeyDown={(e) => e.key === 'Enter' && handleCheckIn('manual')}
                            />
                            <button
                                onClick={() => handleCheckIn('manual')}
                                disabled={loading || !identifier}
                                className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm shadow-sm transition-colors cursor-pointer"
                            >
                                Check In
                            </button>
                        </div>
                    </div>

                    {/* Right: Fingerprint Scanner */}
                    <div className="space-y-3 border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0 md:pl-8">
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Fingerprint Scanner</label>
                        <div className="space-y-3">
                            <select
                                value={selectedDeviceUserId}
                                onChange={e => setSelectedDeviceUserId(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 bg-slate-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                                disabled={loading || enrolledMembers.length === 0}
                            >
                                {enrolledMembers.length === 0 ? (
                                    <option value="">No members enrolled yet</option>
                                ) : (
                                    enrolledMembers.map(m => (
                                        <option key={m.id} value={m.deviceUserId}>
                                            {m.memberName} (ID: {m.deviceUserId} - {m.memberStatus})
                                        </option>
                                    ))
                                )}
                            </select>

                            <button
                                onClick={() => handleCheckIn('fingerprint')}
                                disabled={loading || enrolledMembers.length === 0}
                                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 transition-all font-semibold flex items-center justify-center gap-2 group shadow-sm cursor-pointer"
                            >
                                <Fingerprint className="w-4 h-4 text-indigo-200 group-hover:text-white transition-transform" />
                                Trigger Fingerprint Scan
                            </button>
                            <p className="text-[10px] text-center text-slate-400">Requires local sync agent running on port 4371</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-500" />
                        Today's Logs
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Member</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Method</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No check-ins yet today.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                                            {log.check_in_time}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs overflow-hidden">
                                                    {log.members?.image_url ? (
                                                        <img src={log.members.image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        log.members?.full_name?.charAt(0) || '?'
                                                    )}
                                                </div>
                                                <span className="font-medium text-gray-900">{log.members?.full_name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 capitalize">
                                            {log.method}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 border border-green-200">
                                                Allowed
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
