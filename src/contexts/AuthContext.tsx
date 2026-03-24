/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session, AuthError } from '@supabase/supabase-js';

type UserRole = 'admin' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  userRole: UserRole;
  profile: { full_name: string; email: string; phone: string; country: string } | null;
  signUp: (email: string, password: string, fullName: string, phone: string, country: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<{ full_name: string; email: string; phone: string; country: string }>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);

  const checkUserRole = async (userId: string) => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
    const role = data?.role === 'admin' ? 'admin' : 'user';
    setUserRole(role);
    setIsAdmin(role === 'admin');
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('full_name, email, phone, country').eq('user_id', userId).maybeSingle();
    setProfile(data);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          checkUserRole(session.user.id);
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
        setUserRole('user');
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserRole(session.user.id);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone: string, country: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, phone, country },
      },
    });
    // Refresh profile after signup
    if (!error) {
      setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            fetchProfile(session.user.id);
          }
        });
      }, 1000);
    }
    return { error };
  };

  const updateProfile = async (data: Partial<{ full_name: string; email: string; phone: string; country: string }>) => {
    if (!user) return { error: new Error('No user logged in') };
    
    try {
      const { error } = await supabase.from('profiles').update(data).eq('user_id', user.id);
      if (error) return { error };
      
      // Refresh profile after update
      await refreshProfile();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Unknown error') };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, userRole, profile, signUp, signIn, signOut, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
