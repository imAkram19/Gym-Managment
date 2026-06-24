import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HourlyTrafficChartProps {
    data: any[];
}

export const HourlyTrafficChart: React.FC<HourlyTrafficChartProps> = ({ data }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800">Hourly Gym Traffic</h3>
                <p className="text-xs text-gray-500">Based on fingerprint scan timestamps from the last 30 days.</p>
            </div>
            <div className="h-64 w-full">
                {data.length === 0 || data.every(d => d.count === 0) ? (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                        No scan traffic recorded in the last 30 days.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="hour"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 11 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 11 }}
                            />
                            <Tooltip
                                cursor={{ fill: '#F3F4F6' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value: any) => [`${value} visits`, 'Scans']}
                            />
                            <Bar
                                dataKey="count"
                                fill="#06B6D4" // cyan-500
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};
