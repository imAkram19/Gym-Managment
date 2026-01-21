import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    CalendarCheck,
    Banknote,
    X,
    Dumbbell
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const navItems = [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'Members', path: '/members', icon: Users },
        { label: 'Subscriptions', path: '/subscriptions', icon: CreditCard },
        { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
        { label: 'Payments', path: '/payments', icon: Banknote },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={clsx(
                    "fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar Content */}
            <aside
                className={clsx(
                    "fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-30 transition-transform duration-300 lg:translate-x-0 lg:static",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <Dumbbell className="w-6 h-6 text-indigo-400" />
                        <span>PowerGym</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1 hover:bg-slate-800 rounded text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => {
                                if (window.innerWidth < 1024) onClose();
                            }}
                            className={({ isActive }) => clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                isActive
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer / User Info could go here */}
            </aside>
        </>
    );
};
