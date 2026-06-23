import React, { useState } from 'react';
import { X, Save, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ExtendMembershipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    subscriptionId: string;
    currentEndDate: string;
}

export const ExtendMembershipModal: React.FC<ExtendMembershipModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    subscriptionId,
    currentEndDate
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [extendType, setExtendType] = useState('1'); // months or 'custom'
    const [customEndDate, setCustomEndDate] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let finalEndDateStr = '';
            if (extendType === 'custom') {
                if (!customEndDate) {
                    throw new Error('Please select a custom end date.');
                }
                if (new Date(customEndDate) <= new Date(currentEndDate)) {
                    throw new Error('Custom end date must be after the current end date.');
                }
                finalEndDateStr = customEndDate;
            } else {
                const baseDate = new Date(currentEndDate);
                // If currentEndDate is in the past, let's start extending from today
                const start = baseDate < new Date() ? new Date() : baseDate;
                start.setMonth(start.getMonth() + Number(extendType));
                finalEndDateStr = start.toISOString().split('T')[0];
            }

            // Update subscription
            const { error: subError } = await supabase
                .from('subscriptions')
                .update({
                    end_date: finalEndDateStr,
                    is_active: true // Reactivate if it was expired
                })
                .eq('id', subscriptionId);

            if (subError) throw subError;

            // Trigger sync trigger
            const { error: syncError } = await supabase.rpc('sync_member_statuses');
            if (syncError) console.error('Failed to sync member statuses:', syncError);

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to extend membership');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Extend Membership</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-800 font-semibold">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            Extension Options
                        </div>

                        <div>
                            <p className="text-xs text-gray-500 mb-2">Current Subscription End Date: <span className="font-semibold text-gray-700">{currentEndDate}</span></p>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Extend By</label>
                            <select
                                value={extendType}
                                onChange={(e) => setExtendType(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                            >
                                <option value="1">1 Month</option>
                                <option value="3">3 Months</option>
                                <option value="6">6 Months</option>
                                <option value="12">1 Year</option>
                                <option value="custom">Custom End Date</option>
                            </select>
                        </div>

                        {extendType === 'custom' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Custom End Date *</label>
                                <input
                                    required
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    min={currentEndDate}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Processing...' : 'Extend'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
