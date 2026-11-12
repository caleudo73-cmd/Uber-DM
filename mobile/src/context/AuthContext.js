import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import { firebaseConfigError } from '../services/firebase';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // Firebase Auth es la fuente de verdad de la sesión.
  useEffect(() => {
    const unsubscribe = authService.subscribeToAuth((nextUser) => {
      setUser(nextUser);
      setBooting(false);
    });
    return unsubscribe;
  }, []);

  // El perfil se escucha aparte: así la aprobación del conductor llega en vivo,
  // sin que el usuario tenga que cerrar sesión.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return undefined;

    return authService.subscribeToProfile(userId, (data) => {
      setUser((current) =>
        current
          ? { ...current, ...data, id: current.id, email: current.email || data.email }
          : current
      );
    });
  }, [userId]);

  const signIn = useCallback((email, password) => authService.login(email, password), []);
  const signUp = useCallback((payload) => authService.register(payload), []);
  const signOut = useCallback(() => authService.logout(), []);

  const value = useMemo(
    () => ({ user, booting, configError: firebaseConfigError, signIn, signUp, signOut }),
    [user, booting, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
