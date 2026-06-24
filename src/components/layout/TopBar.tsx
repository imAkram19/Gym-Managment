import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, CheckCircle, AlertCircle, X, WifiOff, LogOut, Fingerprint } from 'lucide-react';
import { getBiometricDevices } from '../../lib/api/biometrics';
import type { BiometricDevice } from '../../types';

interface TopBarProps {
    onMenuClick: () => void;
}

interface NotificationItem {
    id: string;
    text: string;
    time: string;
    read: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
    { id: '1', text: 'New biometric enrollment pending for Device ID 105', time: '5m ago', read: false },
    { id: '2', text: 'Monthly revenue target achieved!', time: '1h ago', read: false },
    { id: '3', text: 'System backup completed successfully', time: '2h ago', read: true }
];

// Format last ping time as a human-readable "X min ago"
function formatLastPing(lastPing: string | undefined): string {
    if (!lastPing) return 'Never';
    const diffMs = Date.now() - new Date(lastPing).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
        try {
            const saved = localStorage.getItem('gym_notifications');
            return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
        } catch {
            return DEFAULT_NOTIFICATIONS;
        }
    });

    // Device state
    const [devices, setDevices] = useState<BiometricDevice[]>([]);
    const [showTroubleshooting, setShowTroubleshooting] = useState(false);
    // Used to force re-render of "X min ago" display every minute
    const [, setTick] = useState(0);

    // Poll devices every 60 seconds
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const data = await getBiometricDevices();
                setDevices(data);
            } catch {
                // silently fail
            }
        };
        fetchDevices();
        const interval = setInterval(fetchDevices, 60_000);
        return () => clearInterval(interval);
    }, []);

    // Refresh "X min ago" display every minute
    useEffect(() => {
        const tick = setInterval(() => setTick(t => t + 1), 60_000);
        return () => clearInterval(tick);
    }, []);

    // Sync-agent writes last_ping every 5 minutes.
    // Use 10-minute threshold (2 missed heartbeats) to avoid false positives.
    // Primary signal is d.status === 'offline' set immediately on K40 disconnect.
    const OFFLINE_STALE_THRESHOLD_MS = 10 * 60 * 1000;

    const offlineDevices = devices.filter(d => {
        if (d.status === 'offline') return true;
        if (!d.lastPing) return true;
        return Date.now() - new Date(d.lastPing).getTime() > OFFLINE_STALE_THRESHOLD_MS;
    });


    // Pick the primary device to show in status pill (first device)
    const primaryDevice = devices[0] ?? null;
    const primaryIsOffline = primaryDevice
        ? offlineDevices.some(d => d.id === primaryDevice.id)
        : false;

    useEffect(() => {
        localStorage.setItem('gym_notifications', JSON.stringify(notifications));
    }, [notifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const handleClearAll = () => setNotifications([]);
    const handleMarkSingleRead = (id: string) =>
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    const handleLogout = () => {
        sessionStorage.removeItem('irongym_logged_in');
        localStorage.removeItem('irongym_owner_access');
        window.location.reload();
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                {/* Main TopBar row */}
                <div className="h-16 flex items-center justify-between px-4 gap-4">

                    {/* Left — hamburger (mobile) + Device Status Pill */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onMenuClick}
                            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
                            aria-label="Toggle menu"
                        >
                            <Menu className="w-6 h-6 text-gray-600" />
                        </button>

                        {/* ── Device Status Pill ── */}
                        {devices.length === 0 ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200">
                                <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
                                <span className="text-xs font-semibold text-gray-500 hidden sm:block">Checking device…</span>
                            </div>
                        ) : primaryIsOffline ? (
                            <button
                                onClick={() => setShowTroubleshooting(true)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                                title="Click to troubleshoot"
                            >
                                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
                                </span>
                                <WifiOff className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                <div className="hidden sm:flex flex-col items-start leading-none">
                                    <span className="text-[11px] font-bold text-red-700">{primaryDevice?.name ?? 'K40'}</span>
                                    <span className="text-[10px] text-red-500 font-medium">Offline · Tap to fix</span>
                                </div>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                                </span>
                                <Fingerprint className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                <div className="hidden sm:flex flex-col items-start leading-none">
                                    <span className="text-[11px] font-bold text-emerald-700">{primaryDevice?.name ?? 'K40'}</span>
                                    <span className="text-[10px] text-emerald-600 font-medium">Online · {formatLastPing(primaryDevice?.lastPing)}</span>
                                </div>
                            </div>
                        )}

                        {/* Multiple offline badge */}
                        {offlineDevices.length > 1 && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                                +{offlineDevices.length - 1} offline
                            </span>
                        )}
                    </div>

                    {/* Right — Notifications + Logout */}
                    <div className="flex items-center gap-3 ml-auto">

                        {/* ── Notifications ── */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                className="p-2 hover:bg-gray-100 rounded-full relative"
                                onClick={() => setShowNotifications(!showNotifications)}
                                aria-label="Notifications"
                            >
                                <Bell className="w-5 h-5 text-gray-600" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[9px] font-bold text-white flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                                        <div className="flex gap-2">
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={handleMarkAllRead}
                                                    className="text-xs text-indigo-600 cursor-pointer hover:underline font-semibold bg-transparent border-none outline-none"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                            {notifications.length > 0 && (
                                                <button
                                                    onClick={handleClearAll}
                                                    className="text-xs text-red-600 cursor-pointer hover:underline font-semibold bg-transparent border-none outline-none"
                                                >
                                                    Clear all
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-gray-500">
                                                <CheckCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                                <p className="text-sm">No notifications</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-50">
                                                {notifications.map((n) => (
                                                    <div
                                                        key={n.id}
                                                        onClick={() => handleMarkSingleRead(n.id)}
                                                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? 'bg-indigo-50/30' : ''}`}
                                                    >
                                                        <p className={`text-sm text-gray-800 ${!n.read ? 'font-medium' : ''}`}>{n.text}</p>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-[10px] text-gray-400">{n.time}</span>
                                                            {!n.read && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Logout ── */}
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-red-50 hover:text-red-600 text-gray-500 rounded-full transition-colors"
                            title="Log out"
                            aria-label="Log out"
                        >
                            <LogOut className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Troubleshooting Popup Modal */}
            {showTroubleshooting && (
                <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                        <div className="p-5 bg-red-600 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                <h3 className="font-bold text-lg">Biometric Device Troubleshooting</h3>
                            </div>
                            <button
                                onClick={() => setShowTroubleshooting(false)}
                                className="text-white/80 hover:text-white p-1 hover:bg-red-700 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-600 font-normal">
                            <p className="font-semibold text-slate-800">If the K40 Fingerprint reader shows "offline" status, follow these steps in order:</p>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
                                    <div>
                                        <p className="font-bold text-slate-800">Check Hardware Power &amp; Screen</p>
                                        <p className="text-xs text-slate-500">Verify the ZKTeco K40 device is powered ON. If the screen is black, check the power adapter plug.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
                                    <div>
                                        <p className="font-bold text-slate-800">Verify Physical Network Cable</p>
                                        <p className="text-xs text-slate-500">Ensure the Ethernet cable is securely plugged into both the K40 and the router. Look for a flashing green link light on the ethernet port.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
                                    <div>
                                        <p className="font-bold text-slate-800">Verify local Sync Agent status on PC</p>
                                        <p className="text-xs text-slate-500 font-medium">On the receptionist's PC, open PowerShell/Command Prompt and run:</p>
                                        <code className="bg-slate-100 text-red-600 px-1.5 py-0.5 rounded font-mono text-[11px] block mt-1">pm2 status</code>
                                        <p className="text-xs text-slate-500 mt-2">If <code className="font-mono bg-slate-50 text-indigo-600 px-1 rounded">zkteco-sync-agent</code> is stopped, run:</p>
                                        <code className="bg-slate-100 text-red-600 px-1.5 py-0.5 rounded font-mono text-[11px] block mt-1">pm2 start zkteco-sync-agent</code>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">4</span>
                                    <div>
                                        <p className="font-bold text-slate-800">Test Local Ping Connection</p>
                                        <p className="text-xs text-slate-500">On the PC, run <code className="font-mono bg-slate-50 text-indigo-600 px-1 rounded">ping 192.168.1.5</code>. Request timeouts mean the router has blocked or reassigned the device IP.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">5</span>
                                    <div>
                                        <p className="font-bold text-slate-800">Inspect Real-time Error Logs</p>
                                        <p className="text-xs text-slate-500">Run <code className="bg-slate-100 text-red-600 px-1.5 py-0.5 rounded font-mono text-[11px]">pm2 logs zkteco-sync-agent</code> or check <code className="font-mono">sync-agent/logs/errors.log</code>.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setShowTroubleshooting(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg shadow-sm transition-colors text-xs border-none cursor-pointer"
                            >
                                Close Guide
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
