import { useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Dynamically import Agora SDK to prevent server-side 'window is not defined' error
const VideoComponent = dynamic(() => import('@/components/chat/VideoComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading video chat...</p>
      </div>
    </div>
  ),
});

export default function VideoChat({ roomId }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  
  // Leave video chat handler
  const leaveVideoChat = () => {
    router.push(`/chatrooms?roomId=${roomId}`);
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900">Error</h3>
          <p className="mt-2 text-gray-500">{error}</p>
          <button 
            onClick={() => router.back()} 
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <VideoComponent roomId={roomId} onLeave={leaveVideoChat} />;
}