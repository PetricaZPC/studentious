import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css';
import { useRouter } from 'next/router';
import AuthGuard from '../components/AuthGuard';

const publicPaths = ['/login', '/signup', '/'];

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isPublicPath = publicPaths.includes(router.pathname);

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
