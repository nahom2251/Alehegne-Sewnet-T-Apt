import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { UserProfile, Apartment, Bill } from './types';
import { LanguageProvider } from './components/LanguageContext';
import { Layout } from './components/Layout';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Apartments } from './components/Apartments';
import { Billing } from './components/Billing';
import { Revenue } from './components/Revenue';
import { AdminPanel } from './components/AdminPanel';
import { Settings } from './components/Settings';
import { PendingApproval } from './components/PendingApproval';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await api.auth.me();
        setUser(userData);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Data Polling
  useEffect(() => {
    if (!user || user.status !== 'approved') return;

    const fetchData = async () => {
      try {
        const [apts, blls] = await Promise.all([
          api.apartments.list(),
          api.bills.list()
        ]);
        setApartments(apts);
        setBills(blls);

        if (user.role === 'super_admin') {
          const users = await api.users.list();
          setAllUsers(users);
        }

        // Refresh current user for status/role changes
        const me = await api.auth.me();
        setUser(me);
      } catch (err) {
        console.error('Error polling data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [user?.id, user?.status, user?.role]);

  const handleLogout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  const updateApartment = async (apt: Apartment) => {
    try {
      await api.apartments.update(apt.id, apt);
    } catch (error) {
      console.error('Error updating apartment:', error);
    }
  };

  const deleteTenant = async (aptId: string) => {
    try {
      await api.apartments.update(aptId, {
        tenantName: '',
        tenantPhone: '',
        moveInDate: '',
        monthlyRent: 0,
        paymentDuration: 1
      });
    } catch (error) {
      console.error('Error deleting tenant:', error);
    }
  };

  const createBill = async (billData: Partial<Bill>) => {
    try {
      await api.bills.create(billData);
    } catch (error) {
      console.error('Error creating bill:', error);
    }
  };

  const markAsPaid = async (billId: string) => {
    try {
      await api.bills.update(billId, {
        status: 'paid',
        paidAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking bill as paid:', error);
    }
  };

  const updateBill = async (bill: Bill) => {
    try {
      await api.bills.update(bill.id, bill);
    } catch (error) {
      console.error('Error updating bill:', error);
    }
  };

  const deleteBill = async (billId: string) => {
    try {
      await api.bills.delete(billId);
    } catch (error) {
      console.error('Error deleting bill:', error);
    }
  };

  const approveUser = async (id: string) => {
    try {
      await api.users.update(id, { status: 'approved' });
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const rejectUser = async (id: string) => {
    try {
      await api.users.update(id, { status: 'rejected' });
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  const clearTenants = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => api.apartments.update(id, {
        tenantName: '',
        tenantPhone: '',
        moveInDate: '',
        monthlyRent: 0,
        paymentDuration: 1
      })));
    } catch (error) {
      console.error('Error clearing tenants:', error);
    }
  };

  const clearBills = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => api.bills.delete(id)));
    } catch (error) {
      console.error('Error clearing bills:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <LanguageProvider>
        <Auth onLogin={setUser} />
      </LanguageProvider>
    );
  }

  if (user.status !== 'approved') {
    return (
      <LanguageProvider>
        <PendingApproval status={user.status} onLogout={handleLogout} />
      </LanguageProvider>
    );
  }

  const updateUserPreferences = async (hiddenModules: string[]) => {
    if (!user) return;
    try {
      await api.users.update(user.id, { hiddenModules });
      setUser({ ...user, hiddenModules });
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard apartments={apartments} bills={bills} />;
      case 'apartments': return <Apartments apartments={apartments} onUpdate={updateApartment} onDeleteTenant={deleteTenant} />;
      case 'billing': return (
        <Billing 
          apartments={apartments} 
          bills={bills} 
          onCreateBill={createBill} 
          onMarkAsPaid={markAsPaid}
          onUpdateBill={updateBill}
          onDeleteBill={deleteBill}
        />
      );
      case 'revenue': return <Revenue bills={bills} />;
      case 'admin': return <AdminPanel users={allUsers} onApprove={approveUser} onReject={rejectUser} />;
      case 'settings': return (
        <Settings 
          onClearTenants={clearTenants} 
          onClearBills={clearBills} 
          tenantIds={apartments.filter(a => a.tenantName).map(a => ({ id: a.id, name: a.tenantName, apt: a.number }))}
          billIds={bills.map(b => ({ id: b.id, type: b.type, apt: apartments.find(a => a.id === b.apartmentId)?.number || '?', date: new Date(b.createdAt).toLocaleDateString() }))}
          hiddenModules={user.hiddenModules || []}
          onUpdatePreferences={updateUserPreferences}
        />
      );
      default: return <Dashboard apartments={apartments} bills={bills} />;
    }
  };

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <Layout 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout} 
          userRole={user.role}
          hiddenModules={user.hiddenModules || []}
        >
          {renderTab()}
        </Layout>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
