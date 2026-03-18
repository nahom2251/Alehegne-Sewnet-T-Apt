import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { Apartment, Bill } from '../types';
import { formatCurrency, calculateElectricityBill } from '../lib/utils';
import { generateBillPDF } from '../lib/pdf';
import { Plus, Receipt, FileText, CheckCircle2, Clock, Trash2, Download, Filter, Search, X, Edit2, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface BillingProps {
  apartments: Apartment[];
  bills: Bill[];
  onCreateBill: (bill: Partial<Bill>) => Promise<void>;
  onMarkAsPaid: (billId: string) => Promise<void>;
  onUpdateBill: (bill: Bill) => Promise<void>;
  onDeleteBill: (billId: string) => Promise<void>;
}

export const Billing: React.FC<BillingProps> = ({ apartments, bills, onCreateBill, onMarkAsPaid, onUpdateBill, onDeleteBill }) => {
  const { t } = useLanguage();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(false);
  const [newBill, setNewBill] = useState<Partial<Bill>>({
    type: 'rent',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: 'pending',
    amount: 0,
    kwh: 0,
    rate: 0
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let amount = newBill.amount || 0;
      if (newBill.type === 'electricity' && newBill.kwh && newBill.rate) {
        const calc = calculateElectricityBill(newBill.kwh, newBill.rate);
        amount = calc.total;
      }
      
      await onCreateBill({ ...newBill, amount });
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;
    setLoading(true);
    try {
      let amount = editingBill.amount;
      if (editingBill.type === 'electricity' && editingBill.kwh && editingBill.rate) {
        const calc = calculateElectricityBill(editingBill.kwh, editingBill.rate);
        amount = calc.total;
      }
      
      await onUpdateBill({ ...editingBill, amount });
      setEditingBill(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeApartments = apartments.filter(a => a.tenantName);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search bills..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
            />
          </div>
          <button className="p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gold hover:border-gold transition-all">
            <Filter size={20} />
          </button>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full md:w-auto px-6 py-2 bg-gold text-white font-bold rounded-xl shadow-lg shadow-gold/20 hover:bg-gold-dark transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          {t('generateBill')}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Apartment</th>
                <th className="px-6 py-4 font-bold">Type</th>
                <th className="px-6 py-4 font-bold">Period</th>
                <th className="px-6 py-4 font-bold">Amount</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bills.map((bill) => {
                const apt = apartments.find(a => a.id === bill.apartmentId);
                return (
                  <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{apt?.number || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{apt?.tenantName || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          bill.type === 'rent' ? "bg-blue-50 text-blue-500" :
                          bill.type === 'electricity' ? "bg-amber-50 text-amber-500" :
                          "bg-cyan-50 text-cyan-500"
                        )}>
                          <Receipt size={16} />
                        </div>
                        <span className="text-sm font-medium capitalize">{t(bill.type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{bill.month}/{bill.year}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(bill.amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit",
                        bill.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {bill.status === 'paid' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                        {t(bill.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingBill(bill)}
                          className="p-2 text-gray-400 hover:text-gold hover:bg-gold/5 rounded-lg transition-colors"
                          title={t('edit')}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => apt && generateBillPDF(apt, bill, bill.status === 'paid' ? 'paid' : 'pending')}
                          className="p-2 text-gray-400 hover:text-gold hover:bg-gold/5 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>
                        {bill.status === 'pending' && (
                          <button
                            onClick={() => onMarkAsPaid(bill.id)}
                            className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                            title={t('markAsPaid')}
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm(t('confirmDelete'))) {
                              onDeleteBill(bill.id);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('delete')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gold text-white">
                <h3 className="font-bold">{t('generateBill')}</h3>
                <button onClick={() => setShowCreateModal(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Apartment</label>
                  <select
                    required
                    value={newBill.apartmentId}
                    onChange={(e) => {
                      const apt = activeApartments.find(a => a.id === e.target.value);
                      setNewBill({ 
                        ...newBill, 
                        apartmentId: e.target.value,
                        amount: newBill.type === 'rent' ? apt?.monthlyRent : newBill.amount
                      });
                    }}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                  >
                    <option value="">Select Apartment</option>
                    {activeApartments.map(apt => (
                      <option key={apt.id} value={apt.id}>{apt.number} - {apt.tenantName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('type')}</label>
                    <select
                      required
                      value={newBill.type}
                      onChange={(e) => {
                        const type = e.target.value as any;
                        const apt = activeApartments.find(a => a.id === newBill.apartmentId);
                        setNewBill({ 
                          ...newBill, 
                          type,
                          amount: type === 'rent' ? apt?.monthlyRent : 0
                        });
                      }}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    >
                      <option value="rent">{t('rent')}</option>
                      <option value="electricity">{t('electricity')}</option>
                      <option value="water">{t('water')}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('month')}</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      required
                      value={newBill.month}
                      onChange={(e) => setNewBill({ ...newBill, month: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    />
                  </div>
                </div>

                {newBill.type === 'electricity' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('kwh')}</label>
                      <input
                        type="number"
                        required
                        value={newBill.kwh}
                        onChange={(e) => setNewBill({ ...newBill, kwh: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('rate')}</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newBill.rate}
                        onChange={(e) => setNewBill({ ...newBill, rate: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('amount')}</label>
                    <input
                      type="number"
                      required
                      value={newBill.amount}
                      onChange={(e) => setNewBill({ ...newBill, amount: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-gold text-white font-bold rounded-xl shadow-lg shadow-gold/20 hover:bg-gold-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? '...' : <><FileText size={18} /> {t('generateBill')}</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Edit Modal */}
      <AnimatePresence>
        {editingBill && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gold text-white">
                <h3 className="font-bold">{t('edit')} Bill</h3>
                <button onClick={() => setEditingBill(null)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('month')}</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      required
                      value={editingBill.month}
                      onChange={(e) => setEditingBill({ ...editingBill, month: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('year')}</label>
                    <input
                      type="number"
                      required
                      value={editingBill.year}
                      onChange={(e) => setEditingBill({ ...editingBill, year: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    />
                  </div>
                </div>

                {editingBill.type === 'electricity' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('kwh')}</label>
                      <input
                        type="number"
                        required
                        value={editingBill.kwh}
                        onChange={(e) => setEditingBill({ ...editingBill, kwh: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('rate')}</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editingBill.rate}
                        onChange={(e) => setEditingBill({ ...editingBill, rate: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('amount')}</label>
                    <input
                      type="number"
                      required
                      value={editingBill.amount}
                      onChange={(e) => setEditingBill({ ...editingBill, amount: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingBill(null)}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-gold text-white font-bold rounded-xl shadow-lg shadow-gold/20 hover:bg-gold-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? '...' : <><Check size={18} /> {t('save')}</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
