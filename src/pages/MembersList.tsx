import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { AddMemberModal } from '../components/members/AddMemberModal';
import { getMembers } from '../lib/api/members';
import type { Member } from '../types';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

const MembersList: React.FC = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'inactive'>('all');

    const fetchMembersData = async () => {
        setLoading(true);
        try {
            const data = await getMembers(search, statusFilter);
            setMembers(data);
        } catch (error) {
            console.error("Failed to fetch members", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(fetchMembersData, 300);
        return () => clearTimeout(debounce);
    }, [search, statusFilter]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Members</h1>
                    <p className="text-gray-500">Manage your gym members and subscriptions.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Member
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
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
                        <option value="expired">Expired</option>
                        <option value="inactive">Inactive</option>
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
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Join Date</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading members...</td>
                                </tr>
                            ) : members.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No members found.</td>
                                </tr>
                            ) : (
                                members.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                                                    {member.imageUrl ? (
                                                        <img src={member.imageUrl} alt={member.fullName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        member.fullName.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{member.fullName}</p>
                                                    <p className="text-xs text-gray-500">{member.gender}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.phone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.joinDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={clsx(
                                                "px-2 py-1 text-xs font-medium rounded-full",
                                                member.status === 'active' && "bg-green-100 text-green-700",
                                                member.status === 'expired' && "bg-red-100 text-red-700",
                                                member.status === 'inactive' && "bg-gray-100 text-gray-700",
                                            )}>
                                                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link to={`/members/${member.id}`} className="text-indigo-600 hover:text-indigo-900">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddMemberModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchMembersData}
            />
        </div>
    );
};

export default MembersList;
