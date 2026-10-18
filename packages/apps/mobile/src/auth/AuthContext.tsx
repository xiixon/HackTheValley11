import { createContext, type PropsWithChildren, useContext, useState } from 'react';
import { apiUrl } from '../lib/api';
import type { RegistrationProfile } from '../../../../shared/src/types/User';

type Credentials = { email: string; password: string; firstName?: string; lastName?: string; profile?: RegistrationProfile };
type Session = {
  token: string;
  user: { id: string; firstName: string; lastName: string; email: string };
};
type Auth = {
  session: Session | null;
  authenticate: (mode: 'login' | 'register', details: Credentials) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  // Keep this project's session in memory. Relaunching requires signing in again.
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

  return (
    <AuthContext.Provider value={{ session, authenticate, signOut: () => setSession(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be inside AuthProvider');
  return auth;
}
