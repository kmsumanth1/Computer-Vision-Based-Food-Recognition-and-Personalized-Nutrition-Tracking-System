import type { AuthUser } from '../types/auth';

/**
 * Auth strategy: the JWT access token is kept in localStorage so the session survives a refresh.
 * If you later move to httpOnly cookies, this file (and the request interceptor in api.ts)
 * are the only places that need to change.
 */
const TOKEN_KEY = 'afcm.token';
const USER_KEY = 'afcm.user';

export const tokenStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },
  save(token: string, user: AuthUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  saveUser(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
