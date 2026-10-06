import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HourlyTrafficChartProps {
    data: any[];
}

export const HourlyTrafficChart: React.FC<HourlyTrafficChartProps> = ({ data }) => {
    return (
        <div className="p-px rounded-2xl bg-slate-200/80 shadow-xs overflow-hidden h-full">
            <div className="bg-white rounded-[15px] p-4 sm:p-5 h-full flex flex-col justify-between">
                <div className="mb-4">
                    <h4 className="text-base font-bold text-slate-900 tracking-tight">
                        Hourly Footfall Distribution
                    </h4>
                    <p className="text-xs text-slate-500">
                        Peak workout hours based on biometric scans
                    </p>
                </div>
                <div className="h-56 sm:h-64 w-full">
                    {data.length === 0 || data.every(d => d.count === 0) ? (
                        <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                            No scan traffic recorded in the last 30 days.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="hour"
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
                                    formatter={(value: any) => [`${value} Scans`, 'Traffic']}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#0D9488"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={36}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};
