import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    color?: string; // Tailwind bg color class
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, trendUp, color = "bg-white" }) => {
    return (
        <div className={clsx("p-6 rounded-xl shadow-sm border border-gray-100", color)}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold mt-2 text-gray-900">{value}</h3>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg">
                    <Icon className="w-6 h-6 text-indigo-600" />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className={clsx("font-medium", trendUp ? "text-green-600" : "text-red-600")}>
                        {trend}
                    </span>
                    <span className="text-gray-400 ml-2">vs last month</span>
                </div>
            )}
        </div>
    );
};
