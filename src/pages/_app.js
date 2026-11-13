import { AuthProvider } from '@/context/AuthContext';
import '../styles/globals.css';
import { useRouter } from 'next/router';
import AuthGuard from '@/components/AuthGuard';
import DemoBanner from '@/components/DemoBanner';
import { installDemoClient } from '@/utils/demoClient';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';

// Must run before any page effect fetches data, so it is done at module load (browser only).
installDemoClient();

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
      <DemoBanner />
    </AuthProvider>
  );
}

export default MyApp;
