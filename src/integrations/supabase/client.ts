import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';
import {
  createLocalRow,
  deleteLocalRow,
  listLocalRows,
  resetLocalStore,
  updateLocalRow,
  type LocalTableName,
} from '@/lib/local-store';
import { firebaseAuth, firebaseDb, hasFirebaseConfig } from '@/integrations/firebase/config';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function serverSupabaseUrl(publicUrl: string, supabaseKey: string): string | undefined {
  if (typeof window !== 'undefined' || typeof process === 'undefined') return undefined;
  const serverUrl = process.env['SUPABASE_URL']?.replace(/\/+$/, '');
  if (!serverUrl || serverUrl === publicUrl || process.env['SUPABASE_PUBLISHABLE_KEY'] !== supabaseKey) return undefined;
  return serverUrl;
}

function createSupabaseFetch(supabaseUrl: string, supabaseKey: string): typeof fetch {
  const publicUrl = supabaseUrl.replace(/\/+$/, '');
  const serverUrl = serverSupabaseUrl(publicUrl, supabaseKey);
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    if (serverUrl) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.startsWith(`${publicUrl}/`)) {
        const target = serverUrl + url.slice(publicUrl.length);
        const request = typeof input === 'string' || input instanceof URL ? target : new Request(target, input);
        return fetch(request, { ...init, headers });
      }
    }
    return fetch(input, { ...init, headers });
  };
}

function createLocalQueryBuilder(table: LocalTableName) {
  let predicate: { field: string; value: unknown } | null = null;
  let orderBy: { field: string; ascending: boolean } | null = null;
  let pendingPayload: any = null;
  let action: 'select' | 'insert' | 'update' | 'delete' = 'select';

  const execute = () => {
    const rows = listLocalRows(table);
    const filtered = predicate ? rows.filter((row) => row[predicate.field] === predicate.value) : rows;
    const sorted = orderBy ? [...filtered].sort((a, b) => {
      const av = a[orderBy.field] ?? '';
      const bv = b[orderBy.field] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') {
        return orderBy.ascending ? av - bv : bv - av;
      }
      return orderBy.ascending ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    }) : filtered;

    if (action === 'select') return { data: sorted, error: null };
    if (action === 'insert') {
      const incoming = Array.isArray(pendingPayload) ? pendingPayload : [pendingPayload];
      const saved = incoming.map((row) => createLocalRow(table, row));
      return { data: Array.isArray(pendingPayload) ? saved : saved[0], error: null };
    }
    if (action === 'update') {
      const updated = filtered.map((row) => ({ ...row, ...pendingPayload }));
      const result = updated.map((row) => updateLocalRow(table, row.id, row));
      return { data: result, error: null };
    }
    if (action === 'delete') {
      const ids = filtered.map((row) => row.id);
      ids.forEach((id) => deleteLocalRow(table, id));
      return { data: ids, error: null };
    }

    return { data: sorted, error: null };
  };

  const builder: any = {
    select() {
      action = 'select';
      return builder;
    },
    order(field: string, options?: { ascending?: boolean }) {
      orderBy = { field, ascending: options?.ascending ?? true };
      return builder;
    },
    eq(field: string, value: unknown) {
      predicate = { field, value };
      return builder;
    },
    insert(value: any) {
      action = 'insert';
      pendingPayload = value;
      return builder;
    },
    update(value: any) {
      action = 'update';
      pendingPayload = value;
      return builder;
    },
    delete() {
      action = 'delete';
      return builder;
    },
    then(onFulfilled: (value: any) => any, onRejected?: (reason: any) => any) {
      return Promise.resolve(execute()).then(onFulfilled, onRejected);
    },
  };

  return builder;
}

const DEFAULT_LOCAL_ADMIN_EMAIL = 'mawienmision@gmail.com';
const DEFAULT_LOCAL_ADMIN_PASSWORD = 'adorkhon';
export const LOCAL_ADMIN_EMAIL = DEFAULT_LOCAL_ADMIN_EMAIL;
const LOCAL_ADMIN_USERS_KEY = 'mission-football-local-admin-users';
const LOCAL_AUTH_SESSION_KEY = 'mission-football-local-auth-session';

type LocalAdminUser = {
  id: string;
  email: string;
  password: string;
  role: 'admin';
  created_at: string;
};

function readLocalAdminUsers(): LocalAdminUser[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_ADMIN_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalAdminUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalAdminUsers(users: LocalAdminUser[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_ADMIN_USERS_KEY, JSON.stringify(users));
}

function ensureLocalAdminUser(): LocalAdminUser {
  const users = readLocalAdminUsers();
  const existing = users.find((user) => user.email.toLowerCase() === DEFAULT_LOCAL_ADMIN_EMAIL);
  if (existing) return existing;

  const admin: LocalAdminUser = {
    id: `local-admin-${Date.now()}`,
    email: DEFAULT_LOCAL_ADMIN_EMAIL,
    password: DEFAULT_LOCAL_ADMIN_PASSWORD,
    role: 'admin',
    created_at: new Date().toISOString(),
  };

  writeLocalAdminUsers([admin, ...users]);
  return admin;
}

function readLocalAuthSession() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocalAuthSession(session: any) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_AUTH_SESSION_KEY, JSON.stringify(session));
}

