import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import type { LoginResponse, User } from '../types';

const TOKEN_KEY = 'akb_access_token';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  checking: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Any authenticated API 401 invalidates the browser session in one place.
    const handleUnauthorized = () => {
      sessionStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      navigate('/login');
    };
    window.addEventListener('akb:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('akb:unauthorized', handleUnauthorized);
  }, [navigate]);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }

    let active = true;
    apiRequest<User>('/auth/me', {}, token)
      .then((currentUser) => { if (active) setUser(currentUser); })
      .catch(() => {
        if (active) {
          sessionStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => { if (active) setChecking(false); });

    return () => { active = false; };
  }, [token]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    checking,
    async login(email, password) {
      const response = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      sessionStorage.setItem(TOKEN_KEY, response.accessToken);
      setToken(response.accessToken);
      setUser(response.user);
      setChecking(false);
      navigate('/');
    },
    async logout() {
      try {
        if (token) await apiRequest('/auth/logout', { method: 'POST' }, token);
      } finally {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        navigate('/login');
      }
    },
  }), [checking, navigate, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
