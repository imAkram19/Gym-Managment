import React, { useEffect, useState } from 'react';
import { Search, Filter, RefreshCw, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { getSubscriptions, type SubscriptionWithMember } from '../lib/api/subscriptions';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

const Subscriptions: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<SubscriptionWithMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const data = await getSubscriptions();
            setSubscriptions(data);
        } catch (error) {
            console.error("Failed to fetch subscriptions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const filteredSubscriptions = subscriptions.filter(sub => {
        const matchesSearch = sub.memberName.toLowerCase().includes(search.toLowerCase()) ||
            sub.planName.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
                    <p className="text-gray-500">Monitor active plans and renewals.</p>
                </div>
                <button
                    onClick={fetchSubscriptions}
                    className="p-2 text-gray-600 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg hover:border-indigo-200"
                    title="Refresh List"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                        type="text"
                        placeholder="Search member or plan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="expiring">Expiring Soon</option>
                        <option value="expired">Expired</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading subscriptions...</td>
                                </tr>
                            ) : filteredSubscriptions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No subscriptions found.</td>
                                </tr>
                            ) : (
                                filteredSubscriptions.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link to={`/members/${sub.memberId}`} className="flex items-center gap-3 group">
                                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                                                    {sub.memberImage ? (
                                                        <img src={sub.memberImage} alt={sub.memberName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        sub.memberName.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{sub.memberName}</span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">{sub.planName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{sub.startDate}</div>
                                            <div className="text-xs text-gray-500">to {sub.endDate}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {sub.status === 'active' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                                {sub.status === 'expiring' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                                                {sub.status === 'expired' && <XCircle className="w-4 h-4 text-red-500" />}

                                                <span className={clsx(
                                                    "text-sm font-medium",
                                                    sub.status === 'active' && "text-green-700",
                                                    sub.status === 'expiring' && "text-amber-700",
                                                    sub.status === 'expired' && "text-red-700",
                                                )}>
                                                    {sub.status === 'active' && 'Active'}
                                                    {sub.status === 'expiring' && `Expiring in ${sub.remainingDays} days`}
                                                    {sub.status === 'expired' && 'Expired'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 font-bold">
                                            ₹{sub.price}
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

export default Subscriptions;
