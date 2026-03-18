import { createClient } from '@supabase/supabase-js';

// Mock Supabase Client using LocalStorage for a "Simple" experience without keys
const mockDb: Record<string, any[]> = {
  users: JSON.parse(localStorage.getItem('sb_users') || '[]'),
  apartments: JSON.parse(localStorage.getItem('sb_apartments') || '[]'),
  bills: JSON.parse(localStorage.getItem('sb_bills') || '[]'),
};

const save = (table: string) => {
  localStorage.setItem(`sb_${table}`, JSON.stringify(mockDb[table]));
};

// Helper to simulate Supabase response
const wrap = (data: any, error: any = null) => ({ data, error, count: Array.isArray(data) ? data.length : 0 });

class MockQueryBuilder {
  constructor(private table: string) {}

  select() { return this; }
  eq() { return this; }
  order() { return this; }
  in() { return this; }
  single() { 
    return Promise.resolve(wrap(mockDb[this.table][0] || null));
  }

  async then(resolve: any) {
    let data = mockDb[this.table];
    if (this.table === 'apartments' && data.length === 0) {
      // Auto-seed if empty
      const { INITIAL_APARTMENTS } = await import('../constants');
      mockDb.apartments = INITIAL_APARTMENTS.map((a, i) => ({ ...a, id: `apt-${i}` }));
      save('apartments');
      data = mockDb.apartments;
    }
    resolve(wrap(data));
  }

  async insert(values: any) {
    const items = Array.isArray(values) ? values : [values];
    const newItems = items.map(item => ({ ...item, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() }));
    mockDb[this.table].push(...newItems);
    save(this.table);
    return wrap(newItems);
  }

  async update(values: any) {
    mockDb[this.table] = mockDb[this.table].map(item => ({ ...item, ...values }));
    save(this.table);
    return wrap(values);
  }

  async delete() {
    mockDb[this.table] = [];
    save(this.table);
    return wrap([]);
  }
}

export const isSupabaseConfigured = true; // Always true for mock

export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: { user: { id: 'mock-user', email: 'admin@example.com' } } } }),
    onAuthStateChange: (cb: any) => {
      cb('SIGNED_IN', { user: { id: 'mock-user', email: 'admin@example.com' } });
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInWithPassword: () => Promise.resolve({ error: null }),
    signUp: () => Promise.resolve({ data: { user: { id: 'mock-user' } }, error: null }),
    signOut: () => {
      localStorage.clear();
      window.location.reload();
    },
    signInWithOAuth: () => Promise.resolve({ error: null }),
  },
  from: (table: string) => new MockQueryBuilder(table),
  channel: () => ({ on: () => ({ subscribe: () => {} }) }),
  removeChannel: () => {},
} as any;

export const getSupabaseAuth = () => supabase.auth;
export const getSupabaseDb = () => supabase;
