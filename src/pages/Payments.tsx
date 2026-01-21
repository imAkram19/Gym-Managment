import React, { useEffect, useState } from 'react';
import { Download, Banknote, CreditCard, Filter } from 'lucide-react';
import { getPayments } from '../lib/api/payments';

const Payments: React.FC = () => {
    // Default to current month
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPaymentData = async () => {
        setLoading(true);
        try {
            const data = await getPayments(startDate, endDate);
            setPayments(data || []);
        } catch (error) {
            console.error("Failed to load payments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPaymentData();
    }, [startDate, endDate]);

    const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const cashTotal = payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const onlineTotal = payments.filter(p => p.method !== 'cash').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payments & Reports</h1>
                    <p className="text-gray-500">Track revenue and payment history.</p>
                </div>
                {/* Export Button (Placeholder for now) */}
                <button className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium">
                    <Download className="w-4 h-4" />
                    Export Report
                </button>
            </div>

            {/* Filters & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Date Filter */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center gap-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        Date Range
                    </h3>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <span className="text-gray-400">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>
                </div>

                {/* Total Stats */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-indigo-600 p-6 rounded-xl shadow-sm text-white flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Banknote className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-indigo-100 text-sm font-medium">Total Revenue</p>
                            <h3 className="text-2xl font-bold mt-1">₹{totalRevenue.toLocaleString()}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div className="p-2 bg-green-50 w-fit rounded-lg">
                            <Banknote className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="mt-4">
                            <p className="text-gray-500 text-sm font-medium">Cash Collected</p>
                            <h3 className="text-2xl font-bold mt-1 text-gray-900">₹{cashTotal.toLocaleString()}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div className="p-2 bg-blue-50 w-fit rounded-lg">
                            <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="mt-4">
                            <p className="text-gray-500 text-sm font-medium">Online/UPI</p>
                            <h3 className="text-2xl font-bold mt-1 text-gray-900">₹{onlineTotal.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">Transaction History</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Member</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Method</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Note</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading payments...</td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No transactions found in this period.</td>
                                </tr>
                            ) : (
                                payments.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                            {p.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold">
                                                    {p.members?.full_name?.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-900">{p.members?.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                            ₹{p.amount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap capitalize text-gray-600">
                                            {p.method}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                                            {p.admin_note || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Payments;
