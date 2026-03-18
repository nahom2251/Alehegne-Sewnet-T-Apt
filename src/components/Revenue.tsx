import React from 'react';
import { useLanguage } from './LanguageContext';
import { Bill } from '../types';
import { formatCurrency } from '../lib/utils';
import { BarChart3, TrendingUp, Receipt, Droplets, Zap, Calendar, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface RevenueProps {
  bills: Bill[];
}

export const Revenue: React.FC<RevenueProps> = ({ bills }) => {
  const { t } = useLanguage();

  const paidBills = bills.filter(b => b.status === 'paid');
  const pendingBills = bills.filter(b => b.status === 'pending');

  const rentRevenue = paidBills.filter(b => b.type === 'rent').reduce((sum, b) => sum + b.amount, 0);
  const electricityRevenue = paidBills.filter(b => b.type === 'electricity').reduce((sum, b) => sum + b.amount, 0);
  const waterRevenue = paidBills.filter(b => b.type === 'water').reduce((sum, b) => sum + b.amount, 0);

  const pendingRent = pendingBills.filter(b => b.type === 'rent').reduce((sum, b) => sum + b.amount, 0);
  const pendingElectricity = pendingBills.filter(b => b.type === 'electricity').reduce((sum, b) => sum + b.amount, 0);
  const pendingWater = pendingBills.filter(b => b.type === 'water').reduce((sum, b) => sum + b.amount, 0);

  const totalRevenue = rentRevenue + electricityRevenue + waterRevenue;
  const totalPending = pendingRent + pendingElectricity + pendingWater;

  const revenueStats = [
    { label: t('rent'), value: rentRevenue, pending: pendingRent, icon: <Receipt size={20} />, color: "bg-blue-500" },
    { label: t('electricity'), value: electricityRevenue, pending: pendingElectricity, icon: <Zap size={20} />, color: "bg-amber-500" },
    { label: t('water'), value: waterRevenue, pending: pendingWater, icon: <Droplets size={20} />, color: "bg-cyan-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-500 p-8 rounded-2xl text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24" />
          <div className="relative">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp size={24} />
            </div>
            <p className="text-emerald-100 font-medium mb-1">Total Collected Revenue</p>
            <h3 className="text-4xl font-bold">{formatCurrency(totalRevenue)}</h3>
          </div>
        </div>

        <div className="bg-amber-500 p-8 rounded-2xl text-white shadow-lg shadow-amber-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24" />
          <div className="relative">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Clock size={24} />
            </div>
            <p className="text-amber-100 font-medium mb-1">Total Pending Revenue</p>
            <h3 className="text-4xl font-bold">{formatCurrency(totalPending)}</h3>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {revenueStats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", stat.color)}>
                {stat.icon}
              </div>
              <h4 className="font-bold text-gray-900">{stat.label}</h4>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Collected</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(stat.value)}</p>
              </div>
              <div className="pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Pending</p>
                <p className="text-lg font-bold text-amber-500">{formatCurrency(stat.pending)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={20} className="text-gold" />
            Recent Revenue Transactions
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Type</th>
                <th className="px-6 py-4 font-bold">Amount</th>
                <th className="px-6 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paidBills.sort((a, b) => new Date(b.paidAt || '').getTime() - new Date(a.paidAt || '').getTime()).slice(0, 10).map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(bill.paidAt || '').toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium capitalize">{t(bill.type)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-emerald-600">+{formatCurrency(bill.amount)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg uppercase">
                      {t('paid')}
                    </span>
                  </td>
                </tr>
              ))}
              {paidBills.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm">
                    No revenue transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
