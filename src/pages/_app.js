import { AuthProvider } from './api/context/AuthContext';
import '../styles/globals.css';
import { useRouter } from 'next/router';
import AuthGuard from './api/AuthGuard';
import { useEffect } from 'react';

const publicPaths = ['/login', '/signup', '/'];

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isPublicPath = publicPaths.includes(router.pathname);

  useEffect(() => {
    // Define a global function to clear profile cache
    window.clearProfileCache = () => {
      console.log('Clearing all profile caches');
      localStorage.removeItem('profile_data');
      sessionStorage.clear();
      
      // Also try to call cache-clearing API
      fetch('/api/users/clear-cache', {
        method: 'POST',
        credentials: 'include'
      }).catch(e => console.log('Cache clear error (ignorable):', e));
    };
    
    return () => {
      delete window.clearProfileCache;
    };
  }, []);

  return (
    <AuthProvider>
      {isPublicPath ? (
        <Component {...pageProps} />
      ) : (
        <AuthGuard>
          <Component {...pageProps} />
        </AuthGuard>
      )}
    </AuthProvider>
  );
}

export default MyApp;
