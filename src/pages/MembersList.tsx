import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { AddMemberModal } from '../components/members/AddMemberModal';
import { getMembers } from '../lib/api/members';
import type { Member } from '../types';
import { clsx } from 'clsx';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const mapMember = (data: any): Member => ({
    id: data.id,
    fullName: data.full_name,
    email: data.email,
    phone: data.phone,
    gender: data.gender,
    dateOfBirth: data.date_of_birth,
    address: data.address,
    info: data.info,
    joinDate: data.join_date,
    status: data.status,
    imageUrl: data.image_url,
    deletedAt: data.deleted_at
});

const MembersList: React.FC = () => {
    const [searchParams] = useSearchParams();
    const filterParam = searchParams.get('filter');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);
    const [subscriptions, setSubscriptions] = useState<Record<string, { endDate: string; remainingDays: number; isActive: boolean }>>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'inactive' | 'expiring' | 'archived'>(() => {
        if (filterParam === 'expiring') return 'expiring';
        if (filterParam === 'expired') return 'expired';
        if (filterParam === 'active') return 'active';
        if (filterParam === 'archived') return 'archived';
        return 'all';
    });

    const fetchMembersData = async () => {
        setLoading(true);
        try {
            let fetchedMembers: Member[] = [];
            if (statusFilter === 'expiring') {
                const sevenDaysFromNow = new Date();
                sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
                const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];
                const todayStr = new Date().toISOString().split('T')[0];

                const { data: expiringSubs } = await supabase
                    .from('subscriptions')
                    .select('member_id')
                    .eq('is_active', true)
                    .lte('end_date', sevenDaysStr)
                    .gte('end_date', todayStr);

                const memberIds = expiringSubs?.map(s => s.member_id) || [];

                if (memberIds.length === 0) {
                    fetchedMembers = [];
                } else {
                    let query = supabase.from('members').select('*').in('id', memberIds);
                    if (search) {
                        query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
                    }
                    const { data, error } = await query;
                    if (error) throw error;
                    fetchedMembers = (data || []).map(mapMember);
                }
            } else {
                fetchedMembers = await getMembers(search, statusFilter);
            }

            setMembers(fetchedMembers);

            // Fetch subscriptions for these members to get expiration dates & remaining days
            if (fetchedMembers.length > 0) {
                const memberIds = fetchedMembers.map(m => m.id);
                const { data: subs, error: subsError } = await supabase
                    .from('subscriptions')
                    .select('member_id, end_date, is_active')
                    .in('member_id', memberIds)
                    .order('end_date', { ascending: false });

                if (subsError) throw subsError;

                const subsMap: Record<string, { endDate: string; remainingDays: number; isActive: boolean }> = {};
                subs?.forEach((sub: any) => {
                    const existing = subsMap[sub.member_id];
                    
                    const endDate = new Date(sub.end_date);
                    const today = new Date();
                    endDate.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);
                    const diffTime = endDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (!existing || (sub.is_active && !existing.isActive)) {
                        subsMap[sub.member_id] = {
                            endDate: sub.end_date,
                            remainingDays: diffDays,
                            isActive: sub.is_active
                        };
                    }
                });
                setSubscriptions(subsMap);
            } else {
                setSubscriptions({});
            }
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

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-gray-50">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Status:</span>
                    {(['all', 'active', 'expired', 'inactive', 'expiring', 'archived'] as const).map((filter) => {
                        const isActive = statusFilter === filter;
                        const labels: Record<string, string> = {
                            all: 'All',
                            active: 'Active',
                            expired: 'Expired',
                            inactive: 'Inactive',
                            expiring: 'Expiring Soon',
                            archived: 'Archived'
                        };
                        return (
                            <button
                                key={filter}
                                onClick={() => setStatusFilter(filter)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-sm",
                                    isActive
                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                {labels[filter]}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">WhatsApp</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Left</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Join Date</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading members...</td>
                                </tr>
                            ) : members.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No members found.</td>
                                </tr>
                            ) : (
                                members.map((member) => {
                                    const subInfo = subscriptions[member.id];
                                    return (
                                        <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link to={`/members/${member.id}`} className="flex items-center gap-3 group">
                                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold overflow-hidden group-hover:scale-105 transition-transform duration-200">
                                                        {member.imageUrl ? (
                                                            <img src={member.imageUrl} alt={member.fullName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            member.fullName.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{member.fullName}</p>
                                                        <p className="text-xs text-gray-500">{member.gender}</p>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-center">
                                                <div className="flex justify-center">
                                                    {member.phone ? (
                                                        <a
                                                            href={(() => {
                                                                let cleanPhone = member.phone.replace(/\D/g, '');
                                                                if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

                                                                const msg = member.status === 'expired'
                                                                    ? `🚨 *Hi ${member.fullName},*

*Your Iron Gym membership has expired.*

💪 *Your goals are waiting for you! Renew today and get back to crushing your workouts.*

✨ *Don't miss out on your routine, progress, and gym access.*

📞 *Reply or visit the front desk to renew.*

🔥 *Iron Gym Team*`
                                                                    : `⚡ *Hi ${member.fullName},*

🚨 *Your Iron Gym membership will expire soon.*

🏋️‍♂️ *Renew now to avoid any interruption in your workouts and gym access.*

💪 *Consistency is the key to results—keep the momentum going!*

🔥 *Iron Gym Team*`;

                                                                return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
                                                            })()}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-emerald-600 hover:text-emerald-700 p-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-sm w-9 h-9"
                                                            title={`Send WhatsApp Alert to ${member.phone}`}
                                                        >
                                                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.437 0 9.862-4.427 9.866-9.869.002-2.637-1.019-5.117-2.877-6.98C16.398 1.887 13.916.86 11.277.86c-5.44 0-9.866 4.428-9.87 9.871-.001 1.721.45 3.398 1.305 4.887l-.99 3.614 3.705-.972c1.428.777 2.9.18 4.63-.418zm10.377-6.68c-.27-.136-1.603-.79-1.854-.88-.25-.09-.432-.136-.614.136-.18.272-.7.88-.857 1.058-.157.178-.315.2-.585.064-1.547-.772-2.656-1.34-3.706-3.143-.277-.476.277-.442.793-1.472.086-.178.043-.334-.022-.47-.064-.136-.614-1.48-.84-2.027-.22-.53-.443-.457-.614-.466-.16-.008-.344-.01-.528-.01-.184 0-.485.07-.74.348-.253.278-.967.947-.967 2.308 0 1.36.99 2.673 1.127 2.862.137.188 1.947 2.974 4.718 4.167.658.283 1.173.453 1.574.58.662.21 1.266.18 1.743.11.53-.08 1.603-.655 1.83-1.258.226-.603.226-1.12.157-1.23-.07-.11-.258-.178-.528-.314z"/>
                                                            </svg>
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {subInfo ? (
                                                    <span className={clsx(
                                                        "px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center border shadow-sm",
                                                        subInfo.remainingDays < 0
                                                            ? "bg-red-50 text-red-700 border-red-200"
                                                            : subInfo.remainingDays <= 7
                                                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    )}>
                                                        {subInfo.remainingDays < 0 
                                                            ? `Expired (${Math.abs(subInfo.remainingDays)} days ago)` 
                                                            : `${subInfo.remainingDays} days left`
                                                        }
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.joinDate}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={clsx(
                                                    "px-2.5 py-1 text-xs font-semibold rounded-full border shadow-sm inline-flex items-center",
                                                    member.deletedAt
                                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                                        : member.status === 'active'
                                                            ? "bg-green-50 text-green-700 border-green-200"
                                                            : member.status === 'expired'
                                                                ? "bg-red-50 text-red-700 border-red-200"
                                                                : "bg-gray-50 text-gray-700 border-gray-200"
                                                )}>
                                                    {member.deletedAt ? 'Archived' : member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link to={`/members/${member.id}`} className="text-indigo-600 hover:text-indigo-900">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
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
