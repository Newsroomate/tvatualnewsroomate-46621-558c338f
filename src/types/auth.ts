
import { Session, User } from "@supabase/supabase-js";
import { Dispatch, SetStateAction } from "react";

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  userPermissions: string[];
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  cleanupAuthState: () => void;
}

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'editor_chefe' | 'editor' | 'reporter' | 'produtor';

export interface AuthProviderProps {
  children: React.ReactNode;
}

export interface UseAuthResult extends AuthContextType {
  setSession: Dispatch<SetStateAction<Session | null>>;
  setUser: Dispatch<SetStateAction<User | null>>;
  setProfile: Dispatch<SetStateAction<UserProfile | null>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}
