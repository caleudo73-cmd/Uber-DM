import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import { setSessionExpiredHandler } from '../services/http';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '../services/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const startSession = useCallback(async ({ user: sessionUser, accessToken, refreshToken }) => {
    await saveTokens({ accessToken, refreshToken });
    setUser(sessionUser);
  }, []);

  const signIn = useCallback(
    async (email, password) => startSession(await authService.login(email, password)),
    [startSession]
  );

  const signUp = useCallback(
    async (payload) => startSession(await authService.register(payload)),
    [startSession]
  );

  const signOut = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) await authService.logout(refreshToken).catch(() => {});
    await clearTokens();
    setUser(null);
  }, []);

  // Restaura la sesión al abrir la app
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    (async () => {
      try {
        if (await getAccessToken()) setUser((await authService.fetchMe()).user);
      } catch {
        setUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const value = useMemo(
    () => ({ user, booting, signIn, signUp, signOut }),
    [user, booting, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
