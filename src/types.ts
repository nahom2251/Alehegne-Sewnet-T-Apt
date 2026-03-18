export type UserRole = 'super_admin' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  hiddenModules?: string[]; // IDs of modules to hide from sidebar
}

export interface Apartment {
  id: string;
  number: string;
  floor: string;
  position: 'front' | 'back' | 'single';
  tenantName: string;
  tenantPhone: string;
  moveInDate: string;
  monthlyRent: number;
  paymentDuration: number; // Number of months paid for
  lastPaymentDate?: string;
}

export interface Bill {
  id: string;
  apartmentId: string;
  month: number;
  year: number;
  type: 'rent' | 'electricity' | 'water';
  amount: number;
  status: 'pending' | 'paid';
  createdAt: string;
  paidAt?: string;
  
  // Electricity specific
  kwh?: number;
  rate?: number;
  tax?: number;
  tvTax?: number;
  controlTax?: number;
  serviceCharge?: number;
}

export type Language = 'en' | 'am';

export interface Translation {
  [key: string]: {
    en: string;
    am: string;
  };
}
