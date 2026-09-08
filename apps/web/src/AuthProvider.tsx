import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError, SessionUser } from './api';
import { AuthContext } from './auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api.me()
      .then((result) => setUser(result.data.user))
      .catch((error) => {
        if (!(error instanceof ApiError) || error.status !== 401) console.error(error);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string, remember: boolean) => {
    const result = await api.login({ username, password, remember });
    setUser(result.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
