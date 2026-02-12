/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  hasPermission: (module: string) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const rolePermissions: Record<UserRole, string[]> = {
  'System Admin': ['*'], // All modules
  'Sales Manager': ['dashboard', 'deals', 'reports', 'leads', 'contacts', 'accounts', 'tasks', 'communications'],
  'Sales Executive': ['dashboard', 'leads', 'contacts', 'accounts', 'deals', 'tasks', 'communications'],
  'Marketing Executive': ['dashboard', 'campaigns', 'leads', 'reports'],
  'Support Executive': ['dashboard', 'contacts', 'accounts', 'communications'],
  'Customer': ['dashboard', 'tickets']
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        mapSupabaseUser(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        mapSupabaseUser(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const mapSupabaseUser = async (authUser: any) => {
    try {
      // Fetch the REAL user profile from public.users using auth_id
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (error && (error.code === 'PGRST116' || error.message?.includes('0 rows'))) {
        // Profile doesn't exist in public.users yet. Auto-create it.
        console.warn('Profile missing in public.users. Auto-syncing from auth...');

        const role = (authUser.user_metadata?.role as UserRole) || 'System Admin';
        const tempUser: User = {
          id: authUser.id, // Temporary use auth ID
          authId: authUser.id,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          role: role,
          enabled: true,
          lastLogin: new Date().toISOString()
        };

        // Auto-sync will create the profile
        await api.syncUser(tempUser);

        // Re-fetch to get the real ID
        const { data: syncedData } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', authUser.id)
          .single();

        if (syncedData) {
          const mappedUser: User = {
            id: syncedData.id,
            authId: syncedData.auth_id,
            name: syncedData.name,
            email: syncedData.email,
            role: syncedData.role as UserRole,
            enabled: syncedData.enabled,
            lastLogin: new Date().toISOString()
          };
          setUser(mappedUser);
        } else {
          setUser(tempUser); // Fallback
        }
      } else if (data) {
        const mappedUser: User = {
          id: data.id,
          authId: data.auth_id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          enabled: data.enabled,
          lastLogin: new Date().toISOString()
        };
        setUser(mappedUser);
        // Update last login
        api.updateUser(data.id, { lastLogin: new Date().toISOString() }).catch(e => console.error('Failed to update last login:', e));
      }
    } catch (e) {
      console.error('Error mapping user', e);
    } finally {
      setLoading(false);
    }
  };


  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signup = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const hasPermission = (module: string): boolean => {
    if (!user) return false;
    const permissions = rolePermissions[user.role];
    return permissions.includes('*') || permissions.includes(module);
  };

  return (
    <AuthContext.Provider value={{ user, session, login, signup, logout, hasPermission, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
