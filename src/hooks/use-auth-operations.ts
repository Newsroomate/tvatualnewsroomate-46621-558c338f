
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { cleanupAuthState } from '@/utils/auth-utils';
import { UserProfile } from '@/types/auth';

export const useAuthOperations = (
  setUser: React.Dispatch<React.SetStateAction<any>>,
  setSession: React.Dispatch<React.SetStateAction<any>>,
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Clean up existing state before signing in
      cleanupAuthState();
      
      // Attempt global sign out to clear any existing session
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: 'Erro ao entrar',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      if (data.user) {
        setSession(data.session);
        setUser(data.user);
        toast({
          title: 'Login bem-sucedido',
          description: 'Você entrou com sucesso.',
        });
        navigate('/');
      }
    } catch (error: any) {
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

  return { signIn, signUp, signOut };
};
