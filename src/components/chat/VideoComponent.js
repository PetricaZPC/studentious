import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/pages/api/context/AuthContext';
import AgoraRTC from 'agora-rtc-sdk-ng';

export default function VideoComponent({ roomId, onLeave }) {
  const { user } = useAuth();
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState({});
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [audioOnly, setAudioOnly] = useState(false);
  
  const agoraClient = useRef(null);
  const localVideoRef = useRef(null);
  
  // Check camera and microphone access before initializing
  useEffect(() => {
    const checkMediaPermissions = async () => {
      try {
        // Try to get user permissions first
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        return true;
      } catch (err) {
        console.warn('Media permissions check failed:', err);
        return false;
      }
    };
    
    checkMediaPermissions();
  }, []);

  // Initialize Agora client
  useEffect(() => {
    const initAgora = async () => {
      if (!user) {
        setError('You must be logged in.');
        return;
      }

      try {
        setLoading(true);
        console.log('Creating Agora client...');
        
        // Create Agora client with correct configuration
        agoraClient.current = AgoraRTC.createClient({ 
          mode: 'rtc', 
          codec: 'vp8',
        });
        
        // Add client-level event listeners
        agoraClient.current.on('connection-state-change', (curState, prevState) => {
          console.log(`Connection state changed from ${prevState} to ${curState}`);
        });
        
        // Fetch token with credentials
        console.log(`Fetching token for channel: ${roomId}`);
        const response = await fetch(`/api/agora/token?channel=${roomId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to get token');
        }
        
        const data = await response.json();
        console.log('Token obtained successfully');
        
        // Join channel with token
        console.log('Joining Agora channel...');
        await agoraClient.current.join(
          data.appId,
          data.channel,
          data.token,
          data.uid || user.id
        );
        
        console.log('Joined channel successfully, creating local tracks');

        try {
          // Create tracks with specific constraints
          const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
            {
              AEC: true, // Echo cancellation
              ANS: true, // Auto noise suppression
            }, 
            {
              encoderConfig: 'standard',
              facingMode: 'user'
            }
          );
          
          setLocalAudioTrack(audioTrack);
          setLocalVideoTrack(videoTrack);
          
          if (localVideoRef.current) {
            videoTrack.play(localVideoRef.current);
          }
          
          // Publish tracks
          console.log('Publishing local tracks');
          await agoraClient.current.publish([audioTrack, videoTrack]);
          console.log('Tracks published successfully');
        } catch (mediaError) {
          console.warn('Could not access video, trying audio only:', mediaError);
          
          if (mediaError.message && mediaError.message.includes('NOT_READABLE')) {
            // Handle camera access error - try audio only
            setAudioOnly(true);
            try {
              // Try to get audio only
              const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
              setLocalAudioTrack(audioTrack);
              
              // Publish audio only
              await agoraClient.current.publish([audioTrack]);
              console.log('Audio-only track published successfully');
            } catch (audioError) {
              console.error('Failed to get audio access as well:', audioError);
              throw new Error('Could not access camera or microphone. Please check your device permissions.');
            }
          } else {
            throw mediaError;
          }
        }
        
        agoraClient.current.on('user-published', handleUserPublished);
        agoraClient.current.on('user-unpublished', handleUserUnpublished);
        
      } catch (err) {
        console.error('Error initializing Agora client:', err);
        setError(`Video chat error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    initAgora();
    
    // Cleanup
    return () => {
      console.log('Cleaning up Agora resources');
      if (localAudioTrack) {
        localAudioTrack.close();
      }
      if (localVideoTrack) {
        localVideoTrack.close();
      }
      
      if (agoraClient.current) {
        agoraClient.current.leave();
      }
    };
  }, [roomId, user]);
  
  // Handle remote user published event
  const handleUserPublished = async (user, mediaType) => {
    await agoraClient.current.subscribe(user, mediaType);
    console.log(`Remote user ${user.uid} published ${mediaType}`);
    
    if (mediaType === 'video') {
      setRemoteUsers(prevUsers => ({
        ...prevUsers,
        [user.uid]: {
          ...prevUsers[user.uid],
          videoTrack: user.videoTrack,
        }
      }));
      
      // Play the remote video
      setTimeout(() => {
        if (user.videoTrack) {
          const remoteContainer = document.getElementById(`remote-video-${user.uid}`);
          if (remoteContainer) {
            console.log(`Playing remote video from user ${user.uid}`);
            user.videoTrack.play(remoteContainer);
          }
        }
      }, 100);
    }
    
    if (mediaType === 'audio') {
      setRemoteUsers(prevUsers => ({
        ...prevUsers,
        [user.uid]: {
          ...prevUsers[user.uid],
          audioTrack: user.audioTrack,
        }
      }));
      
      if (user.audioTrack) {
        user.audioTrack.play();
      }
    }
  };
  
  const handleUserUnpublished = (user, mediaType) => {
    setRemoteUsers((prev) => {
      const updated = { ...prev };
      delete updated[user.uid];
      return updated;
    });
  };

  // Render with better error handling
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg w-full text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button 
              onClick={() => {
                setError(null);
                setAudioOnly(false);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Try Again
            </button>
            <button 
              onClick={onLeave}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Back to Chat
            </button>
          </div>
          
          <div className="mt-4 text-left text-sm border-t border-gray-200 pt-4">
            <h4 className="font-semibold mb-2">Camera access troubleshooting:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Make sure you've granted camera permission to this website</li>
              <li>Check if another application is using your camera</li>
              <li>Try refreshing the page</li>
              <li>Try using a different browser</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Setting up video chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Video chat header */}
      <div className="flex justify-between items-center p-4 bg-gray-800 text-white">
        <div className="flex items-center">
          <button 
            onClick={onLeave}
            className="mr-2 p-2 rounded-full hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold">Video Chat: Room {roomId.substring(0, 8)}</h2>
        </div>
        
        {audioOnly && (
          <div className="px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-medium">
            Audio Only Mode
          </div>
        )}
        
        <div className="text-sm bg-gray-700 px-3 py-1 rounded-full">
          {Object.keys(remoteUsers).length + 1} participants
        </div>
      </div>
      
      {/* Video grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
        {/* Local video */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          {audioOnly ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <div className="h-20 w-20 mx-auto mb-3 rounded-full bg-gray-700 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-gray-300">Camera disabled</p>
              </div>
            </div>
          ) : (
            <div ref={localVideoRef} className="absolute inset-0"></div>
          )}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
            You
          </div>
        </div>
        
        {/* Remote users */}
        {Object.entries(remoteUsers).map(([uid, user]) => (
          <div key={uid} className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {user.videoTrack ? (
              <div id={`remote-video-${uid}`} className="absolute inset-0"></div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <div className="h-20 w-20 mx-auto mb-3 rounded-full bg-gray-700 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-300">Video off</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
              User {uid.toString().substring(0, 8)}
            </div>
          </div>
        ))}
      </div>
      
      {/* Audio/Video controls */}
      <div className="p-4 bg-gray-800 flex justify-center">
        <div className="flex space-x-4">
          {/* Mic toggle */}
          <button 
            onClick={() => {
              if (localAudioTrack) {
                localAudioTrack.setEnabled(!isAudioMuted);
                setIsAudioMuted(!isAudioMuted);
              }
            }}
            className={`p-3 rounded-full ${isAudioMuted ? 'bg-red-500' : 'bg-gray-700'} text-white hover:opacity-90`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          
          {/* Camera toggle (only if not in audio-only mode) */}
          {!audioOnly && (
            <button 
              onClick={() => {
                if (localVideoTrack) {
                  localVideoTrack.setEnabled(!isVideoMuted);
                  setIsVideoMuted(!isVideoMuted);
                }
              }}
              className={`p-3 rounded-full ${isVideoMuted ? 'bg-red-500' : 'bg-gray-700'} text-white hover:opacity-90`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}
          
          {/* Leave call */}
          <button 
            onClick={onLeave}
            className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}