import React, { useState } from 'react';
import { X, Save, Receipt } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AddSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    memberId: string;
}

export const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({ isOpen, onClose, onSuccess, memberId }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        planName: 'Monthly',
        price: '',
        durationMonths: 1,
        startDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        adminNote: ''
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Calculate End Date
            const startDate = new Date(formData.startDate);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + Number(formData.durationMonths));

            // 2. Create Subscription
            const { error: subError } = await supabase
                .from('subscriptions')
                .insert([{
                    member_id: memberId,
                    plan_name: formData.planName,
                    price: Number(formData.price),
                    start_date: formData.startDate,
                    end_date: endDate.toISOString().split('T')[0],
                    is_active: true
                }]);

            if (subError) throw subError;

            // 3. Create Payment
            const { error: payError } = await supabase
                .from('payments')
                .insert([{
                    member_id: memberId,
                    amount: Number(formData.price),
                    date: new Date().toISOString().split('T')[0],
                    method: formData.paymentMethod,
                    admin_note: "Plan Renewal: " + formData.adminNote,
                }]);

            if (payError) throw payError;

            // 4. Update Member Status to Active (if valid)
            const { error: memberError } = await supabase
                .from('members')
                .update({ status: 'active' })
                .eq('id', memberId);

            if (memberError) throw memberError;

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to add subscription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Renew Subscription</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-800 font-semibold">
                            <Receipt className="w-5 h-5 text-green-500" />
                            Plan Details
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                                <input
                                    required
                                    name="planName"
                                    value={formData.planName}
                                    onChange={handleChange}
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                <input
                                    required
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                <select
                                    name="durationMonths"
                                    value={formData.durationMonths}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                >
                                    <option value={1}>1 Month</option>
                                    <option value={3}>3 Months</option>
                                    <option value={6}>6 Months</option>
                                    <option value={12}>1 Year</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                    required
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    type="date"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI / Online</option>
                                    <option value="card">Card</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note</label>
                            <input
                                name="adminNote"
                                value={formData.adminNote}
                                onChange={handleChange}
                                placeholder="Optional..."
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                            />
                        </div>
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
                            {loading ? 'Processing...' : 'Confirm Renewal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