function clearLocalAuthSession() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(LOCAL_AUTH_SESSION_KEY);
}

function createLocalAuthSession(user: LocalAdminUser) {
  const session = {
    access_token: `local-${user.id}`,
    refresh_token: `local-refresh-${user.id}`,
    expires_at: Date.now() + 86400000,
    token_type: 'bearer',
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      app_metadata: { provider: 'local' },
      user_metadata: {},
      aud: 'authenticated',
      role: 'authenticated',
    },
  };

  writeLocalAuthSession(session);
  return session;
}

function mapFirebaseUser(user: User | null) {
  if (!user) return null;
  return {
    id: user.uid,
    email: user.email,
    created_at: user.metadata?.creationTime ?? new Date().toISOString(),
    app_metadata: { provider: user.providerId || 'firebase' },
    user_metadata: { name: user.displayName ?? user.email },
    aud: 'authenticated',
    role: 'authenticated',
  };
}

function createFirebaseSession(user: User | null) {
  if (!user) return null;
  return {
    access_token: awaitUserToken(user),
    refresh_token: user.refreshToken,
    expires_at: Math.floor((Date.now() + 60 * 60 * 1000) / 1000),
    token_type: 'bearer',
    user: mapFirebaseUser(user),
  };
}

function awaitUserToken(user: User | null) {
  return user?.accessToken ?? `firebase-${user?.uid ?? 'anonymous'}`;
}

function createFirebaseQueryBuilder(table: string) {
  let action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  let predicate: { field: string; value: unknown } | null = null;
  let sorting: { field: string; ascending: boolean } | null = null;
  let payload: any = null;

  const execute = async () => {
    const collectionRef = collection(firebaseDb, table);
    const snapshot = await getDocs(collectionRef);
    let rows = snapshot.docs.map((docRef) => ({ id: docRef.id, ...docRef.data() }));

    if (predicate) {
      rows = rows.filter((row) => row[predicate.field] === predicate.value);
    }

    if (sorting) {
      rows = [...rows].sort((a, b) => {
        const av = a[sorting.field] ?? '';
        const bv = b[sorting.field] ?? '';
        if (typeof av === 'number' && typeof bv === 'number') {
          return sorting.ascending ? av - bv : bv - av;
        }
        return sorting.ascending
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }

    switch (action) {
      case 'select':
        return { data: rows, error: null };
      case 'insert': {
        const item = payload ?? {};
        const docRef = await addDoc(collectionRef, item);
        return { data: { id: docRef.id, ...item }, error: null };
      }
      case 'update': {
        const matches = predicate ? rows : rows;
        const updated = []; 
        for (const row of matches) {
          const ref = doc(firebaseDb, table, row.id);
          await updateDoc(ref, payload ?? {});
          updated.push({ ...row, ...payload });
        }
        return { data: updated, error: null };
      }
      case 'delete': {
        const matches = predicate ? rows : rows;
        for (const row of matches) {
          await deleteDoc(doc(firebaseDb, table, row.id));
        }
        return { data: matches, error: null };
      }
      default:
        return { data: rows, error: null };
    }
  };

  return {
    select() {
      action = 'select';
      return this;
    },
    order(field: string, options?: { ascending?: boolean }) {
      sorting = { field, ascending: options?.ascending ?? true };
      return this;
    },
    eq(field: string, value: unknown) {
      predicate = { field, value };
      return this;
    },
    insert(value: any) {
      action = 'insert';
      payload = value;
      return this;
    },
    update(value: any) {
      action = 'update';
      payload = value;
      return this;
    },
    delete() {
      action = 'delete';
      return this;
    },
    then(onFulfilled: (value: any) => any, onRejected?: (reason: any) => any) {
      return execute().then(onFulfilled, onRejected);
    },
  };
}

function createFirebaseClient() {
  const listeners = new Set<(event: string, session: any) => void>();
  const emit = (event: string, session: any) => listeners.forEach((listener) => listener(event, session));

  return {
    from(table: string) {
      return createFirebaseQueryBuilder(table);
    },
    auth: {
      getSession: async () => {
        const user = firebaseAuth.currentUser;
        const session = user ? createFirebaseSession(user) : null;
        return { data: { session }, error: null };
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
          const session = createFirebaseSession(user);
          callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', session);
        });
        listeners.add(callback);
        return { data: { subscription: { unsubscribe } } };
      },
      signOut: async () => {
        await signOut(firebaseAuth);
        emit('SIGNED_OUT', null);
        return { error: null };
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        try {
          const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
          const session = createFirebaseSession(credential.user);
          emit('SIGNED_IN', session);
          return { data: { user: mapFirebaseUser(credential.user), session }, error: null };
        } catch (error: any) {
          return { data: { user: null, session: null }, error: { message: error?.message ?? 'Authentication failed.' } };
        }
      },
      signUp: async ({ email, password }: { email: string; password: string }) => {
        try {
          const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
          const session = createFirebaseSession(credential.user);
          emit('SIGNED_IN', session);
          return { data: { user: mapFirebaseUser(credential.user), session }, error: null };
        } catch (error: any) {
          return { data: { user: null, session: null }, error: { message: error?.message ?? 'Account creation failed.' } };
        }
      },
    },
    rpc: async (name: string, params?: Record<string, unknown>) => {
      if (name === 'has_role') {
        const user = firebaseAuth.currentUser;
        const email = user?.email?.toLowerCase() ?? '';
        const allowed = [LOCAL_ADMIN_EMAIL, ...(String(import.meta.env['VITE_ADMIN_EMAILS'] ?? '') || '')]
          .flatMap((entry) => entry.split(',').map((value) => value.trim().toLowerCase()))
          .filter(Boolean);
        const isAdmin = !!user && (email === LOCAL_ADMIN_EMAIL || allowed.includes(email));
        return { data: isAdmin, error: null };
      }
      return { data: null, error: null };
    },
  } as any;
}

