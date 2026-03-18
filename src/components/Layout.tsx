import React from 'react';
import { useLanguage } from './LanguageContext';
import { LayoutDashboard, Building2, Receipt, BarChart3, ShieldCheck, Settings, LogOut, Globe, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg transition-all duration-200",
      active 
        ? "bg-gold text-white shadow-lg shadow-gold/20" 
        : "text-gray-600 hover:bg-gold-light/20 hover:text-gold"
    )}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  userRole?: string;
  hiddenModules?: string[];
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout, userRole, hiddenModules = [] }) => {
  const { t, language, setLanguage } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: t('dashboard') },
    { id: 'apartments', icon: <Building2 size={20} />, label: t('apartments') },
    { id: 'billing', icon: <Receipt size={20} />, label: t('billing') },
    { id: 'revenue', icon: <BarChart3 size={20} />, label: t('revenue') },
    ...(userRole === 'super_admin' ? [{ id: 'admin', icon: <ShieldCheck size={20} />, label: t('adminPanel') }] : []),
    { id: 'settings', icon: <Settings size={20} />, label: t('settings') },
  ].filter(item => !hiddenModules.includes(item.id));

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30">
        <Logo size="sm" />
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 p-6 flex flex-col z-50 transition-transform duration-300 transform lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="mb-10">
          <Logo />
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
            />
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100 space-y-4">
          <button
            onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
            className="flex items-center gap-3 px-4 py-2 w-full text-left text-sm text-gray-600 hover:text-gold transition-colors"
          >
            <Globe size={18} />
            <span>{language === 'en' ? 'አማርኛ' : 'English'}</span>
          </button>
          
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2 w-full text-left text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-8 pt-24 lg:pt-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {menuItems.find(item => item.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-500 capitalize">{userRole?.replace('_', ' ')}</p>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full border-2 border-white shadow-sm overflow-hidden">
              <img src="https://picsum.photos/seed/admin/100/100" alt="Avatar" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>

        <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-400 text-sm">
          <p>{t('poweredBy')}</p>
        </footer>
      </main>
    </div>
  );
};
