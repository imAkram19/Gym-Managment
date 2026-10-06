import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ActivityChartProps {
    data: any[];
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
    return (
        <div className="p-px rounded-2xl bg-slate-200/80 shadow-xs overflow-hidden h-full">
            <div className="bg-white rounded-[15px] p-4 sm:p-5 h-full flex flex-col justify-between">
                <div className="mb-4">
                    <h4 className="text-base font-bold text-slate-900 tracking-tight">
                        Revenue Trajectory
                    </h4>
                    <p className="text-xs text-slate-500">
                        Monthly collections and membership earning trends
                    </p>
                </div>
                <div className="h-56 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748B', fontSize: 11 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748B', fontSize: 11 }}
                            />
                            <Tooltip
                                cursor={{ fill: '#F1F5F9' }}
                                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                            />
                            <Bar
                                dataKey="revenue"
                                fill="#2563EB"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={36}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
