
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType, AuthProviderProps, UserProfile } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { PermissionType } from '@/services/user-permissions-api';

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  userPermissions: [],
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
  const [userPermissions, setUserPermissions] = useState<PermissionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Utility function to clean up auth state
  const cleanupAuthState = () => {
    // Remove standard auth tokens
    localStorage.removeItem('supabase.auth.token');
    
    // Remove all Supabase auth keys
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Also clean sessionStorage if used
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  };

  // Fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        // Check if user has telejornal-specific exceptions
        const { data: accessData } = await supabase
          .from('user_telejornal_access')
          .select('role')
          .eq('user_id', userId)
          .limit(1)
          .single();

        // If user has exception, use that role instead of global role
        const effectiveRole = accessData?.role || data.role;
        
        setProfile({
          ...data,
          role: effectiveRole
        } as UserProfile);

        // Fetch user's granular permissions
        const { data: perms } = await supabase
          .from('user_permissions')
          .select('permission')
          .eq('user_id', userId);

        setUserPermissions((perms || []).map(p => p.permission as PermissionType));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        toast({
          title: 'Erro ao entrar',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      if (data.session && data.user) {
        console.log('Sign in successful, session established:', {
          userId: data.user.id,
          sessionExists: !!data.session
        });
        
        setSession(data.session);
        setUser(data.user);
        
        toast({
          title: 'Login bem-sucedido',
          description: 'Você entrou com sucesso.',
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error('Sign in exception:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao tentar entrar',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setIsLoading(true);
      
      // Clean up state before signing up
      cleanupAuthState();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast({
          title: 'Erro ao cadastrar',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Cadastro realizado',
        description: 'Seu cadastro foi realizado. Você já pode fazer login.',
      });

      // Navigate to login page
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao tentar cadastrar',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Clean up auth state
      cleanupAuthState();
      
      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear local state
      setSession(null);
      setUser(null);
      setProfile(null);
      setUserPermissions([]);
      
      toast({
        title: 'Logout bem-sucedido',
        description: 'Você saiu da sua conta.',
      });
      
      // Force navigation to auth page
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: 'Erro ao sair',
        description: error.message || 'Ocorreu um erro ao tentar sair',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            fetchUserProfile(newSession.user.id);
          }, 0);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setUserPermissions([]);
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
          await fetchUserProfile(existingSession.user.id);
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
    userPermissions,
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
