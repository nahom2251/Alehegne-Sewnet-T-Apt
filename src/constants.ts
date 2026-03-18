import { Apartment } from './types';

export const INITIAL_APARTMENTS: Omit<Apartment, 'id'>[] = [
  { number: '201', floor: '2nd', position: 'front', tenantName: '', tenantPhone: '', moveInDate: '', monthlyRent: 0, paymentDuration: 1 },
  { number: '202', floor: '2nd', position: 'back', tenantName: '', tenantPhone: '', moveInDate: '', monthlyRent: 0, paymentDuration: 1 },
  { number: '301', floor: '3rd', position: 'front', tenantName: '', tenantPhone: '', moveInDate: '', monthlyRent: 0, paymentDuration: 1 },
  { number: '302', floor: '3rd', position: 'back', tenantName: '', tenantPhone: '', moveInDate: '', monthlyRent: 0, paymentDuration: 1 },
  { number: '401', floor: '4th', position: 'front', tenantName: '', tenantPhone: '', moveInDate: '', monthlyRent: 0, paymentDuration: 1 },
  { number: '402', floor: '4th', position: 'back', tenantName: '', tenantPhone: '', moveInDate: '', monthlyRent: 0, paymentDuration: 1 },
  { number: '501', floor: '5th', position: 'single', tenantName: '', tenantPhone: '', moveInDate: '', monthlyRent: 0, paymentDuration: 1 },
];
