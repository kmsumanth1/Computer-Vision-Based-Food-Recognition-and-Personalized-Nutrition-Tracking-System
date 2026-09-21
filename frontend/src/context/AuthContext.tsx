import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthResponse, AuthUser, LoginRequest, RegisterRequest } from '../types/auth';
import { authService } from '../services/auth';
import { profileService } from '../services/profile';
import { tokenStorage } from '../services/tokenStorage';
import { UNAUTHORIZED_EVENT } from '../services/api';
import { parseApiError } from '../utils/apiError';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (payload: LoginRequest) => Promise<AuthUser>;
  register: (payload: RegisterRequest) => Promise<AuthUser>;
  logout: () => void;
  /** Call after the profile setup request succeeds. */
  markProfileCompleted: (name?: string) => void;
  updateUserName: (name: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const applyUser = useCallback((next: AuthUser) => {
    tokenStorage.saveUser(next);
    setUser(next);
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // Restore the session on first load and confirm whether profile setup is done.
  useEffect(() => {
    let cancelled = false;
    const token = tokenStorage.getToken();
    const stored = tokenStorage.getUser();
    if (!token || !stored) {
      clearSession();
      return;
    }
    (async () => {
      try {
        const { profile } = await profileService.get();
        if (!cancelled) applyUser({ ...stored, name: profile.name || stored.name, profile_completed: true });
      } catch (error) {
        if (cancelled) return;
        const info = parseApiError(error);
        if (info.status === 401) clearSession();
        else if (info.status === 404) applyUser({ ...stored, profile_completed: false });
        else applyUser(stored); // offline or server hiccup: keep the session
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyUser, clearSession]);

  // The axios interceptor fires this when the API says the token is no longer valid.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, clearSession);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, clearSession);
  }, [clearSession]);

  const startSession = useCallback(
    (response: AuthResponse): AuthUser => {
      tokenStorage.save(response.access_token, response.user);
      setUser(response.user);
      setStatus('authenticated');
      return response.user;
    },
    [],
  );

  const login = useCallback(async (payload: LoginRequest) => startSession(await authService.login(payload)), [startSession]);
  const register = useCallback(
    async (payload: RegisterRequest) => startSession(await authService.register(payload)),
    [startSession],
  );

  const markProfileCompleted = useCallback((name?: string) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, name: name || current.name, profile_completed: true };
      tokenStorage.saveUser(next);
      return next;
    });
  }, []);

  const updateUserName = useCallback((name: string) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, name };
      tokenStorage.saveUser(next);
      return next;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout: clearSession, markProfileCompleted, updateUserName }),
    [status, user, login, register, clearSession, markProfileCompleted, updateUserName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
