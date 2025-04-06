import { useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Dynamically import Agora SDK to prevent server-side 'window is not defined' error
const VideoComponent = dynamic(() => import('@/components/chat/VideoComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-900">
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-400 mx-auto mb-4"></div>
        <p className="text-indigo-200">Connecting to video session...</p>
      </div>
    </div>
  ),
});

export default function VideoChat({ roomId, onLeave }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  
  // Leave video chat handler
  const leaveVideoChat = () => {
    if (onLeave) {
      onLeave();
    } else {
      router.push(`/chatrooms?roomId=${roomId}`);
    }
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center p-8 bg-gray-800 rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-white">Video Chat Error</h3>
          <p className="mt-2 text-gray-300">{error}</p>
          <button 
            onClick={leaveVideoChat} 
            className="mt-6 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Return to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
      <VideoComponent 
        roomId={roomId} 
        onLeave={leaveVideoChat} 
        onError={setError} 
      />
    </div>
  );
}