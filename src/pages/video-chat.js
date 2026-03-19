import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import VideoChat from '../components/chat/VideoChat';
import { useAuth } from '../context/AuthContext';

/**
 * Video chat page.
 *
 * The `room` query parameter identifies the video room. If omitted, a default
 * host room ID is used.
 */
export default function VideoChatPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const roomId = router.query.room || 'host-room';

  useEffect(() => {
    if (router.isReady && user) {
      setIsReady(true);
    }
  }, [router.isReady, user]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading video chat...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <Head>
        <title>Video Chat | Studentious</title>
        <meta name="description" content="Join a video chat session" />
      </Head>

      <VideoChat roomId={roomId} />
    </>
  );
}
