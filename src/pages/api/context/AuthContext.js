import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { setCookie, deleteCookie } from 'cookies-next';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const response = await fetch('/api/auth/checkAuth', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUser({
            email: data.email
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

    checkLoggedIn();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Set user in state
        setUser({
          email: data.email
        });
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.message || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Login failed. Please try again.' 
      };
    }
  };

  // Signup function
  const signup = async (email, password, fullName) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await response.json();

      if (response.ok) {
        // Set user in state
        setUser({
          email: data.email
        });
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.message || 'Signup failed' 
        };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: 'Signup failed. Please try again.' 
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Clear user state
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Refresh user function
  const refreshUser = async () => {
    try {
      const cacheBuster = Date.now();
      const response = await fetch(`/api/users/me?_=${cacheBuster}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Update the user state with the fresh data
        setUser({
          email: data.email,
          fullName: data.fullName,
          id: data.id,
          role: data.role
        });
        
        // Clear any cached profile data
        if (typeof window !== 'undefined' && window.clearProfileCache) {
          window.clearProfileCache();
        }
        
        return data; // Important: return the data for components to use
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
    return null;
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    refreshUser, // Add this
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}