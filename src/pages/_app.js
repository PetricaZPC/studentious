import { AuthProvider } from './api/context/AuthContext';
import '../styles/globals.css';
import { useRouter } from 'next/router';
import AuthGuard from './api/AuthGuard';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';

// Initialize email scheduler on server side only
if (typeof window === 'undefined') {
  import('./api/scheduler').catch(console.error);
}

// Dynamic import for AgoraRTC
const AgoraRTC = dynamic(
  () => import('agora-rtc-sdk-ng').then(mod => {
    // Configure Agora in development
    if (process.env.NODE_ENV === 'development') {
      mod.default.setLogLevel(1);
    }
    return mod.default;
  }).catch(err => {
    console.error('Failed to load Agora:', err);
    return null;
  }),
  { ssr: false }
);

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isPublicPath = ['/', '/login', '/signup'].includes(router.pathname);

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
