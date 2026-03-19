import { AuthProvider } from '@/context/AuthContext';
import '../styles/globals.css';
import { useRouter } from 'next/router';
import AuthGuard from '@/components/AuthGuard';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';

if (typeof window === 'undefined') {
  import('./api/scheduler').catch(console.error);
}

const AgoraRTC = dynamic(
  () => import('agora-rtc-sdk-ng').then(mod => {
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
