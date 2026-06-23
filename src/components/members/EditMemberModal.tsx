import React, { useState, useEffect } from 'react';
import { X, Save, User, Receipt } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Member, Subscription } from '../../types';

interface EditMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    member: Member;
    latestSubscription: Subscription | null;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    member,
    latestSubscription
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Validation states
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isCheckingPhone, setIsCheckingPhone] = useState(false);

    // Plan Name Select State
    const [planNameSelect, setPlanNameSelect] = useState('Monthly');

    // Form State
    const [formData, setFormData] = useState({
        fullName: member.fullName || '',
        phone: member.phone || '',
        gender: member.gender || 'male',
        dateOfBirth: member.dateOfBirth || '',
        address: member.address || '',
        info: member.info || '',
        status: member.status || 'active',
        // Subscription
        planName: latestSubscription?.planName || 'Monthly',
        price: latestSubscription ? String(latestSubscription.price) : '',
        startDate: latestSubscription?.startDate || new Date().toISOString().split('T')[0],
        endDate: latestSubscription?.endDate || new Date().toISOString().split('T')[0],
    });

    // Detect common plan names
    useEffect(() => {
        if (latestSubscription) {
            const plan = latestSubscription.planName;
            if (['Monthly', 'Quarterly', 'Semi-Annually', 'Annually'].includes(plan)) {
                setPlanNameSelect(plan);
            } else {
                setPlanNameSelect('Custom');
            }
        }
    }, [latestSubscription]);

    // Validation rules
    const validate = (data: typeof formData) => {
        const newErrors: Record<string, string> = {};

        // Full Name
        if (!data.fullName.trim()) {
            newErrors.fullName = 'Full Name is required';
        } else if (data.fullName.trim().length < 3) {
            newErrors.fullName = 'Full Name must be at least 3 characters';
        } else if (data.fullName.trim().length > 100) {
            newErrors.fullName = 'Full Name must not exceed 100 characters';
        }

        // Phone
        if (!data.phone.trim()) {
            newErrors.phone = 'Phone Number is required';
        } else if (!/^\d+$/.test(data.phone)) {
            newErrors.phone = 'Phone Number must contain only numbers';
        } else if (data.phone.length !== 10) {
            newErrors.phone = 'Phone Number must be exactly 10 digits';
        }

        // Gender
        if (!data.gender) {
            newErrors.gender = 'Gender is required';
        }

        // Date of Birth
        if (data.dateOfBirth) {
            const dob = new Date(data.dateOfBirth);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (dob > today) {
                newErrors.dateOfBirth = 'Date of birth cannot be in the future';
            }
        }

        // Plan Name
        const actualPlanName = planNameSelect === 'Custom' ? data.planName : planNameSelect;
        if (!actualPlanName.trim()) {
            newErrors.planName = 'Plan Name is required';
        }

        // Price
        if (!data.price) {
            newErrors.price = 'Price is required';
        } else {
            const priceVal = Number(data.price);
            if (isNaN(priceVal) || priceVal <= 0) {
                newErrors.price = 'Price must be greater than 0';
            }
        }

        // Start Date
        if (!data.startDate) {
            newErrors.startDate = 'Start Date is required';
        }

        // End Date
        if (!data.endDate) {
            newErrors.endDate = 'End Date is required';
        } else if (data.startDate && new Date(data.endDate) <= new Date(data.startDate)) {
            newErrors.endDate = 'End Date must be greater than Start Date';
        }

        return newErrors;
    };

    // Check for duplicate phone number (excluding current member)
    useEffect(() => {
        const checkDuplicatePhone = async () => {
            if (/^\d{10}$/.test(formData.phone)) {
                setIsCheckingPhone(true);
                try {
                    const { data, error: dbError } = await supabase
                        .from('members')
                        .select('id')
                        .eq('phone', formData.phone)
                        .neq('id', member.id);
                    
                    if (dbError) throw dbError;
                    
                    if (data && data.length > 0) {
                        setErrors(prev => ({ ...prev, phone: 'Phone number is already registered' }));
                    } else {
                        setErrors(prev => {
                            const next = { ...prev };
                            delete next.phone;
                            return next;
                        });
                    }
                } catch (err) {
                    console.error('Error checking duplicate phone:', err);
                } finally {
                    setIsCheckingPhone(false);
                }
            }
        };

        checkDuplicatePhone();
    }, [formData.phone, member.id]);

    // Update validations on form change
    useEffect(() => {
        const syncErrors = validate(formData);
        setErrors(prev => {
            const merged = { ...syncErrors };
            // Preserve duplicate phone error if relevant
            if (prev.phone === 'Phone number is already registered' && /^\d{10}$/.test(formData.phone)) {
                merged.phone = prev.phone;
            }
            return merged;
        });
    }, [formData, planNameSelect]);

    if (!isOpen) return null;

    const handlePlanSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setPlanNameSelect(val);
        setFormData(prev => {
            const next = { ...prev };
            if (val !== 'Custom') {
                next.planName = val;
                
                // Recalculate end date based on selected standard plan
                let durationMonths = 1;
                if (val === 'Monthly') durationMonths = 1;
                else if (val === 'Quarterly') durationMonths = 3;
                else if (val === 'Semi-Annually') durationMonths = 6;
                else if (val === 'Annually') durationMonths = 12;

                try {
                    const start = new Date(next.startDate);
                    if (!isNaN(start.getTime())) {
                        start.setMonth(start.getMonth() + durationMonths);
                        next.endDate = start.toISOString().split('T')[0];
                    }
                } catch (err) {
                    // ignore
                }
            } else {
                next.planName = '';
            }
            return next;
        });
        setTouched(prev => ({ ...prev, planName: true }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const nextState = { ...prev, [name]: value };
            
            // If startDate changes and plan select is standard, recalculate end date
            if (name === 'startDate' && planNameSelect !== 'Custom') {
                try {
                    let durationMonths = 1;
                    if (planNameSelect === 'Monthly') durationMonths = 1;
                    else if (planNameSelect === 'Quarterly') durationMonths = 3;
                    else if (planNameSelect === 'Semi-Annually') durationMonths = 6;
                    else if (planNameSelect === 'Annually') durationMonths = 12;

                    const start = new Date(nextState.startDate);
                    if (!isNaN(start.getTime())) {
                        start.setMonth(start.getMonth() + durationMonths);
                        nextState.endDate = start.toISOString().split('T')[0];
                    }
                } catch (err) {
                    // ignore
                }
            }

            return nextState;
        });
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Final validation check
        const finalErrors = validate(formData);
        if (Object.keys(finalErrors).length > 0) {
            setErrors(finalErrors);
            setError('Please fix validation errors before saving.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Update Member
            const { error: memberError } = await supabase
                .from('members')
                .update({
                    full_name: formData.fullName,
                    phone: formData.phone,
                    gender: formData.gender,
                    date_of_birth: formData.dateOfBirth || null,
                    address: formData.address || null,
                    info: formData.info || null,
                    status: formData.status
                })
                .eq('id', member.id);

            if (memberError) throw memberError;

            // 2. Update Subscription (if exists)
            if (latestSubscription) {
                const finalPlanName = planNameSelect === 'Custom' ? formData.planName : planNameSelect;
                const { error: subError } = await supabase
                    .from('subscriptions')
                    .update({
                        plan_name: finalPlanName,
                        price: Number(formData.price),
                        start_date: formData.startDate,
                        end_date: formData.endDate,
                        // Update active status based on current dates and/or manual status
                        is_active: formData.status === 'active' && formData.endDate >= new Date().toISOString().split('T')[0]
                    })
                    .eq('id', latestSubscription.id);

                if (subError) throw subError;
            }

            // 3. Trigger Biometric/Status Sync
            const { error: syncError } = await supabase.rpc('sync_member_statuses');
            if (syncError) console.error('Failed to sync member statuses:', syncError);

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to update member');
        } finally {
            setLoading(false);
        }
    };

    const hasValidationError = (field: string) => touched[field] && errors[field];

    const isFormValid = 
        formData.fullName.trim().length >= 3 &&
        formData.fullName.trim().length <= 100 &&
        /^\d{10}$/.test(formData.phone) &&
        (planNameSelect !== 'Custom' || formData.planName.trim() !== '') &&
        Number(formData.price) > 0 &&
        formData.startDate !== '' &&
        formData.endDate !== '' &&
        new Date(formData.endDate) > new Date(formData.startDate) &&
        Object.keys(errors).length === 0 &&
        !isCheckingPhone;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">Edit Profile & Membership</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
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
                                    className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none text-gray-900 transition-all ${
                                        hasValidationError('fullName') 
                                            ? 'border-red-300 focus:ring-red-200' 
                                            : 'border-gray-300 focus:ring-indigo-500'
                                    }`}
                                />
                                {hasValidationError('fullName') && (
                                    <p className="text-xs text-red-600 mt-1 font-medium">{errors.fullName}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                <div className="relative">
                                    <input
                                        required
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        type="tel"
                                        maxLength={10}
                                        className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none text-gray-900 transition-all ${
                                            hasValidationError('phone') 
                                                ? 'border-red-300 focus:ring-red-200' 
                                                : 'border-gray-300 focus:ring-indigo-500'
                                        }`}
                                    />
                                    {isCheckingPhone && (
                                        <span className="absolute right-3 top-3 text-xs text-gray-400">Verifying...</span>
                                    )}
                                </div>
                                {hasValidationError('phone') && (
                                    <p className="text-xs text-red-600 mt-1 font-medium">{errors.phone}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none text-gray-900 transition-all ${
                                        hasValidationError('gender') 
                                            ? 'border-red-300 focus:ring-red-200' 
                                            : 'border-gray-300 focus:ring-indigo-500'
                                    }`}
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                {hasValidationError('gender') && (
                                    <p className="text-xs text-red-600 mt-1 font-medium">{errors.gender}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                <input
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    type="date"
                                    className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none text-gray-900 transition-all ${
                                        hasValidationError('dateOfBirth') 
                                            ? 'border-red-300 focus:ring-red-200' 
                                            : 'border-gray-300 focus:ring-indigo-500'
                                    }`}
                                />
                                {hasValidationError('dateOfBirth') && (
                                    <p className="text-xs text-red-600 mt-1 font-medium">{errors.dateOfBirth}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Membership Status *</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    type="text"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Medical Info</label>
                                <textarea
                                    name="info"
                                    value={formData.info}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Enter any medical history, fitness goals, or staff notes here..."
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Subscription Info */}
                    {latestSubscription && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-green-500" />
                                Plan & Membership Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                                    <select
                                        value={planNameSelect}
                                        onChange={handlePlanSelectChange}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 mb-2"
                                    >
                                        <option value="Monthly">Monthly</option>
                                        <option value="Quarterly">Quarterly</option>
                                        <option value="Semi-Annually">Semi-Annually</option>
                                        <option value="Annually">Annually</option>
                                        <option value="Custom">Custom Plan</option>
                                    </select>
                                    {planNameSelect === 'Custom' && (
                                        <input
                                            required
                                            name="planName"
                                            value={formData.planName}
                                            onChange={handleChange}
                                            type="text"
                                            className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none text-gray-900 transition-all ${
                                                hasValidationError('planName') 
                                                    ? 'border-red-300 focus:ring-red-200' 
                                                    : 'border-gray-300 focus:ring-indigo-500'
                                            }`}
                                        />
                                    )}
                                    {hasValidationError('planName') && (
                                        <p className="text-xs text-red-600 mt-1 font-medium">{errors.planName}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Membership Price *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-500 text-sm font-bold">₹</span>
                                        <input
                                            required
                                            name="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            type="number"
                                            className={`w-full pl-7 pr-3 py-2.5 border rounded-lg focus:ring-2 outline-none text-gray-900 transition-all ${
                                                hasValidationError('price') 
                                                    ? 'border-red-300 focus:ring-red-200' 
                                                    : 'border-gray-300 focus:ring-indigo-500'
                                            }`}
                                        />
                                    </div>
                                    {hasValidationError('price') && (
                                        <p className="text-xs text-red-600 mt-1 font-medium">{errors.price}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                                    <input
                                        required
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        type="date"
                                        className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none text-gray-900 transition-all ${
                                            hasValidationError('startDate') 
                                                ? 'border-red-300 focus:ring-red-200' 
                                                : 'border-gray-300 focus:ring-indigo-500'
                                        }`}
                                    />
                                    {hasValidationError('startDate') && (
                                        <p className="text-xs text-red-600 mt-1 font-medium">{errors.startDate}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                                    <input
                                        required
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        type="date"
                                        className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none text-gray-900 transition-all ${
                                            hasValidationError('endDate') 
                                                ? 'border-red-300 focus:ring-red-200' 
                                                : 'border-gray-300 focus:ring-indigo-500'
                                        }`}
                                    />
                                    {hasValidationError('endDate') && (
                                        <p className="text-xs text-red-600 mt-1 font-medium">{errors.endDate}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

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
                            disabled={loading || !isFormValid}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
