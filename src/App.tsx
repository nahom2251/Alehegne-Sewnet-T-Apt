import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, writeBatch } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, signInWithPopup, GoogleAuthProvider } from './lib/firebase';
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user || user.status !== 'approved') return;

    const unsubApts = onSnapshot(collection(db, 'apartments'), (snapshot) => {
      const apts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Apartment));
      setApartments(apts.sort((a, b) => a.number.localeCompare(b.number)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'apartments'));

    const unsubBills = onSnapshot(query(collection(db, 'bills'), orderBy('createdAt', 'desc')), (snapshot) => {
      const b = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill));
      setBills(b);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'bills'));

    let unsubUsers: () => void = () => {};
    if (user.role === 'super_admin') {
      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const u = snapshot.docs.map(doc => doc.data() as UserProfile);
        setAllUsers(u);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));
    }

    return () => {
      unsubApts();
      unsubBills();
      unsubUsers();
    };
  }, [user]);

  const handleLogin = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const handleRegister = async (email: string, pass: string, name: string) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(firebaseUser, { displayName: name });

    const usersSnap = await getDocs(collection(db, 'users'));
    const isFirstUser = usersSnap.empty;

    const profile: UserProfile = {
      uid: firebaseUser.uid,
      email,
      displayName: name,
      role: isFirstUser ? 'super_admin' : 'admin',
      status: isFirstUser ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), profile);
    setUser(profile);

    if (isFirstUser) {
      const batch = writeBatch(db);
      INITIAL_APARTMENTS.forEach((apt) => {
        const newDoc = doc(collection(db, 'apartments'));
        batch.set(newDoc, apt);
      });
      await batch.commit();
    }
  };

  const handleLogout = () => signOut(auth);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    const { user: firebaseUser } = await signInWithPopup(auth, provider);
    
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (!userDoc.exists()) {
      const usersSnap = await getDocs(collection(db, 'users'));
      const isFirstUser = usersSnap.empty;

      const profile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'User',
        role: isFirstUser ? 'super_admin' : 'admin',
        status: isFirstUser ? 'approved' : 'pending',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), profile);
      setUser(profile);

      if (isFirstUser) {
        const batch = writeBatch(db);
        INITIAL_APARTMENTS.forEach((apt) => {
          const newDoc = doc(collection(db, 'apartments'));
          batch.set(newDoc, apt);
        });
        await batch.commit();
      }
    } else {
      setUser(userDoc.data() as UserProfile);
    }
  };

  const updateApartment = async (apt: Apartment) => {
    const { id, ...data } = apt;
    try {
      await updateDoc(doc(db, 'apartments', id), data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `apartments/${id}`);
    }
  };

  const deleteTenant = async (aptId: string) => {
    try {
      await updateDoc(doc(db, 'apartments', aptId), {
        tenantName: '',
        tenantPhone: '',
        moveInDate: '',
        monthlyRent: 0,
        paymentDuration: 1
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `apartments/${aptId}`);
    }
  };

  const createBill = async (billData: Partial<Bill>) => {
    try {
      const newDoc = doc(collection(db, 'bills'));
      await setDoc(newDoc, {
        ...billData,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'bills');
    }
  };

  const markAsPaid = async (billId: string) => {
    try {
      await updateDoc(doc(db, 'bills', billId), {
        status: 'paid',
        paidAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bills/${billId}`);
    }
  };

  const updateBill = async (bill: Bill) => {
    try {
      const { id, ...data } = bill;
      await updateDoc(doc(db, 'bills', id), data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bills/${bill.id}`);
    }
  };

  const deleteBill = async (billId: string) => {
    try {
      await deleteDoc(doc(db, 'bills', billId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `bills/${billId}`);
    }
  };

  const approveUser = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { status: 'approved' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const rejectUser = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { status: 'rejected' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const clearTenants = async (ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => {
      batch.update(doc(db, 'apartments', id), {
        tenantName: '',
        tenantPhone: '',
        moveInDate: '',
        monthlyRent: 0,
        paymentDuration: 1
      });
    });
    await batch.commit();
  };

  const clearBills = async (ids: string[]) => {
    const batch = writeBatch(db);
    ids.forEach(id => {
      batch.delete(doc(db, 'bills', id));
    });
    await batch.commit();
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
    try {
      await updateDoc(doc(db, 'users', user.uid), { hiddenModules });
      setUser({ ...user, hiddenModules });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
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
