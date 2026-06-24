import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Archive } from 'lucide-react';
import { archiveMember, permanentlyDeleteMemberImmediately } from '../../lib/api/members';
import type { Member, BiometricEnrollment } from '../../types';

interface DeleteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    member: Member;
    enrollment: BiometricEnrollment | null;
}

export const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    member,
    enrollment
}) => {
    const isAlreadyArchived = !!member.deletedAt;
    const [deleteType, setDeleteType] = useState<'archive' | 'permanent'>(
        isAlreadyArchived ? 'permanent' : 'archive'
    );
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    // Check for Owner/System record
    const isOwnerOrSystem = () => {
        const nameLower = member.fullName.toLowerCase();
        const emailLower = (member.email || '').toLowerCase();
        return (
            nameLower.includes('owner') ||
            nameLower.includes('system') ||
            nameLower.includes('admin') ||
            emailLower.includes('owner') ||
            emailLower.includes('system') ||
            emailLower.includes('admin')
        );
    };

    const isBlocked = isOwnerOrSystem();

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (confirmText !== 'DELETE' || isBlocked) return;

        setLoading(true);
        setError('');

        try {
            if (deleteType === 'archive') {
                await archiveMember(member.id, enrollment?.id);
                alert('Member archived successfully.');
            } else {
                // Permanently delete member from database immediately.
                // Cascading foreign keys will delete subscriptions, payments, attendance, biometrics.
                // The delete trigger on biometrics enrollment will handle log deletion and hardware queueing.
                await permanentlyDeleteMemberImmediately(member.id);
                alert('Member permanently deleted successfully.');
            }
            onSuccess();
        } catch (err: any) {
            console.error('Failed to perform member action:', err);
            setError(err.message || 'Action failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden transform transition-all">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-slate-50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-red-600" />
                        Delete Member
                    </h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleAction} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-semibold">
                            {error}
                        </div>
                    )}

                    {isBlocked && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">Security Override:</span>
                                <p className="mt-1 font-medium">This profile is designated as an Owner or System Admin account and cannot be deleted or archived.</p>
                            </div>
                        </div>
                    )}

                    {/* Member Profile info */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Member Name</p>
                        <p className="text-lg font-bold text-slate-800 mt-1">{member.fullName}</p>
                        {member.phone && <p className="text-xs text-slate-500 mt-0.5">{member.phone}</p>}
                    </div>

                    {/* Option Selector (Hidden if already archived) */}
                    {!isAlreadyArchived && !isBlocked && (
                        <div className="space-y-3">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Action</label>
                            <div className="grid grid-cols-1 gap-3">
                                {/* Option A: Archive */}
                                <label className={`border rounded-xl p-4 flex items-start gap-3 cursor-pointer transition-all hover:bg-slate-50/50 ${
                                    deleteType === 'archive' ? 'border-indigo-600 bg-indigo-50/20' : 'border-gray-200'
                                }`}>
                                    <input
                                        type="radio"
                                        name="deleteType"
                                        checked={deleteType === 'archive'}
                                        onChange={() => setDeleteType('archive')}
                                        className="mt-1 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                            <Archive className="w-4 h-4 text-indigo-500" />
                                            Archive Member (Recommended)
                                        </span>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Soft-deletes the member. Restricts gym access and hides the profile from all active lists, but preserves payment audits, attendance history, and plans. Restorability is maintained.
                                        </p>
                                    </div>
                                </label>

                                {/* Option B: Permanent Delete */}
                                <label className={`border rounded-xl p-4 flex items-start gap-3 cursor-pointer transition-all hover:bg-slate-50/50 ${
                                    deleteType === 'permanent' ? 'border-red-600 bg-red-50/20' : 'border-gray-200'
                                }`}>
                                    <input
                                        type="radio"
                                        name="deleteType"
                                        checked={deleteType === 'permanent'}
                                        onChange={() => setDeleteType('permanent')}
                                        className="mt-1 text-red-600 focus:ring-red-500"
                                    />
                                    <div>
                                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                            Permanently Delete
                                        </span>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Permanently removes the member profile and sweeps all subscriptions, payment history, attendance, and biometric records. This cannot be undone.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Biometric Warning Card */}
                    {enrollment && !isBlocked && (
                        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">ZK Hardware Sync Active:</span>
                                <p className="mt-1 font-medium">
                                    This member is mapped to K40 Device ID <span className="font-bold text-sm bg-white px-1 border border-amber-300 rounded">{enrollment.deviceUserId}</span>. 
                                    {deleteType === 'archive' 
                                        ? ' Archiving will schedule immediate biometric removal from the device memory.' 
                                        : ' Deleting the member will schedule removal from the biometric device first, and physically purge the DB records after sync completes.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Safety Confirmation Text */}
                    {!isBlocked && (
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase">
                                Type <span className="text-red-600 font-extrabold select-all">DELETE</span> to confirm
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type DELETE"
                                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-sm font-semibold text-gray-900"
                                disabled={loading}
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={confirmText !== 'DELETE' || loading || isBlocked}
                            className={`px-4 py-2 text-white rounded-lg font-semibold text-sm shadow flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
                                deleteType === 'permanent' 
                                    ? 'bg-red-600 hover:bg-red-700' 
                                    : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                        >
                            <Trash2 className="w-4 h-4" />
                            {loading ? 'Processing...' : deleteType === 'archive' ? 'Archive Member' : 'Permanently Delete'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
