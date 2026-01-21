import React, { useState } from 'react';
import { X, Save, User, Receipt } from 'lucide-react';
import { createMemberWithSubscription } from '../../lib/api/members';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        gender: 'male',
        dateOfBirth: '',
        address: '',
        info: '',
        // Subscription
        planName: 'Monthly',
        price: '',
        durationMonths: 1,
        startDate: new Date().toISOString().split('T')[0],
        // Payment
        paymentMethod: 'cash',
        adminNote: ''
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await createMemberWithSubscription(
                {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    gender: formData.gender as 'male' | 'female' | 'other',
                    dateOfBirth: formData.dateOfBirth,
                    address: formData.address,
                    info: formData.info,
                },
                {
                    planName: formData.planName,
                    price: Number(formData.price),
                    durationMonths: Number(formData.durationMonths),
                    startDate: formData.startDate,
                },
                {
                    amount: Number(formData.price), // Payment amount equals plan price for initial
                    method: formData.paymentMethod,
                    adminNote: formData.adminNote
                }
            );
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to create member');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">Add New Member</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Personal Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-500" />
                            Personal Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    required
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                <input
                                    required
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    type="tel"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                <input
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    type="date"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Subscription & Payment */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-green-500" />
                            Plan & Payment
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                                <input
                                    required
                                    name="planName"
                                    value={formData.planName}
                                    onChange={handleChange}
                                    placeholder="e.g. Monthly Gold"
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price (Amount) *</label>
                                <input
                                    required
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    type="number"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Months)</label>
                                <select
                                    name="durationMonths"
                                    value={formData.durationMonths}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                                <label className="block text-sm font-semibold text-gray-800 mb-2">Initial Payment</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                        <select
                                            name="paymentMethod"
                                            value={formData.paymentMethod}
                                            onChange={handleChange}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="upi">UPI / Online</option>
                                            <option value="card">Card</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                                        <input
                                            name="adminNote"
                                            value={formData.adminNote}
                                            onChange={handleChange}
                                            placeholder="Transaction ref..."
                                            type="text"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
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
                            {loading ? 'Creating...' : 'Create Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
