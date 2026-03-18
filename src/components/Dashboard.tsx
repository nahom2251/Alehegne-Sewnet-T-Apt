import React from 'react';
import { useLanguage } from './LanguageContext';
import { Apartment, Bill } from '../types';
import { formatCurrency, getRentStatus } from '../lib/utils';
import { Building2, Users, Receipt, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface DashboardProps {
  apartments: Apartment[];
  bills: Bill[];
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; subValue?: string; color: string }> = ({ icon, label, value, subValue, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg", color)}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ apartments, bills }) => {
  const { t } = useLanguage();

  const totalRent = bills.filter(b => b.type === 'rent' && b.status === 'paid').reduce((sum, b) => sum + b.amount, 0);
  const pendingRent = bills.filter(b => b.type === 'rent' && b.status === 'pending').reduce((sum, b) => sum + b.amount, 0);
  const totalTenants = apartments.filter(a => a.tenantName).length;

  const overdueApartments = apartments.filter(a => {
    if (!a.tenantName) return false;
    const { status } = getRentStatus(a.moveInDate, a.paymentDuration);
    return status === 'overdue';
  });

  const nearDueApartments = apartments.filter(a => {
    if (!a.tenantName) return false;
    const { status } = getRentStatus(a.moveInDate, a.paymentDuration);
    return status === 'near';
  });

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Building2 size={24} />}
          label={t('apartments')}
          value={`${apartments.length}`}
          subValue={`${totalTenants} Occupied`}
          color="bg-gold"
        />
        <StatCard
          icon={<Users size={24} />}
          label="Total Tenants"
          value={`${totalTenants}`}
          color="bg-blue-500"
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          label="Total Collected"
          value={formatCurrency(totalRent)}
          color="bg-emerald-500"
        />
        <StatCard
          icon={<Receipt size={24} />}
          label="Total Pending"
          value={formatCurrency(pendingRent)}
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Apartment Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Apartment Overview</h3>
            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Status List</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Apartment</th>
                  <th className="px-6 py-4 font-bold">Tenant</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {apartments.map((apt) => {
                  const { daysRemaining, status } = apt.tenantName 
                    ? getRentStatus(apt.moveInDate, apt.paymentDuration)
                    : { daysRemaining: 0, status: 'good' };
                  
                  return (
                    <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{apt.number}</p>
                        <p className="text-xs text-gray-500">{apt.floor} Floor</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-700">{apt.tenantName || 'Vacant'}</p>
                        <p className="text-xs text-gray-400">{apt.tenantPhone || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        {apt.tenantName ? (
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit",
                            status === 'good' ? "bg-emerald-100 text-emerald-700" :
                            status === 'near' ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          )}>
                            {status === 'good' ? <CheckCircle2 size={10} /> : status === 'near' ? <Clock size={10} /> : <AlertCircle size={10} />}
                            {t(status === 'good' ? 'manyDaysLeft' : status === 'near' ? 'fewDaysLeft' : 'overdue')}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-400">
                            Empty
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className={cn(
                          "text-sm font-bold",
                          status === 'overdue' ? "text-red-500" : "text-gray-700"
                        )}>
                          {apt.tenantName ? (status === 'overdue' ? `-${Math.abs(daysRemaining)}` : daysRemaining) : '-'}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications / Alerts */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <AlertCircle size={20} className="text-gold" />
              Notifications
            </h3>
            <div className="space-y-4">
              {overdueApartments.map(apt => (
                <div key={apt.id} className="flex gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-900">Overdue Rent: {apt.number}</p>
                    <p className="text-xs text-red-700 mt-1">{apt.tenantName} is overdue. Please follow up.</p>
                  </div>
                </div>
              ))}
              
              {nearDueApartments.map(apt => (
                <div key={apt.id} className="flex gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-white shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-900">{t('fewDaysLeft')}</p>
                    <p className="text-xs text-amber-700 mt-1">{apt.tenantName} ({apt.number})</p>
                  </div>
                </div>
              ))}

              {overdueApartments.length === 0 && nearDueApartments.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="text-gray-400 text-sm">All clear! No urgent alerts.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gold p-6 rounded-2xl shadow-lg shadow-gold/20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <h4 className="font-bold mb-2">Pro Tip</h4>
            <p className="text-sm text-white/80 leading-relaxed">
              Generate bills 5 days before the due date to ensure timely payments from tenants.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
