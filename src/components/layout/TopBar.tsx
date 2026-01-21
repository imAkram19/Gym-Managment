import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, User, CheckCircle } from 'lucide-react';

interface TopBarProps {
    onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

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

                <div className="hidden md:flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg w-64">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search members..."
                        className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-400 text-gray-700"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative" ref={notificationRef}>
                    <button
                        className="p-2 hover:bg-gray-100 rounded-full relative"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell className="w-5 h-5 text-gray-600" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                            <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-800">Notifications</h3>
                                <span className="text-xs text-indigo-600 cursor-pointer hover:underline">Mark all read</span>
                            </div>
                            <div className="px-4 py-8 text-center text-gray-500">
                                <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                <p>No new notifications</p>
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

