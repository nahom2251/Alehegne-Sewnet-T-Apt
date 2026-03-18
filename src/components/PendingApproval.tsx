import React from 'react';
import { useLanguage } from './LanguageContext';
import { Clock, LogOut, Globe, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface PendingApprovalProps {
  status: 'pending' | 'rejected';
  onLogout: () => void;
}

export const PendingApproval: React.FC<PendingApprovalProps> = ({ status, onLogout }) => {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100 text-center">
        <div className={cn(
          "w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-lg mx-auto mb-6",
          status === 'pending' ? "bg-amber-500 shadow-amber-500/20" : "bg-red-500 shadow-red-500/20"
        )}>
          {status === 'pending' ? <Clock size={40} /> : <AlertCircle size={40} />}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {status === 'pending' ? 'Approval Pending' : 'Account Rejected'}
        </h2>
        
        <p className="text-gray-500 mb-8 leading-relaxed">
          {status === 'pending' ? t('pendingApproval') : t('rejected')}
        </p>

        <div className="space-y-4">
          <button
            onClick={onLogout}
            className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            {t('logout')}
          </button>

          <button
            onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
            className="flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gold transition-colors mx-auto pt-4"
          >
            <Globe size={14} />
            <span>{language === 'en' ? 'አማርኛ' : 'English'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
