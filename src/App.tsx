import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { UserProfile, Apartment, Bill } from './types';
import { INITIAL_APARTMENTS } from './constants';
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
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', uid)
        .single();

      if (error) throw error;
      if (data) {
        setUser({
          uid: data.uid,
          email: data.email,
          displayName: data.display_name,
          role: data.role,
          status: data.status,
          createdAt: data.created_at,
          hiddenModules: data.hidden_modules || [],
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Data Listeners (Realtime)
  useEffect(() => {
    if (!user || user.status !== 'approved') return;

    // Fetch initial data
    fetchApartments();
    fetchBills();
    if (user.role === 'super_admin') fetchAllUsers();

    // Set up realtime subscriptions
    const aptChannel = supabase
      .channel('apartments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apartments' }, () => fetchApartments())
      .subscribe();

    const billChannel = supabase
      .channel('bills-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, () => fetchBills())
      .subscribe();

    const userChannel = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        if (user.role === 'super_admin') fetchAllUsers();
        fetchUserProfile(user.uid);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(aptChannel);
      supabase.removeChannel(billChannel);
      supabase.removeChannel(userChannel);
    };
  }, [user?.uid, user?.status, user?.role]);

  const fetchApartments = async () => {
    const { data, error } = await supabase
      .from('apartments')
      .select('*')
      .order('number', { ascending: true });
    
    if (error) console.error('Error fetching apartments:', error);
    else if (data) {
      setApartments(data.map(a => ({
        id: a.id,
        number: a.number,
        floor: a.floor,
        position: a.position,
        tenantName: a.tenant_name || '',
        tenantPhone: a.tenant_phone || '',
        moveInDate: a.move_in_date || '',
        monthlyRent: Number(a.monthly_rent),
        paymentDuration: a.payment_duration,
        lastPaymentDate: a.last_payment_date || '',
      })));
    }
  };

  const fetchBills = async () => {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching bills:', error);
    else if (data) {
      setBills(data.map(b => ({
        id: b.id,
        apartmentId: b.apartment_id,
        month: b.month,
        year: b.year,
        type: b.type,
        amount: Number(b.amount),
        status: b.status,
        createdAt: b.created_at,
        paidAt: b.paid_at || undefined,
        kwh: b.kwh ? Number(b.kwh) : undefined,
        rate: b.rate ? Number(b.rate) : undefined,
      })));
    }
  };

  const fetchAllUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) console.error('Error fetching all users:', error);
    else if (data) {
      setAllUsers(data.map(u => ({
        uid: u.uid,
        email: u.email,
        displayName: u.display_name,
        role: u.role,
        status: u.status,
        createdAt: u.created_at,
        hiddenModules: u.hidden_modules || [],
      })));
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const handleRegister = async (email: string, pass: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      }
    });
    if (error) throw error;
    
    // The trigger in Supabase (handle_new_user) will create the profile.
    // We just need to wait or manually fetch.
    if (data.user) {
      // Check if it's the first user to seed apartments
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
      if (count === 1) {
        await seedInitialApartments();
      }
    }
  };

  const seedInitialApartments = async () => {
    const aptsToInsert = INITIAL_APARTMENTS.map(apt => ({
      number: apt.number,
      floor: apt.floor,
      position: apt.position,
      tenant_name: apt.tenantName,
      tenant_phone: apt.tenantPhone,
      move_in_date: apt.moveInDate || null,
      monthly_rent: apt.monthlyRent,
      payment_duration: apt.paymentDuration,
    }));
    const { error } = await supabase.from('apartments').insert(aptsToInsert);
    if (error) console.error('Error seeding apartments:', error);
  };

  const handleLogout = () => supabase.auth.signOut();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
    if (error) throw error;
  };

  const updateApartment = async (apt: Apartment) => {
    const { error } = await supabase
      .from('apartments')
      .update({
        number: apt.number,
        floor: apt.floor,
        position: apt.position,
        tenant_name: apt.tenantName,
        tenant_phone: apt.tenantPhone,
        move_in_date: apt.moveInDate || null,
        monthly_rent: apt.monthlyRent,
        payment_duration: apt.paymentDuration,
        last_payment_date: apt.lastPaymentDate || null,
      })
      .eq('id', apt.id);
    
    if (error) console.error('Error updating apartment:', error);
  };

  const deleteTenant = async (aptId: string) => {
    const { error } = await supabase
      .from('apartments')
      .update({
        tenant_name: '',
        tenant_phone: '',
        move_in_date: null,
        monthly_rent: 0,
        payment_duration: 1
      })
      .eq('id', aptId);
    
    if (error) console.error('Error deleting tenant:', error);
  };

  const createBill = async (billData: Partial<Bill>) => {
    const { error } = await supabase
      .from('bills')
      .insert({
        apartment_id: billData.apartmentId,
        month: billData.month,
        year: billData.year,
        type: billData.type,
        amount: billData.amount,
        status: billData.status || 'pending',
        kwh: billData.kwh,
        rate: billData.rate,
      });
    
    if (error) console.error('Error creating bill:', error);
  };

  const markAsPaid = async (billId: string) => {
    const { error } = await supabase
      .from('bills')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', billId);
    
    if (error) console.error('Error marking bill as paid:', error);
  };

  const updateBill = async (bill: Bill) => {
    const { error } = await supabase
      .from('bills')
      .update({
        month: bill.month,
        year: bill.year,
        amount: bill.amount,
        status: bill.status,
        kwh: bill.kwh,
        rate: bill.rate,
      })
      .eq('id', bill.id);
    
    if (error) console.error('Error updating bill:', error);
  };

  const deleteBill = async (billId: string) => {
    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', billId);
    
    if (error) console.error('Error deleting bill:', error);
  };

  const approveUser = async (uid: string) => {
    const { error } = await supabase
      .from('users')
      .update({ status: 'approved' })
      .eq('uid', uid);
    
    if (error) console.error('Error approving user:', error);
  };

  const rejectUser = async (uid: string) => {
    const { error } = await supabase
      .from('users')
      .update({ status: 'rejected' })
      .eq('uid', uid);
    
    if (error) console.error('Error rejecting user:', error);
  };

  const clearTenants = async (ids: string[]) => {
    const { error } = await supabase
      .from('apartments')
      .update({
        tenant_name: '',
        tenant_phone: '',
        move_in_date: null,
        monthly_rent: 0,
        payment_duration: 1
      })
      .in('id', ids);
    
    if (error) console.error('Error clearing tenants:', error);
  };

  const clearBills = async (ids: string[]) => {
    const { error } = await supabase
      .from('bills')
      .delete()
      .in('id', ids);
    
    if (error) console.error('Error clearing bills:', error);
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
        <Auth onLogin={handleLogin} onRegister={handleRegister} onGoogleLogin={handleGoogleLogin} />
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
    const { error } = await supabase
      .from('users')
      .update({ hidden_modules: hiddenModules })
      .eq('uid', user.uid);
    
    if (error) console.error('Error updating preferences:', error);
    else setUser({ ...user, hiddenModules });
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
