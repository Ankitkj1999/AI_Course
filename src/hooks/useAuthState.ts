import { useState, useEffect } from 'react';

export interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userId: string | null;
}

export function useAuthState(): AuthState {
  // Initialize synchronously with localStorage values to prevent redirect loops
  const [authState, setAuthState] = useState<AuthState>(() => {
    const uid = localStorage.getItem('uid');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    return {
      isAuthenticated: !!uid,
      isAdmin,
      userId: uid,
    };
  });

  useEffect(() => {
    const checkAuthState = () => {
      const uid = localStorage.getItem('uid');
      const isAdmin = localStorage.getItem('isAdmin') === 'true';

      setAuthState({
        isAuthenticated: !!uid,
        isAdmin,
        userId: uid,
      });
    };

    // Listen for storage changes (e.g., login/logout in another tab)
    window.addEventListener('storage', checkAuthState);

    return () => {
      window.removeEventListener('storage', checkAuthState);
    };
  }, []);

  return authState;
}
