import React, { useEffect, useState } from 'react';
import { Fingerprint, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getTodaysAttendance, checkInMember } from '../lib/api/attendance';
import { getBiometricEnrollments } from '../lib/api/biometrics';
import type { BiometricEnrollmentWithMember } from '../lib/api/biometrics';
import { clsx } from 'clsx';

const Attendance: React.FC = () => {
    const [identifier, setIdentifier] = useState('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [enrolledMembers, setEnrolledMembers] = useState<BiometricEnrollmentWithMember[]>([]);
    const [selectedDeviceUserId, setSelectedDeviceUserId] = useState<string>('');

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

    useEffect(() => {
        fetchLogs();
        fetchEnrolled();
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

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Attendance & Access</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Check-in Panel */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Fingerprint className="w-5 h-5 text-indigo-600" />
                        Quick Check-in
                    </h2>

                    <div className="space-y-6">
                        {/* Status Message */}
                        {status !== 'idle' && (
                            <div className={clsx(
                                "p-4 rounded-lg flex items-center gap-3",
                                status === 'success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            )}>
                                {status === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                <span className="font-medium">{message}</span>
                            </div>
                        )}

                        {/* Manual Entry */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Manual Entry (Phone / ID)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="Enter member phone number..."
                                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCheckIn('manual')}
                                />
                                <button
                                    onClick={() => handleCheckIn('manual')}
                                    disabled={loading || !identifier}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Check In
                                </button>
                            </div>
                        </div>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Or use biometrics</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        {/* Simulated Biometric Dropdown & Scan */}
                        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select Member Fingerprint</label>
                                <select
                                    value={selectedDeviceUserId}
                                    onChange={e => setSelectedDeviceUserId(e.target.value)}
                                    className="w-full p-2 border border-gray-300 bg-white rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
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
                            </div>

                            <button
                                onClick={() => handleCheckIn('fingerprint')}
                                disabled={loading || enrolledMembers.length === 0}
                                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 transition-all font-semibold flex items-center justify-center gap-2 group shadow-sm"
                            >
                                <Fingerprint className="w-4 h-4 text-indigo-200 group-hover:text-white group-hover:scale-115 transition-transform" />
                                Trigger Fingerprint Scan
                            </button>
                            <p className="text-[10px] text-center text-slate-400">Requires local sync agent running on port 4371</p>
                        </div>
                    </div>
                </div>

                {/* Today's Stats / Info could go here, or just occupy full width with logs */}
                <div className="bg-indigo-600 p-6 rounded-xl shadow-sm text-white flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-2">Today's Stats</h3>
                        <p className="opacity-80">Real-time overview of gym usage.</p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm opacity-70">Total Check-ins</p>
                            <p className="text-4xl font-bold">{logs.length}</p>
                        </div>
                        <div>
                            <p className="text-sm opacity-70">Peak Hour</p>
                            <p className="text-xl font-medium">06:00 PM - 07:00 PM</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
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
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
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
