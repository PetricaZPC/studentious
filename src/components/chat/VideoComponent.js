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
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  const agoraClient = useRef(null);
  const localVideoRef = useRef(null);
  
  // Initialize Agora client
  useEffect(() => {
    // Maximum retry attempts
    const MAX_RETRIES = 3;
    
    const initAgora = async () => {
      if (!user) {
        setError('You must be logged in.');
        return;
      }

      try {
        setLoading(true);
        console.log('Creating Agora client...');
        
        // Create Agora client with more specific options
        agoraClient.current = AgoraRTC.createClient({ 
          mode: 'rtc', 
          codec: 'vp8',
          proxyServer: 'auto', // Try auto proxy detection
          turnServer: {
            // Use Agora's TURN service as fallback
            forceTurn: true,
            // Credentials will be obtained automatically from token
          }
        });
        
        // Add client-level event listeners
        agoraClient.current.on('connection-state-change', (curState, prevState) => {
          console.log(`Connection state changed from ${prevState} to ${curState}`);
        });
        
        agoraClient.current.on('exception', (event) => {
          console.warn(`Agora client exception: ${event.code}, ${event.msg}`);
        });
        
        // Fetch token with credentials: include for proper cookie handling
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
        
        agoraClient.current.on('user-published', handleUserPublished);
        agoraClient.current.on('user-unpublished', handleUserUnpublished);
        
      } catch (err) {
        console.error('Error initializing Agora client:', err);
        
        // Handle specific error codes
        if (err.message.includes('network disconnected') || 
            err.message.includes('Websocket') || 
            err.message.includes('connection')) {
          
          // Connection error - try again if under max retries
          if (connectionAttempts < MAX_RETRIES) {
            console.log(`Connection attempt ${connectionAttempts + 1} failed, retrying...`);
            setConnectionAttempts(prev => prev + 1);
            // Wait 2 seconds before retrying
            setTimeout(initAgora, 2000);
            return;
          }
          
          setError('Failed to connect to video service. Please check your internet connection and firewall settings.');
        } else if (err.message.includes('logged in')) {
          setError('Authentication error. Please log in again.');
        } else {
          setError(`Video chat error: ${err.message}`);
        }
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
  }, [roomId, connectionAttempts, user]);
  
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
                setConnectionAttempts(0);
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

  // Render the UI...
  return (
    <div>
      <div ref={localVideoRef} style={{ width: '100%', height: '400px', background: '#000' }}></div>
      {/* Render remote users */}
    </div>
  );
}