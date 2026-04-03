import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Resources() {
  const router = useRouter();

  useEffect(() => {
    // Resources page is removed by request.
    // Redirect users back to dashboard (or another page) to prevent invalid UI.
    router.replace('/');
  }, [router]);

  return null;
}