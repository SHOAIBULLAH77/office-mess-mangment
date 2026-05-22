import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (emailOrUsername?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check active sessions and sets the user
    const getInitialSession = async () => {
      try {
        // First check if there is a mock user in localStorage
        const storedMockUser = localStorage.getItem('mock_user');
        if (storedMockUser) {
          setUser(JSON.parse(storedMockUser));
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (e) {
        console.error("Failed to get session", e);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only set from session if there isn't a mock user active
      const storedMockUser = localStorage.getItem('mock_user');
      if (storedMockUser) {
        setUser(JSON.parse(storedMockUser));
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (emailOrUsername?: string, password?: string) => {
    if (!supabase) {
      return { success: false, error: 'Supabase client is not configured' };
    }

    if (emailOrUsername && password) {
      // Local fallback for admin/SHOAIB123
      if ((emailOrUsername === 'admin' || emailOrUsername === 'admin@example.com') && password === 'SHOAIB123') {
        const mockUser = {
          id: 'mock-admin-id',
          email: 'admin@example.com',
          user_metadata: { name: 'Admin' }
        } as any;
        setUser(mockUser);
        localStorage.setItem('mock_user', JSON.stringify(mockUser));
        return { success: true };
      }

      // Try regular Supabase auth
      const email = emailOrUsername.includes('@') ? emailOrUsername : `${emailOrUsername}@example.com`;
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Login failed' };
      }
    } else {
      // OAuth flow
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    }
  };

  const logout = async () => {
    localStorage.removeItem('mock_user');
    setUser(null);
    setSession(null);
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-orange-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">Configuration Required</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Please set up your Supabase environment variables in the <strong>Settings &gt; Secrets</strong> panel to continue:
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3 text-sm font-mono bg-gray-50 p-2 rounded">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              VITE_SUPABASE_URL
            </li>
            <li className="flex items-center gap-3 text-sm font-mono bg-gray-50 p-2 rounded">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              VITE_SUPABASE_ANON_KEY
            </li>
          </ul>
          <p className="text-xs text-gray-400 italic">
            Note: You can find these in your Supabase Project Settings &gt; API.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
