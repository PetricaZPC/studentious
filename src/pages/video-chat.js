import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import VideoChat from '../components/VideoChat';
import { useAuth } from '../context/AuthContext';

export default function VideoChatPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const { room } = router.query;

  useEffect(() => {
    // Wait for router and authentication to be ready
    if (router.isReady && user) {
      setIsReady(true);
    }
  }, [router.isReady, user]);

  // Determine if the user is the host or a participant
  const isHost = !room;

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading video chat...</div>
      </div>
    );
  }

  // If no user is logged in, redirect to login
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

      <VideoChat 
        eventId={room || 'host-room'} 
        userId={user.uid} 
        isHost={isHost} 
      />

      {/* Add this to your event display component */}
      <button
        onClick={() => router.push(`/video-chat?room=event-${event.id}`)}
        className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Join Video
      </button>

      {/* Add this to your event management page for event creators */}
      <button
        onClick={() => router.push('/video-chat')}
        className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Host Video Session
      </button>
    </>
  );
}