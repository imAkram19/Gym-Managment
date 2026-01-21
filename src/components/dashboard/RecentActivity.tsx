import React from 'react';
import { User } from 'lucide-react';

interface ActivityItem {
    id: string;
    member: string;
    avatar?: string;
    action: string;
    time: string;
}

interface RecentActivityProps {
    activities: ActivityItem[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-4">
                {activities.length === 0 ? (
                    <p className="text-gray-400 text-sm">No recent activity.</p>
                ) : (
                    activities.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                {item.avatar ? (
                                    <img src={item.avatar} alt={item.member} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {item.member} <span className="text-gray-500 font-normal">{item.action}</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
