export interface AddMemberFormData {
  // Personal Info
  fullName: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  address: string;
  info: string;
  deviceUserId: string;

  // Subscription Plan
  planSelect: string;
  planName: string;
  price: string;
  durationMonths: number;
  startDate: string;
  endDate: string;

  // Payment
  initialPayment: string;
  paymentMethod: 'cash' | 'upi' | 'card' | 'other';
  adminNote: string;
}

export interface StepProps {
  formData: AddMemberFormData;
  updateFormData: (updates: Partial<AddMemberFormData>) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isCheckingPhone?: boolean;
  isCheckingDeviceUserId?: boolean;
  deviceUserIdError?: string;
}
