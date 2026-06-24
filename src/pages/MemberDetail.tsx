import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Calendar, Activity, Clock, Fingerprint, Link, Unlink, AlertTriangle } from 'lucide-react';
import { getMemberById, getMemberHistory, restoreMember } from '../lib/api/members';
import { getEnrollmentByMemberId, enrollMemberBiometrics, deleteBiometricEnrollment, checkDeviceUserIdMapping } from '../lib/api/biometrics';
import { expireSubscription } from '../lib/api/subscriptions';
import type { Member, Subscription, Payment, Attendance, BiometricEnrollment } from '../types';
import { clsx } from 'clsx';
import { supabase } from '../lib/supabase';

import { AddSubscriptionModal } from '../components/members/AddSubscriptionModal';
import { EditMemberModal } from '../components/members/EditMemberModal';
import { ExtendMembershipModal } from '../components/members/ExtendMembershipModal';
import { DeleteMemberModal } from '../components/members/DeleteMemberModal';

const MemberDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [member, setMember] = useState<Member | null>(null);
    const [history, setHistory] = useState<{
        subscriptions: Subscription[];
        payments: Payment[];
        attendance: Attendance[];
    }>({ subscriptions: [], payments: [], attendance: [] });
    const [activeTab, setActiveTab] = useState<'profile' | 'subscriptions' | 'payments' | 'attendance'>('profile');
    const [loading, setLoading] = useState(true);
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);

    // Biometric States
    const [enrollment, setEnrollment] = useState<BiometricEnrollment | null>(null);
    const [deviceUserIdInput, setDeviceUserIdInput] = useState('');
    const [biometricLoading, setBiometricLoading] = useState(false);
    const [biometricError, setBiometricError] = useState('');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const handleForceExpire = async () => {
        if (!confirm('Are you sure you want to FORCE EXPIRE this membership immediately? This will disable door access and mark the biometric enrollment for deletion.')) return;
        setLoading(true);
        try {
            // Update member status
            const { error: memberError } = await supabase
                .from('members')
                .update({ status: 'expired' })
                .eq('id', id);
            if (memberError) throw memberError;

            // Set all active subscriptions of this member to inactive and end_date to yesterday
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            const { error: subError } = await supabase
                .from('subscriptions')
                .update({ is_active: false, end_date: yesterdayStr })
                .eq('member_id', id)
                .eq('is_active', true);
            if (subError) throw subError;

            // Trigger sync
            const { error: syncError } = await supabase.rpc('sync_member_statuses');
            if (syncError) console.error('Failed to sync member statuses:', syncError);

            await loadData();
            alert('Membership force expired successfully. Biometric deletion command sent.');
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to force expire membership');
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async () => {
        if (!confirm('Are you sure you want to ACTIVATE this membership?')) return;
        setLoading(true);
        try {
            // Update member status to active
            const { error: memberError } = await supabase
                .from('members')
                .update({ status: 'active' })
                .eq('id', id);
            if (memberError) throw memberError;

            // If there's a latest subscription, activate it and set end date to a future date if expired
            const latestSub = history.subscriptions[0];
            if (latestSub) {
                const today = new Date();
                const endDate = new Date(latestSub.endDate);
                let newEndDate = latestSub.endDate;
                
                if (endDate < today) {
                    const futureDate = new Date();
                    futureDate.setMonth(futureDate.getMonth() + 1);
                    newEndDate = futureDate.toISOString().split('T')[0];
                }

                const { error: subError } = await supabase
                    .from('subscriptions')
                    .update({
                        is_active: true,
                        end_date: newEndDate,
                        start_date: today.toISOString().split('T')[0]
                    })
                    .eq('id', latestSub.id);
                if (subError) throw subError;
            } else {
                // If they have no subscription, insert a default monthly subscription
                const today = new Date();
                const futureDate = new Date();
                futureDate.setMonth(futureDate.getMonth() + 1);

                const { error: subError } = await supabase
                    .from('subscriptions')
                    .insert([{
                        member_id: id,
                        plan_name: 'Monthly',
                        price: 1000,
                        start_date: today.toISOString().split('T')[0],
                        end_date: futureDate.toISOString().split('T')[0],
                        is_active: true
                    }]);
                if (subError) throw subError;
            }

            // Trigger sync
            const { error: syncError } = await supabase.rpc('sync_member_statuses');
            if (syncError) console.error('Failed to sync member statuses:', syncError);

            await loadData();
            alert('Membership activated successfully.');
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to activate membership');
        } finally {
            setLoading(false);
        }
    };

    const loadData = async () => {
        if (!id) return;
        try {
            const memberData = await getMemberById(id);
            const historyData = await getMemberHistory(id);
            const enrollData = await getEnrollmentByMemberId(id);
            setMember(memberData);
            setHistory(historyData);
            setEnrollment(enrollData);
        } catch (error) {
            console.error("Failed to load member detail", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLinkBiometrics = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !deviceUserIdInput) return;
        setBiometricLoading(true);
        setBiometricError('');
        try {
            const parsedId = parseInt(deviceUserIdInput, 10);
            if (isNaN(parsedId) || !/^\d+$/.test(deviceUserIdInput)) {
                throw new Error('Device User ID must be a valid number.');
            }

            // Duplicate mapping check
            const mappingResult = await checkDeviceUserIdMapping(parsedId);
            if (mappingResult && mappingResult.mapped) {
                throw new Error(`Device User ID ${parsedId} is already mapped to ${mappingResult.memberName}.`);
            }

            const newEnroll = await enrollMemberBiometrics(id, parsedId);
            setEnrollment({
                id: newEnroll.id,
                memberId: id,
                deviceUserId: parsedId,
                syncStatus: newEnroll.sync_status || 'synced'
            });
            setDeviceUserIdInput('');
        } catch (err: any) {
            setBiometricError(err.message || 'Failed to link fingerprint.');
        } finally {
            setBiometricLoading(false);
        }
    };

    const handleUnlinkBiometrics = async () => {
        if (!enrollment) return;
        if (!confirm('Are you sure you want to remove this fingerprint mapping?')) return;
        setBiometricLoading(true);
        setBiometricError('');
        try {
            await deleteBiometricEnrollment(enrollment.id);
            setEnrollment(null);
        } catch (err: any) {
            setBiometricError(err.message || 'Failed to unlink fingerprint.');
        } finally {
            setBiometricLoading(false);
        }
    };

    const handleRestoreMember = async () => {
        if (!id) return;
        if (!confirm('Are you sure you want to RESTORE this member profile and active status?')) return;
        setIsRestoring(true);
        try {
            await restoreMember(id);
            alert('Member profile restored successfully.');
            await loadData();
        } catch (err: any) {
            console.error('Failed to restore member:', err);
            alert(err.message || 'Failed to restore member');
        } finally {
            setIsRestoring(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
    if (!member) return <div className="p-8 text-center text-gray-500">Member not found.</div>;

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate('/members')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                Back to Members
            </button>

            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-3xl font-bold">
                    {member.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-2xl font-bold text-gray-900">{member.fullName}</h1>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2 text-gray-500 text-sm">
                        <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {member.phone || 'No phone'}</span>
                        <span className="flex items-center gap-1 capitalize"><User className="w-4 h-4" /> {member.gender || 'N/A'}</span>
                        <span className={clsx(
                            "px-2.5 py-0.5 rounded-full font-semibold text-xs border uppercase self-center shadow-sm",
                            member.deletedAt 
                                ? "bg-purple-50 text-purple-700 border-purple-200" 
                                : member.status === 'active' 
                                ? "bg-green-50 text-green-700 border-green-200" 
                                : "bg-red-50 text-red-700 border-red-200"
                        )}>
                            {member.deletedAt ? 'Archived' : member.status}
                        </span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 md:self-center">
                    {member.deletedAt ? (
                        <>
                            <button 
                                onClick={handleRestoreMember}
                                disabled={isRestoring}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                            >
                                {isRestoring ? 'Restoring...' : 'Restore Member'}
                            </button>
                            <button 
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 font-semibold rounded-lg transition-colors"
                            >
                                Delete Member
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={() => setIsEditModalOpen(true)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
                            >
                                Edit Profile
                            </button>
                            {history.subscriptions.length > 0 && (
                                <button 
                                    onClick={() => setIsExtendModalOpen(true)}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    Extend Membership
                                </button>
                            )}
                            {member.status === 'active' ? (
                                <button 
                                    onClick={handleForceExpire}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    Force Expire
                                </button>
                            ) : (
                                <button 
                                    onClick={handleActivate}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                                >
                                    Activate Membership
                                </button>
                            )}
                            <button
                                onClick={() => setIsRenewModalOpen(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
                            >
                                Renew Plan
                            </button>
                            <button 
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 font-semibold rounded-lg transition-colors"
                            >
                                Delete Member
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                <div className="flex border-b border-gray-100">
                    {['profile', 'subscriptions', 'payments', 'attendance'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={clsx(
                                "flex-1 py-4 text-sm font-medium border-b-2 transition-colors",
                                activeTab === tab
                                    ? "border-indigo-600 text-indigo-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                            )}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {activeTab === 'profile' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InfoItem label="Address" value={member.address} icon={MapPin} />
                                <InfoItem label="Date of Birth" value={member.dateOfBirth} icon={Calendar} />
                                <InfoItem label="Join Date" value={member.joinDate} icon={Clock} />
                                <InfoItem label="Medical / Info" value={member.info} icon={Activity} />
                            </div>

                            {/* Biometric Mapping Card */}
                            <div className="pt-6 border-t border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                                    <Fingerprint className="w-5 h-5 text-indigo-600" />
                                    Biometric Mapping Status
                                </h3>
                                {enrollment ? (
                                    <div className="space-y-4">
                                        <div className={clsx(
                                            "border p-5 rounded-xl flex flex-col gap-4 transition-colors",
                                            enrollment.syncStatus === 'synced' && "bg-green-50 border-green-200",
                                            enrollment.syncStatus === 'needs_deletion' && "bg-amber-50 border-amber-200 animate-pulse",
                                            enrollment.syncStatus === 'deleted' && "bg-red-50 border-red-200",
                                            enrollment.syncStatus === 'needs_enrollment' && "bg-indigo-50 border-indigo-200"
                                        )}>
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                                                <div className="space-y-3 flex-grow">
                                                    <div>
                                                        <p className={clsx(
                                                            "text-base font-bold",
                                                            enrollment.syncStatus === 'synced' && "text-green-900",
                                                            enrollment.syncStatus === 'needs_deletion' && "text-amber-900",
                                                            enrollment.syncStatus === 'deleted' && "text-red-900",
                                                            enrollment.syncStatus === 'needs_enrollment' && "text-indigo-900"
                                                        )}>
                                                            {enrollment.syncStatus === 'synced' && 'Fingerprint Active'}
                                                            {enrollment.syncStatus === 'needs_deletion' && 'Membership Expired'}
                                                            {enrollment.syncStatus === 'deleted' && 'Membership already expired'}
                                                            {enrollment.syncStatus === 'needs_enrollment' && 'Re-Enrollment Required'}
                                                        </p>
                                                        <p className={clsx(
                                                            "text-xs mt-1 font-medium",
                                                            enrollment.syncStatus === 'synced' && "text-green-700",
                                                            enrollment.syncStatus === 'needs_deletion' && "text-amber-700",
                                                            enrollment.syncStatus === 'deleted' && "text-red-700",
                                                            enrollment.syncStatus === 'needs_enrollment' && "text-indigo-700"
                                                        )}>
                                                            {enrollment.syncStatus === 'synced' && `Member is mapped to Keypad ID ${enrollment.deviceUserId} and has active access to gym doors.`}
                                                            {enrollment.syncStatus === 'needs_deletion' && 'Member is not eligible for gym access. Biometric deletion has been scheduled.'}
                                                            {enrollment.syncStatus === 'deleted' && 'Access has been blocked automatically.'}
                                                            {enrollment.syncStatus === 'needs_enrollment' && `Subscription renewed! Please physically register fingerprint ID ${enrollment.deviceUserId} on the K40 device keypad.`}
                                                        </p>
                                                    </div>

                                                    {/* Status Badges Row */}
                                                    <div className="flex flex-wrap gap-4 pt-3 text-xs border-t border-dashed border-gray-200">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-gray-500">Device User ID:</span>
                                                            <span className="px-2 py-0.5 bg-white border border-gray-200 text-gray-800 rounded font-bold shadow-sm">
                                                                {enrollment.deviceUserId}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-gray-500">Sync Status:</span>
                                                            <span className={clsx(
                                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase border shadow-sm",
                                                                enrollment.syncStatus === 'synced' && "bg-green-100 text-green-800 border-green-300",
                                                                enrollment.syncStatus === 'needs_deletion' && "bg-amber-100 text-amber-800 border-amber-300",
                                                                enrollment.syncStatus === 'deleted' && "bg-red-100 text-red-800 border-red-300",
                                                                enrollment.syncStatus === 'needs_enrollment' && "bg-indigo-100 text-indigo-800 border-indigo-300 animate-pulse"
                                                            )}>
                                                                {enrollment.syncStatus === 'synced' && 'Synced'}
                                                                {enrollment.syncStatus === 'needs_deletion' && 'Syncing'}
                                                                {enrollment.syncStatus === 'deleted' && 'Blocked'}
                                                                {enrollment.syncStatus === 'needs_enrollment' && 'Pending Scan'}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-gray-500">Enrollment Status:</span>
                                                            <span className={clsx(
                                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase border shadow-sm",
                                                                enrollment.syncStatus === 'synced' && "bg-green-100 text-green-800 border-green-300",
                                                                enrollment.syncStatus === 'needs_deletion' && "bg-amber-100 text-amber-800 border-amber-300",
                                                                enrollment.syncStatus === 'deleted' && "bg-red-100 text-red-800 border-red-300",
                                                                enrollment.syncStatus === 'needs_enrollment' && "bg-indigo-100 text-indigo-800 border-indigo-300 animate-pulse"
                                                            )}>
                                                                {enrollment.syncStatus === 'synced' && 'Active'}
                                                                {enrollment.syncStatus === 'needs_deletion' && 'Pending Deletion'}
                                                                {enrollment.syncStatus === 'deleted' && 'Deleted'}
                                                                {enrollment.syncStatus === 'needs_enrollment' && 'Needs Re-Enroll'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleUnlinkBiometrics}
                                                    disabled={biometricLoading}
                                                    className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 font-semibold text-sm rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0 self-start sm:self-center shadow-sm"
                                                >
                                                    <Unlink className="w-4 h-4" />
                                                    Unlink Mapping
                                                </button>
                                            </div>
                                        </div>
                                        {enrollment.syncStatus === 'needs_enrollment' && (
                                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 flex items-start gap-2">
                                                <AlertTriangle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <span className="font-bold">Staff Instruction:</span>
                                                    <ol className="list-decimal pl-4 mt-1 space-y-1">
                                                        <li>Press M/OK on the ZKTeco K40 device.</li>
                                                        <li>Go to <span className="font-semibold">User Mgt</span> &gt; <span className="font-semibold">New User</span> (or edit user).</li>
                                                        <li>Set the User ID to <span className="font-bold text-sm bg-white px-1 border border-indigo-200 rounded">{enrollment.deviceUserId}</span>.</li>
                                                        <li>Scan the member's finger three times to enroll.</li>
                                                        <li>The sync agent will automatically detect the enrollment within 8 seconds and activate their door access.</li>
                                                    </ol>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 border border-gray-100 p-6 rounded-xl">
                                        <p className="text-sm font-medium text-gray-700">No Biometric Fingerprint Linked</p>
                                        <p className="text-xs text-gray-400 mt-1 mb-4">Enroll this member's fingerprint on the physical device, then enter their keypad ID below to link them.</p>
                                        
                                        <form onSubmit={handleLinkBiometrics} className="flex flex-col sm:flex-row gap-3 max-w-md">
                                            <input
                                                type="number"
                                                value={deviceUserIdInput}
                                                onChange={e => setDeviceUserIdInput(e.target.value)}
                                                placeholder="Enter Device User ID (e.g. 101)"
                                                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                required
                                                disabled={biometricLoading}
                                            />
                                            <button
                                                type="submit"
                                                disabled={biometricLoading || !deviceUserIdInput}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                            >
                                                <Link className="w-4 h-4" />
                                                Link Fingerprint
                                            </button>
                                        </form>
                                        {biometricError && (
                                            <p className="text-xs text-red-600 mt-2 font-medium">{biometricError}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'subscriptions' && (
                        <Table
                            headers={['Plan', 'Start Date', 'End Date', 'Price', 'Status', 'Actions']}
                            rows={history.subscriptions.map(sub => [
                                sub.planName,
                                sub.startDate,
                                sub.endDate,
                                `₹${sub.price}`,
                                <span className={clsx(
                                    "px-2 py-0.5 rounded-full text-xs font-semibold",
                                    sub.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                )}>
                                    {sub.isActive ? 'Active' : 'Expired'}
                                </span>,
                                sub.isActive ? (
                                    <button
                                        onClick={async () => {
                                            if (!confirm('Are you sure you want to expire this subscription immediately to test the access blocking?')) return;
                                            try {
                                                setLoading(true);
                                                await expireSubscription(sub.id);
                                                await loadData();
                                            } catch (err: any) {
                                                alert(err.message || 'Failed to expire subscription');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        className="px-2.5 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded font-semibold transition-colors"
                                    >
                                        Force Expire
                                    </button>
                                ) : '-'
                            ])}
                        />
                    )}

                    {activeTab === 'payments' && (
                        <Table
                            headers={['Date', 'Amount', 'Method', 'Note']}
                            rows={history.payments.map(pay => [
                                pay.date,
                                `₹${pay.amount}`,
                                pay.method.toUpperCase(),
                                pay.adminNote || '-'
                            ])}
                        />
                    )}

                    {activeTab === 'attendance' && (
                        <Table
                            headers={['Date', 'Time', 'Method']}
                            rows={history.attendance.map(att => [
                                att.date,
                                att.checkInTime,
                                att.method
                            ])}
                        />
                    )}
                </div>
            </div>

            <AddSubscriptionModal
                isOpen={isRenewModalOpen}
                onClose={() => setIsRenewModalOpen(false)}
                onSuccess={() => {
                    loadData(); // Refresh data
                    setActiveTab('subscriptions'); // Switch to subs tab
                }}
                memberId={id || ''}
            />

            {member && (
                <EditMemberModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={loadData}
                    member={member}
                    latestSubscription={history.subscriptions[0] || null}
                />
            )}

            {history.subscriptions.length > 0 && (
                <ExtendMembershipModal
                    isOpen={isExtendModalOpen}
                    onClose={() => setIsExtendModalOpen(false)}
                    onSuccess={loadData}
                    subscriptionId={history.subscriptions[0].id}
                    currentEndDate={history.subscriptions[0].endDate}
                />
            )}

            {isDeleteModalOpen && (
                <DeleteMemberModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    member={member}
                    enrollment={enrollment}
                    onSuccess={() => {
                        setIsDeleteModalOpen(false);
                        navigate('/members');
                    }}
                />
            )}
        </div>
    );
};

const InfoItem = ({ label, value, icon: Icon }: any) => (
    <div className="flex gap-3">
        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-gray-900">{value || 'Not provided'}</p>
        </div>
    </div>
);

const Table = ({ headers, rows }: { headers: string[], rows: (string | React.ReactNode)[][] }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-gray-100">
                    {headers.map(h => <th key={h} className="pb-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {rows.length === 0 ? (
                    <tr><td colSpan={headers.length} className="py-4 text-center text-gray-400">No history found.</td></tr>
                ) : (
                    rows.map((row, i) => (
                        <tr key={i}>
                            {row.map((cell, j) => <td key={j} className="py-3 text-sm text-gray-700">{cell}</td>)}
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

export default MemberDetail;
