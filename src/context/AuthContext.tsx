
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType, AuthProviderProps, UserProfile } from '@/types/auth';
import { cleanupAuthState, fetchUserProfile } from '@/utils/auth-utils';
import { useAuthOperations } from '@/hooks/use-auth-operations';

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  cleanupAuthState: () => {},
});

// Auth provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get auth operations
  const { signIn, signUp, signOut } = useAuthOperations(
    setUser,
    setSession,
    setProfile,
    setIsLoading
  );

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Fetch user profile after a small delay to prevent deadlocks
        if (newSession?.user) {
          setTimeout(() => {
            fetchUserProfile(newSession.user.id).then(profileData => {
              if (profileData) setProfile(profileData);
            });
          }, 0);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        
        if (existingSession?.user) {
          const profileData = await fetchUserProfile(existingSession.user.id);
          if (profileData) setProfile(profileData);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Context value
  const value: AuthContextType = {
    session,
    user,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
    cleanupAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
