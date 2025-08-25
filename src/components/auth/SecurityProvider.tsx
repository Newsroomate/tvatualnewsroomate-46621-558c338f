
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { isSessionExpired, logSecurityEvent } from '@/utils/security-utils';

interface SecurityContextType {
  lastActivity: number;
  updateActivity: () => void;
  checkSession: () => boolean;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider = ({ children }: SecurityProviderProps) => {
  const { user, signOut } = useAuth();
  const [lastActivity, setLastActivity] = useState(Date.now());

  const updateActivity = () => {
    setLastActivity(Date.now());
  };

  const checkSession = (): boolean => {
    if (!user) return false;
    
    if (isSessionExpired(lastActivity)) {
      logSecurityEvent('access_denied', 'session_expired', user.id);
      signOut();
      return false;
    }
    
    return true;
  };

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      updateActivity();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Check session every 5 minutes
    const sessionInterval = setInterval(() => {
      if (user) {
        checkSession();
      }
    }, 5 * 60 * 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(sessionInterval);
    };
  }, [user, lastActivity]);

  const value = {
    lastActivity,
    updateActivity,
    checkSession
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
