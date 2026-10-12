import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  isSessionValid: () => boolean;
  getSessionExpiryTime: () => number | null;
  ensureValidSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First check for existing session
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          console.log('[Auth] Found existing session, refreshing...');
          
          // Try to refresh the session immediately
          let retries = 3;
          let refreshed = false;
          
          while (retries > 0 && !refreshed) {
            const { data, error } = await supabase.auth.refreshSession();
            
            if (!error && data.session) {
              console.log('[Auth] Session refreshed successfully');
              setSession(data.session);
              setUser(data.session.user);
              refreshed = true;
            } else if (retries > 1) {
              console.log(`[Auth] Refresh failed, retrying... (${retries - 1} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
              retries--;
            } else {
              console.log('[Auth] Using existing session after refresh failures');
              setSession(existingSession);
              setUser(existingSession.user);
              retries--;
            }
          }
        }
      } catch (error) {
        console.error('[Auth] Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Background session refresh - Keep alive for 21 days
  useEffect(() => {
    if (!session) return;

    const refreshInterval = setInterval(async () => {
      const expiresAt = session.expires_at;
      if (!expiresAt) return;
      
      // Check if user was active in last 21 days
      const twentyOneDaysAgo = Date.now() - (21 * 24 * 60 * 60 * 1000);
      if (lastActivity < twentyOneDaysAgo) {
        console.log('[Auth] User inactive for 21+ days, skipping refresh');
        return;
      }
      
      // Refresh if session expires in less than 50 minutes (to ensure it stays fresh)
      const fiftyMinutesFromNow = Date.now() + (50 * 60 * 1000);
      if (expiresAt * 1000 < fiftyMinutesFromNow) {
        console.log('[Auth] Background refresh triggered (21-day mode)');
        await refreshSession();
      }
    }, 30 * 60 * 1000); // Check every 30 minutes

    return () => clearInterval(refreshInterval);
  }, [session, lastActivity]);

  // Track user activity
  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now());
    
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, updateActivity));
    
    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      console.log('[Auth] Refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        console.log('[Auth] Session refreshed successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Auth] Failed to refresh session:', error);
      return false;
    }
  };

  const isSessionValid = (): boolean => {
    if (!session) return false;
    const expiresAt = session.expires_at;
    if (!expiresAt) return false;
    
    // Check if session expires in more than 1 minute
    return expiresAt * 1000 > Date.now() + 60000;
  };

  const ensureValidSession = async (): Promise<boolean> => {
    if (!session) return false;
    
    const expiresAt = session.expires_at;
    if (!expiresAt) return false;
    
    // Check if user was active in last 21 days
    const twentyOneDaysAgo = Date.now() - (21 * 24 * 60 * 60 * 1000);
    if (lastActivity < twentyOneDaysAgo) {
      console.log('[Auth] User inactive for 21+ days, session expired');
      await signOut();
      return false;
    }
    
    // If session expires in less than 10 minutes, refresh it
    const tenMinutesFromNow = Date.now() + (10 * 60 * 1000);
    if (expiresAt * 1000 < tenMinutesFromNow) {
      console.log('[Auth] Session expiring soon, refreshing... (21-day persistence)');
      return await refreshSession();
    }
    
    return true;
  };

  const getSessionExpiryTime = (): number | null => {
    if (!session?.expires_at) return null;
    return session.expires_at * 1000;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signOut,
      refreshSession,
      isSessionValid,
      getSessionExpiryTime,
      ensureValidSession
    }}>
      {children}
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
