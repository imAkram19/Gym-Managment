import React from 'react';
import { Menu, Bell, Search, User } from 'lucide-react';

interface TopBarProps {
    onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
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
                <button className="p-2 hover:bg-gray-100 rounded-full relative">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

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
