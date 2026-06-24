import React, { useState, useEffect } from 'react';
import { X, Save, User, Receipt, Fingerprint } from 'lucide-react';
import { createMemberWithSubscription } from '../../lib/api/members';
import { enrollMemberBiometrics, checkDeviceUserIdMapping } from '../../lib/api/biometrics';
import { supabase } from '../../lib/supabase';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Validation states
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isCheckingPhone, setIsCheckingPhone] = useState(false);

    // Biometric Mapping states
    const [deviceUserId, setDeviceUserId] = useState('');
    const [isCheckingDeviceUserId, setIsCheckingDeviceUserId] = useState(false);
    const [deviceUserIdError, setDeviceUserIdError] = useState('');

    // Plan Name Select State
    const [planNameSelect, setPlanNameSelect] = useState('Monthly');

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
        endDate: (() => {
            const date = new Date();
            date.setMonth(date.getMonth() + 1);
            return date.toISOString().split('T')[0];
        })(),
        // Payment
        initialPayment: '',
        paymentMethod: 'cash',
        adminNote: ''
    });

    // Run validations
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
        if (data.phone.trim()) {
            if (!/^\d+$/.test(data.phone)) {
                newErrors.phone = 'Phone Number must contain only numbers';
            } else if (data.phone.length !== 10) {
                newErrors.phone = 'Phone Number must be exactly 10 digits';
            }
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

        // Duration
        if (!data.durationMonths) {
            newErrors.durationMonths = 'Duration is required';
        } else {
            const durationVal = Number(data.durationMonths);
            if (isNaN(durationVal) || durationVal <= 0) {
                newErrors.durationMonths = 'Duration must be greater than 0';
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

        // Initial Payment
        if (data.initialPayment !== '') {
            const initPay = Number(data.initialPayment);
            const priceVal = Number(data.price) || 0;
            if (isNaN(initPay)) {
                newErrors.initialPayment = 'Initial Payment must be a valid number';
            } else if (initPay < 0) {
                newErrors.initialPayment = 'Initial Payment cannot be negative';
            } else if (initPay > priceVal) {
                newErrors.initialPayment = `Initial Payment cannot exceed plan price (₹${priceVal})`;
            }
        }

        return newErrors;
    };

    // Check for duplicate phone number
    useEffect(() => {
        const checkDuplicatePhone = async () => {
            if (/^\d{10}$/.test(formData.phone)) {
                setIsCheckingPhone(true);
                try {
                    const { data, error: dbError } = await supabase
                        .from('members')
                        .select('id')
                        .eq('phone', formData.phone);
                    
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
    }, [formData.phone]);

    // Check for duplicate device user ID
    useEffect(() => {
        const checkDuplicateDeviceUserId = async () => {
            const trimmed = deviceUserId.trim();
            if (!trimmed) {
                setDeviceUserIdError('');
                return;
            }

            if (!/^\d+$/.test(trimmed)) {
                setDeviceUserIdError('Device User ID must contain only numbers');
                return;
            }

            setIsCheckingDeviceUserId(true);
            setDeviceUserIdError('');
            try {
                const numericId = parseInt(trimmed, 10);
                const mapping = await checkDeviceUserIdMapping(numericId);
                if (mapping && mapping.mapped) {
                    setDeviceUserIdError(`Device User ID ${numericId} is already mapped to ${mapping.memberName}.`);
                }
            } catch (err) {
                console.error('Error checking duplicate Device User ID:', err);
            } finally {
                setIsCheckingDeviceUserId(false);
            }
        };

        const timer = setTimeout(() => {
            checkDuplicateDeviceUserId();
        }, 300);

        return () => clearTimeout(timer);
    }, [deviceUserId]);

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
                // Set default duration
                if (val === 'Monthly') next.durationMonths = 1;
                else if (val === 'Quarterly') next.durationMonths = 3;
                else if (val === 'Semi-Annually') next.durationMonths = 6;
                else if (val === 'Annually') next.durationMonths = 12;

                // Recalculate end date
                try {
                    const start = new Date(next.startDate);
                    if (!isNaN(start.getTime())) {
                        start.setMonth(start.getMonth() + next.durationMonths);
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
            
            // Auto-update initial payment if price changes and is untouched or matches price
            if (name === 'price') {
                if (prev.initialPayment === '' || prev.initialPayment === prev.price) {
                    nextState.initialPayment = value;
                }
            }

            // Auto-calculate end date if duration or start date changes
            if (name === 'startDate' || name === 'durationMonths') {
                try {
                    const start = new Date(nextState.startDate);
                    if (!isNaN(start.getTime())) {
                        start.setMonth(start.getMonth() + Number(nextState.durationMonths));
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
        if (Object.keys(finalErrors).length > 0 || deviceUserIdError) {
            setErrors(finalErrors);
            setError(deviceUserIdError || 'Please fix validation errors before submitting.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const newMember = await createMemberWithSubscription(
                {
                    fullName: formData.fullName,
                    phone: formData.phone.trim() || undefined,
                    gender: formData.gender as 'male' | 'female' | 'other',
                    dateOfBirth: formData.dateOfBirth || undefined,
                    address: formData.address || undefined,
                    info: formData.info || undefined,
                },
                {
                    planName: planNameSelect === 'Custom' ? formData.planName : planNameSelect,
                    price: Number(formData.price),
                    durationMonths: Number(formData.durationMonths),
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                },
                {
                    amount: Number(formData.initialPayment || formData.price),
                    method: formData.paymentMethod,
                    adminNote: formData.adminNote
                }
            );

            // Optional biometric mapping
            const trimmedDeviceUserId = deviceUserId.trim();
            if (trimmedDeviceUserId) {
                const numericId = parseInt(trimmedDeviceUserId, 10);
                await enrollMemberBiometrics(newMember.id, numericId);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to create member');
        } finally {
            setLoading(false);
        }
    };

    const hasValidationError = (field: string) => touched[field] && errors[field];

    // Check if form is valid to enable submit button
    const isPhoneValid = formData.phone.trim() === '' || (/^\d{10}$/.test(formData.phone) && !errors.phone);
    const isDeviceUserIdValid = deviceUserId.trim() === '' || (/^\d+$/.test(deviceUserId) && !deviceUserIdError);
    const isFormValid = 
        formData.fullName.trim().length >= 3 &&
        formData.fullName.trim().length <= 100 &&
        isPhoneValid &&
        isDeviceUserIdValid &&
        (planNameSelect !== 'Custom' || formData.planName.trim() !== '') &&
        Number(formData.price) > 0 &&
        Number(formData.durationMonths) > 0 &&
        formData.startDate !== '' &&
        formData.endDate !== '' &&
        new Date(formData.endDate) > new Date(formData.startDate) &&
        (formData.initialPayment === '' || (Number(formData.initialPayment) >= 0 && Number(formData.initialPayment) <= Number(formData.price))) &&
        (!errors.fullName && !errors.planName && !errors.price && !errors.durationMonths && !errors.startDate && !errors.endDate && !errors.initialPayment) &&
        !isCheckingPhone &&
        !isCheckingDeviceUserId;

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
                                    placeholder="John Doe"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                                <div className="relative">
                                    <input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        type="tel"
                                        maxLength={10}
                                        placeholder="9876543210"
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
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    type="text"
                                    placeholder="Street, City, State"
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Biometric Mapping (Optional) */}
                    <div className="space-y-4 border-t border-gray-100 pt-6">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Fingerprint className="w-5 h-5 text-indigo-500" />
                            Biometric Mapping (Optional)
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Device User ID (Keypad ID)</label>
                                <div className="relative">
                                    <input
                                        name="deviceUserId"
                                        value={deviceUserId}
                                        onChange={e => setDeviceUserId(e.target.value)}
                                        type="text"
                                        placeholder="e.g. 101"
                                        className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none text-gray-900 transition-all ${
                                            deviceUserIdError 
                                                ? 'border-red-300 focus:ring-red-200' 
                                                : 'border-gray-300 focus:ring-indigo-500'
                                        }`}
                                    />
                                    {isCheckingDeviceUserId && (
                                        <span className="absolute right-3 top-3 text-xs text-gray-400">Verifying ID...</span>
                                    )}
                                </div>
                                {deviceUserIdError && (
                                    <p className="text-xs text-red-600 mt-1 font-medium">{deviceUserIdError}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">If this member already has a fingerprint registered on the K40 device, enter their keypad ID here to map them automatically.</p>
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
                                        placeholder="e.g. Monthly Gold"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price (Amount) *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-500 text-sm font-bold">₹</span>
                                    <input
                                        required
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        type="number"
                                        placeholder="1200"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Months) *</label>
                                <select
                                    name="durationMonths"
                                    value={formData.durationMonths}
                                    onChange={handleChange}
                                    disabled={planNameSelect !== 'Custom'}
                                    className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none text-gray-900 transition-all disabled:bg-gray-50 disabled:text-gray-500 ${
                                        hasValidationError('durationMonths') 
                                            ? 'border-red-300 focus:ring-red-200' 
                                            : 'border-gray-300 focus:ring-indigo-500'
                                    }`}
                                >
                                    <option value={1}>1 Month</option>
                                    <option value={3}>3 Months</option>
                                    <option value={6}>6 Months</option>
                                    <option value={12}>1 Year</option>
                                </select>
                                {hasValidationError('durationMonths') && (
                                    <p className="text-xs text-red-600 mt-1 font-medium">{errors.durationMonths}</p>
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

                            <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                                <h4 className="text-sm font-semibold text-gray-800 mb-3">Initial Payment Info</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Initial Payment Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-3 text-gray-500 text-sm font-bold">₹</span>
                                            <input
                                                name="initialPayment"
                                                value={formData.initialPayment}
                                                onChange={handleChange}
                                                type="number"
                                                placeholder={formData.price || "1200"}
                                                className={`w-full pl-7 pr-3 py-2.5 border rounded-lg focus:ring-2 outline-none text-gray-900 transition-all ${
                                                    hasValidationError('initialPayment') 
                                                        ? 'border-red-300 focus:ring-red-200' 
                                                        : 'border-gray-300 focus:ring-indigo-500'
                                                }`}
                                            />
                                        </div>
                                        {hasValidationError('initialPayment') && (
                                            <p className="text-xs text-red-600 mt-1 font-medium">{errors.initialPayment}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                        <select
                                            name="paymentMethod"
                                            value={formData.paymentMethod}
                                            onChange={handleChange}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="upi">UPI / Online</option>
                                            <option value="card">Card</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Note</label>
                                        <input
                                            name="adminNote"
                                            value={formData.adminNote}
                                            onChange={handleChange}
                                            placeholder="Txn ID, Ref, etc."
                                            type="text"
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
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
                            disabled={loading || !isFormValid}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
