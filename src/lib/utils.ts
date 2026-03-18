import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
  }).format(amount);
}

export function calculateElectricityBill(kwh: number, rate: number) {
  const base = kwh * rate;
  const serviceCharge = 16;
  const tvTax = 10;
  const controlTax = base * 0.005;
  const tax = (base + serviceCharge + tvTax + controlTax) * 0.15;
  
  return {
    base,
    serviceCharge,
    tvTax,
    controlTax,
    tax,
    total: base + serviceCharge + tvTax + controlTax + tax
  };
}

export function getRentStatus(moveInDate: string, paymentDuration: number = 1) {
  const today = new Date();
  const moveIn = new Date(moveInDate);
  
  // Calculate the next due date: Move-in Date + paymentDuration months
  const nextDueDate = new Date(moveIn);
  nextDueDate.setMonth(nextDueDate.getMonth() + paymentDuration);
  
  const diffTime = nextDueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let status: 'good' | 'near' | 'overdue' = 'good';
  if (diffDays <= 0) status = 'overdue';
  else if (diffDays <= 5) status = 'near';
  
  return {
    daysRemaining: diffDays,
    status
  };
}
