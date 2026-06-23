import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Calendar, Activity, Clock, Fingerprint, Link, Unlink } from 'lucide-react';
import { getMemberById, getMemberHistory } from '../lib/api/members';
import { getEnrollmentByMemberId, enrollMemberBiometrics, deleteBiometricEnrollment } from '../lib/api/biometrics';
import type { Member, Subscription, Payment, Attendance, BiometricEnrollment } from '../types';
import { clsx } from 'clsx';

import { AddSubscriptionModal } from '../components/members/AddSubscriptionModal';

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

    // Biometric States
    const [enrollment, setEnrollment] = useState<BiometricEnrollment | null>(null);
    const [deviceUserIdInput, setDeviceUserIdInput] = useState('');
    const [biometricLoading, setBiometricLoading] = useState(false);
    const [biometricError, setBiometricError] = useState('');

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
            if (isNaN(parsedId)) throw new Error('Device User ID must be a valid number.');
            const newEnroll = await enrollMemberBiometrics(id, parsedId);
            setEnrollment({
                id: newEnroll.id,
                memberId: id,
                deviceUserId: parsedId
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
                        <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {member.phone}</span>
                        <span className="flex items-center gap-1 capitalize"><User className="w-4 h-4" /> {member.gender || 'N/A'}</span>
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium text-xs uppercase self-center">
                            {member.status}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Edit Profile</button>
                    <button
                        onClick={() => setIsRenewModalOpen(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Renew Plan
                    </button>
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
                                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-indigo-900">Fingerprint Enrolled</p>
                                            <p className="text-xs text-indigo-700 mt-0.5">This member is linked to Device User ID <span className="font-bold text-base">{enrollment.deviceUserId}</span> on the K40 keypad.</p>
                                        </div>
                                        <button
                                            onClick={handleUnlinkBiometrics}
                                            disabled={biometricLoading}
                                            className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 font-semibold text-sm rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            <Unlink className="w-4 h-4" />
                                            Unlink Fingerprint
                                        </button>
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
                            headers={['Plan', 'Start Date', 'End Date', 'Price', 'Status']}
                            rows={history.subscriptions.map(sub => [
                                sub.planName,
                                sub.startDate,
                                sub.endDate,
                                `₹${sub.price}`,
                                sub.isActive ? 'Active' : 'Expired'
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
