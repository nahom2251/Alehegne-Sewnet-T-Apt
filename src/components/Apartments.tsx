import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { Apartment } from '../types';
import { formatCurrency } from '../lib/utils';
import { Plus, Edit2, Trash2, Phone, Calendar, DollarSign, X, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ApartmentsProps {
  apartments: Apartment[];
  onUpdate: (apt: Apartment) => Promise<void>;
  onDeleteTenant: (aptId: string) => Promise<void>;
}

export const Apartments: React.FC<ApartmentsProps> = ({ apartments, onUpdate, onDeleteTenant }) => {
  const { t } = useLanguage();
  const [editingApt, setEditingApt] = useState<Apartment | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApt) return;
    setLoading(true);
    try {
      await onUpdate(editingApt);
      setEditingApt(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setLoading(true);
    try {
      await onDeleteTenant(confirmDelete);
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {apartments.map((apt) => (
          <motion.div
            key={apt.id}
            layout
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center text-gold font-bold text-lg">
                  {apt.number}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingApt(apt)}
                    className="p-2 text-gray-400 hover:text-gold hover:bg-gold/5 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  {apt.tenantName && (
                    <button
                      onClick={() => setConfirmDelete(apt.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Tenant</p>
                  <p className="font-bold text-gray-900">{apt.tenantName || 'Vacant'}</p>
                </div>

                {apt.tenantName ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Phone size={14} className="text-gold" />
                      <span className="text-xs">{apt.tenantPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar size={14} className="text-gold" />
                      <span className="text-xs">{apt.moveInDate} ({apt.paymentDuration}m)</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 col-span-2">
                      <DollarSign size={14} className="text-gold" />
                      <span className="text-xs font-bold text-gray-900">{formatCurrency(apt.monthlyRent)} / month</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingApt(apt)}
                    className="w-full py-2 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-xs font-bold hover:border-gold hover:text-gold transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} />
                    Add Tenant
                  </button>
                )}
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{apt.floor} Floor - {apt.position}</span>
              <span className={cn(
                "w-2 h-2 rounded-full",
                apt.tenantName ? "bg-emerald-500" : "bg-gray-300"
              )} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingApt && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gold text-white">
                <h3 className="font-bold">{t('edit')} Apartment {editingApt.number}</h3>
                <button onClick={() => setEditingApt(null)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Apt. Number</label>
                    <input
                      type="text"
                      required
                      value={editingApt.number}
                      onChange={(e) => setEditingApt({ ...editingApt, number: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Floor</label>
                    <input
                      type="text"
                      required
                      value={editingApt.floor}
                      onChange={(e) => setEditingApt({ ...editingApt, floor: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Position</label>
                    <select
                      required
                      value={editingApt.position}
                      onChange={(e) => setEditingApt({ ...editingApt, position: e.target.value as any })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    >
                      <option value="front">Front</option>
                      <option value="back">Back</option>
                      <option value="single">Single</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('tenantName')}</label>
                  <input
                    type="text"
                    required
                    value={editingApt.tenantName}
                    onChange={(e) => setEditingApt({ ...editingApt, tenantName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('phone')}</label>
                  <input
                    type="tel"
                    required
                    value={editingApt.tenantPhone}
                    onChange={(e) => setEditingApt({ ...editingApt, tenantPhone: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                    placeholder="+251..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('moveInDate')}</label>
                  <input
                    type="date"
                    required
                    value={editingApt.moveInDate}
                    onChange={(e) => setEditingApt({ ...editingApt, moveInDate: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('monthlyRent')}</label>
                    <input
                      type="number"
                      required
                      value={editingApt.monthlyRent}
                      onChange={(e) => setEditingApt({ ...editingApt, monthlyRent: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                      placeholder="15000"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('paymentDuration')}</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="12"
                      value={editingApt.paymentDuration}
                      onChange={(e) => setEditingApt({ ...editingApt, paymentDuration: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none transition-all"
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingApt(null)}
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
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('confirmDelete')}</h3>
                <p className="text-gray-500 mb-6">Are you sure you want to remove this tenant? This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    {loading ? '...' : t('delete')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
