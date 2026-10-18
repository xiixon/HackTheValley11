import { createContext, type PropsWithChildren, useCallback, useContext, useState } from 'react';
import { apiUrl } from '../lib/api';
import type { RegistrationProfile } from '../../../../shared/src/types/User';

type Credentials = { email: string; password: string; firstName?: string; lastName?: string; profile?: RegistrationProfile };
type Session = { token: string; user: { id: string; firstName: string; lastName: string; email: string } };
type Auth = {
  session: Session | null;
  authenticate: (mode: 'login' | 'register', details: Credentials) => Promise<void>;
  signOut: () => void;
  authenticatedFetch: (path: string, options?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);

  async function authenticate(mode: 'login' | 'register', details: Credentials) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${apiUrl}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(response.status === 401 ? 'The email or password is incorrect.' :
          response.status === 409 ? 'This email already has an account. Please sign in.' :
          response.status === 400 ? 'Check your details and try again.' :
          'Sign-in is unavailable right now. Please try again later.');
      }
      const data = await response.json();
      if (typeof data.token !== 'string' || !data.token || typeof data.user?.id !== 'string' ||
          typeof data.user.firstName !== 'string' || typeof data.user.lastName !== 'string') {
        throw new Error('Could not complete sign-in. Please try again.');
      }
      setSession({ token: data.token, user: { ...data.user, email: details.email } });
    } catch (error) {
      if (error instanceof TypeError || (error instanceof Error && error.name === 'AbortError')) {
        throw new Error('Could not reach the server. Check your connection and try again.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  const authenticatedFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    if (!session) throw new Error('You must be signed in to access medication data.');
    const headers = new Headers(options.headers);
    headers.set('Authorization', ['Bearer', session.token].join(' '));
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const controller = new AbortController();
    const cancel = () => controller.abort();
    if (options.signal?.aborted) controller.abort();
    options.signal?.addEventListener('abort', cancel, { once: true });
    const timeout = setTimeout(cancel, 15000);
    try {
      const response = await fetch(`${apiUrl}${path}`, { ...options, headers, signal: controller.signal });
      if (!response.ok) {
        if (response.status === 401) {
          setSession(current => current?.token === session.token ? null : current);
          throw new Error('Your session has expired. Please sign in again.');
        }
        const body = await response.json().catch(() => null);
        const errors = Array.isArray(body?.errors) ? body.errors.filter((item: unknown) => typeof item === 'string').join(', ') : '';
        throw new Error(errors || (typeof body?.error === 'string' ? body.error : `Request failed (${response.status})`));
      }
      return response;
    } catch (cause) {
      if (controller.signal.aborted && !options.signal?.aborted) throw new Error('The server took too long to respond. Please try again.');
      if (cause instanceof TypeError) throw new Error('Could not reach the server. Check your connection and try again.');
      throw cause;
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', cancel);
    }
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, authenticate, signOut: () => setSession(null), authenticatedFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be inside AuthProvider');
  return auth;
}
