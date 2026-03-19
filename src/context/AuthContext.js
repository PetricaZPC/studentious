import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext(null);

/**
 * Provides authentication state and helpers for the application.
 *
 * This context keeps a cached user object, performs an initial auth check,
 * and exposes login/signup/logout helpers that hit the server API.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/checkAuth', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (response.ok) {
          const payload = await response.json();
          setUser({
            id: payload.id,
            uid: payload.id,
            email: payload.email,
            fullName: payload.fullName || '',
            role: payload.role || 'student',
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  async function login(email, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const payload = await response.json();

    if (response.ok) {
      setUser({
        id: payload.id,
        uid: payload.id,
        email: payload.email,
        fullName: payload.fullName || '',
        role: payload.role || 'student',
      });
      return { success: true };
    }

    return { success: false, error: payload.message || 'Login failed' };
  }

  async function signup(email, password, fullName) {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    });

    const payload = await response.json();

    if (response.ok) {
      setUser({
        id: payload.user.id,
        uid: payload.user.id,
        email: payload.user.email,
        fullName: payload.user.fullName || '',
        role: payload.user.role || 'student',
      });
      return { success: true };
    }

    return { success: false, error: payload.message || 'Signup failed' };
  }

  async function logout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    setUser(null);
    router.push('/login');
  }

  async function refreshUser() {
    const cacheBuster = Date.now();
    const response = await fetch(`/api/users/me?_=${cacheBuster}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      credentials: 'include',
    });

    if (!response.ok) return null;

    const payload = await response.json();
    const refreshed = {
      email: payload.email,
      fullName: payload.fullName,
      id: payload.id,
      role: payload.role,
    };

    setUser(refreshed);
    return refreshed;
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    refreshUser,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
