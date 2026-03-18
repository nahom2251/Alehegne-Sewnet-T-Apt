import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { Globe, Trash2, AlertTriangle, Check, X, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsProps {
  onClearTenants: (ids: string[]) => Promise<void>;
  onClearBills: (ids: string[]) => Promise<void>;
  tenantIds: { id: string; name: string; apt: string }[];
  billIds: { id: string; type: string; apt: string; date: string }[];
  hiddenModules: string[];
  onUpdatePreferences: (hiddenModules: string[]) => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ 
  onClearTenants, 
  onClearBills, 
  tenantIds, 
  billIds,
  hiddenModules,
  onUpdatePreferences
}) => {
  const { t, language, setLanguage } = useLanguage();
  const [showConfirm, setShowConfirm] = useState<'tenants' | 'bills' | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleToggleModule = async (moduleId: string) => {
    const newHidden = hiddenModules.includes(moduleId)
      ? hiddenModules.filter(id => id !== moduleId)
      : [...hiddenModules, moduleId];
    await onUpdatePreferences(newHidden);
  };

  const handleClear = async () => {
    if (!showConfirm || selectedItems.length === 0) return;
    setLoading(true);
    try {
      if (showConfirm === 'tenants') {
        await onClearTenants(selectedItems);
      } else {
        await onClearBills(selectedItems);
      }
      setShowConfirm(null);
      setSelectedItems([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Language Settings */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center text-gold">
            <Globe size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Language Settings</h3>
            <p className="text-sm text-gray-500">Choose your preferred language for the interface.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setLanguage('en')}
            className={cn(
              "p-4 rounded-xl border-2 transition-all flex items-center justify-between",
              language === 'en' ? "border-gold bg-gold/5 text-gold" : "border-gray-100 text-gray-500 hover:border-gold/30"
            )}
          >
            <span className="font-bold">English</span>
            {language === 'en' && <Check size={20} />}
          </button>
          <button
            onClick={() => setLanguage('am')}
            className={cn(
              "p-4 rounded-xl border-2 transition-all flex items-center justify-between",
              language === 'am' ? "border-gold bg-gold/5 text-gold" : "border-gray-100 text-gray-500 hover:border-gold/30"
            )}
          >
            <span className="font-bold amharic">አማርኛ</span>
            {language === 'am' && <Check size={20} />}
          </button>
        </div>
      </div>

      {/* Module Visibility */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Module Visibility</h3>
            <p className="text-sm text-gray-500">Hide or show specific modules in the sidebar.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleToggleModule('apartments')}
            className={cn(
              "p-4 rounded-xl border-2 transition-all flex items-center justify-between",
              !hiddenModules.includes('apartments') ? "border-gold bg-gold/5 text-gold" : "border-gray-100 text-gray-500 hover:border-gold/30"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full", !hiddenModules.includes('apartments') ? "bg-gold" : "bg-gray-300")} />
              <span className="font-bold">{t('apartments')}</span>
            </div>
            {!hiddenModules.includes('apartments') ? <Check size={20} /> : <X size={20} />}
          </button>

          <button
            onClick={() => handleToggleModule('billing')}
            className={cn(
              "p-4 rounded-xl border-2 transition-all flex items-center justify-between",
              !hiddenModules.includes('billing') ? "border-gold bg-gold/5 text-gold" : "border-gray-100 text-gray-500 hover:border-gold/30"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("w-2 h-2 rounded-full", !hiddenModules.includes('billing') ? "bg-gold" : "bg-gray-300")} />
              <span className="font-bold">{t('billing')}</span>
            </div>
            {!hiddenModules.includes('billing') ? <Check size={20} /> : <X size={20} />}
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
            <Trash2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Data Management</h3>
            <p className="text-sm text-gray-500">Manage and clear selective data from the system.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-4 items-start mb-6">
            <AlertTriangle className="text-red-500 shrink-0" size={20} />
            <p className="text-sm text-red-700">
              Warning: Deleting data is permanent and cannot be undone. Please be careful when selecting items to delete.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-100 rounded-2xl hover:border-red-200 transition-colors group">
              <h4 className="font-bold text-gray-900 mb-2">Delete Tenants</h4>
              <p className="text-sm text-gray-500 mb-4">Remove specific tenants and their associated data from apartments.</p>
              <button
                onClick={() => { setShowConfirm('tenants'); setSelectedItems([]); }}
                className="w-full py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all text-sm"
              >
                Select Tenants to Delete
              </button>
            </div>

            <div className="p-6 border border-gray-100 rounded-2xl hover:border-red-200 transition-colors group">
              <h4 className="font-bold text-gray-900 mb-2">Delete Bills</h4>
              <p className="text-sm text-gray-500 mb-4">Remove specific billing records and receipts from the system history.</p>
              <button
                onClick={() => { setShowConfirm('bills'); setSelectedItems([]); }}
                className="w-full py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all text-sm"
              >
                Select Bills to Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-500 text-white">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={20} />
                  <h3 className="font-bold">Confirm Selective Deletion</h3>
                </div>
                <button onClick={() => setShowConfirm(null)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-4">
                  Select the {showConfirm} you want to delete. {selectedItems.length} items selected.
                </p>
                
                <div className="max-h-96 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100">
                  {showConfirm === 'tenants' ? (
                    tenantIds.map(t => (
                      <label key={t.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(t.id)}
                          onChange={() => toggleItem(t.id)}
                          className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                        />
                        <div>
                          <p className="font-bold text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-500">Apartment {t.apt}</p>
                        </div>
                      </label>
                    ))
                  ) : (
                    billIds.map(b => (
                      <label key={b.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(b.id)}
                          onChange={() => toggleItem(b.id)}
                          className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                        />
                        <div>
                          <p className="font-bold text-gray-900 capitalize">{b.type} Bill - {b.apt}</p>
                          <p className="text-xs text-gray-500">{b.date}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowConfirm(null)}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={loading || selectedItems.length === 0}
                    className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? '...' : <><Trash2 size={18} /> Delete Selected ({selectedItems.length})</>}
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
