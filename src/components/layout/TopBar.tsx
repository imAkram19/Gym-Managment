import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User, CheckCircle } from 'lucide-react';

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
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleMarkSingleRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
                    aria-label="Toggle menu"
                >
                    <Menu className="w-6 h-6 text-gray-600" />
                </button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative" ref={notificationRef}>
                    <button
                        className="p-2 hover:bg-gray-100 rounded-full relative"
                        onClick={() => setShowNotifications(!showNotifications)}
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5 text-gray-600" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                            <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-800">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={handleMarkAllRead}
                                        className="text-xs text-indigo-600 cursor-pointer hover:underline font-medium bg-transparent border-none outline-none"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-gray-500">
                                        <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                        <p>No notifications</p>
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
                                                    {!n.read && (
                                                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition-colors">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                        <User className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">Admin</span>
                </div>
            </div>
        </header>
    );
};