export function hasSupabaseConfig() {
  return hasFirebaseConfig() || !!(import.meta.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL']) && !!(import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || process.env['SUPABASE_PUBLISHABLE_KEY']);
}

export function isLocalFallbackMode() {
  return !hasSupabaseConfig();
}

export function isProductionAuthMode() {
  return hasSupabaseConfig();
}

function createFallbackSupabaseClient() {
  const listeners = new Set<(event: string, session: any) => void>();

  const emit = (event: string, session: any) => {
    listeners.forEach((listener) => listener(event, session));
  };

  return {
    from(table: LocalTableName) {
      return createLocalQueryBuilder(table);
    },
    auth: {
      getSession: async () => ({ data: { session: readLocalAuthSession() }, error: null }),
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        listeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe() {
                listeners.delete(callback);
              },
            },
          },
        };
      },
      signOut: async () => {
        clearLocalAuthSession();
        emit('SIGNED_OUT', null);
        return { error: null };
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const users = readLocalAdminUsers();
        const user = users.find((candidate) => candidate.email.toLowerCase() === String(email).trim().toLowerCase() && candidate.password === String(password));
        if (!user) {
          const defaultAdmin = ensureLocalAdminUser();
          if (String(email).trim().toLowerCase() === defaultAdmin.email && String(password) === defaultAdmin.password) {
            const session = createLocalAuthSession(defaultAdmin);
            emit('SIGNED_IN', session);
            return { data: { user: session.user, session }, error: null };
          }
          return { data: { user: null, session: null }, error: { message: 'Invalid email or password.' } };
        }

        const session = createLocalAuthSession(user);
        emit('SIGNED_IN', session);
        return { data: { user: session.user, session }, error: null };
      },
      signUp: async ({ email, password }: { email: string; password: string }) => {
        const normalizedEmail = String(email).trim().toLowerCase();
        const users = readLocalAdminUsers();
        const existing = users.find((candidate) => candidate.email.toLowerCase() === normalizedEmail);

        if (existing) {
          return { data: { user: { id: existing.id, email: existing.email }, session: null }, error: null };
        }

        const user: LocalAdminUser = {
          id: `local-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          email: normalizedEmail,
          password: String(password),
          role: 'admin',
          created_at: new Date().toISOString(),
        };

        const nextUsers = [user, ...users];
        writeLocalAdminUsers(nextUsers);
        const session = createLocalAuthSession(user);
        emit('SIGNED_IN', session);
        return { data: { user: session.user, session }, error: null };
      },
    },
    rpc: async (name: string, params?: Record<string, unknown>) => {
      if (name === 'has_role') {
        const session = readLocalAuthSession();
        const userEmail = session?.user?.email;
        if (!userEmail || params?._role !== 'admin') {
          return { data: false, error: null };
        }

        const users = readLocalAdminUsers();
        const hasAdminAccess = users.some(
          (user) => user.email.toLowerCase() === String(userEmail).toLowerCase() && user.role === 'admin',
        );
        return { data: hasAdminAccess, error: null };
      }
      return { data: null, error: null };
    },
    reset: () => {
      clearLocalAuthSession();
      writeLocalAdminUsers([]);
      resetLocalStore();
    },
  } as any;
}

function createSupabaseClient() {
  if (hasFirebaseConfig()) {
    return createFirebaseClient();
  }

  const SUPABASE_URL = import.meta.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL'];
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || process.env['SUPABASE_PUBLISHABLE_KEY'];

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ['SUPABASE_PUBLISHABLE_KEY'] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(', ')}. Connect Supabase in Lovable Cloud.`;
    console.warn(`[Supabase] ${message}. Falling back to a local CRUD backend.`);
    return createFallbackSupabaseClient();
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});

