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
  const [participantCount, setParticipantCount] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const [connectionState, setConnectionState] = useState('CONNECTING');

  const agoraClient = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    const initializeAgora = async () => {
      try {
        // Initialize Agora client with cloud proxy support
        agoraClient.current = AgoraRTC.createClient({ 
          mode: 'rtc',  // Keep this as 'rtc' for peer-to-peer video chat
          codec: 'vp8',
          enableCloudProxy: true,
        });

        // Add connection state change listener
        agoraClient.current.on('connection-state-change', (curState, prevState) => {
          console.log(`Connection state changed from ${prevState} to ${curState}`);
          setConnectionState(curState);
        });

        // Helper function to generate device fingerprint
        const generateDeviceFingerprint = () => {
          const nav = window.navigator;
          const screen = window.screen;
          let fingerprint = nav.userAgent + screen.width + screen.height + screen.colorDepth;
          
          // Add timestamp to ensure uniqueness
          fingerprint += new Date().getTime();
          
          // Simple hash function
          let hash = 0;
          for (let i = 0; i < fingerprint.length; i++) {
            hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
          }
          return Math.abs(hash).toString();
        };

        // Get Agora token with device fingerprint to ensure unique IDs
        const deviceFingerprint = generateDeviceFingerprint();
        const response = await fetch(`/api/agora/token?channelName=${roomId}&deviceId=${deviceFingerprint}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to get token');
        }
        
        const data = await response.json();

        console.log('Joining channel with UID:', data.uid, 'and name:', data.userName);

        // Set current user info 
        setCurrentUser({
          uid: data.uid,
          name: data.userName
        });

        // Configure client before joining
        await agoraClient.current.enableDualStream();

        // Join channel with the token
        await agoraClient.current.join(
          data.appId,
          data.channel,
          data.token,
          data.uid
        );

        // Set up TURN server if provided
        if (data.turnServer) {
          try {
            await agoraClient.current.setTurnServer([{
              urls: [data.turnServer.url],
              username: data.turnServer.username,
              credential: data.turnServer.credential
            }]);
            console.log('TURN server configured');
          } catch (err) {
            console.warn('Failed to set TURN server:', err);
          }
        }

        // Set user attributes to share display name
        try {
          await agoraClient.current.setLocalUserAttributes({
            name: data.userName
          });
        } catch (err) {
          console.warn('Failed to set user attributes:', err);
        }

        // Create and publish tracks with enhanced options
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          {
            AEC: true, // Echo cancellation
            ANS: true, // Auto noise suppression
            AGC: true, // Auto gain control
          }, 
          {
            encoderConfig: 'standard',
            facingMode: 'user'
          }
        );

        // Prevent echo by setting local audio volume to 0
        audioTrack.setVolume(0);
        
        await agoraClient.current.publish([audioTrack, videoTrack]);

        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
        
        // Play local video
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

        // Handle remote users
        const handleUserPublished = async (user, mediaType) => {
          await agoraClient.current.subscribe(user, mediaType);
          console.log(`Remote user ${user.uid} published ${mediaType}`);
          
          // Try to get remote user's name
          let userName = `User-${user.uid}`;
          try {
            const attrs = await agoraClient.current.getUserAttributes(user.uid);
            if (attrs && attrs.name) {
              userName = attrs.name;
            }
          } catch (err) {
            console.warn('Failed to get user attributes:', err);
          }

          if (mediaType === 'video') {
            setRemoteUsers(prev => ({
              ...prev,
              [user.uid]: { ...prev[user.uid], videoTrack: user.videoTrack, name: userName }
            }));
            
            user.videoTrack.play(`remote-video-${user.uid}`);
          }
          
          if (mediaType === 'audio') {
            setRemoteUsers(prev => ({
              ...prev,
              [user.uid]: { ...prev[user.uid], audioTrack: user.audioTrack, name: userName }
            }));
            user.audioTrack.play();
          }

          setParticipantCount(Object.keys(remoteUsers).length + 1);
        };

        agoraClient.current.on('user-published', handleUserPublished);

        // Handle user left
        agoraClient.current.on('user-left', (user) => {
          setRemoteUsers(prev => {
            const next = { ...prev };
            delete next[user.uid];
            return next;
          });
          setParticipantCount(prevCount => prevCount - 1);
        });

        setLoading(false);
      } catch (err) {
        console.error('Error initializing video:', err);
        setError(err.message);
      }
    };

    initializeAgora();

    // Cleanup
    return () => {
      localAudioTrack?.close();
      localVideoTrack?.close();
      Object.values(remoteUsers).forEach(user => {
        user.audioTrack?.close();
        user.videoTrack?.close();
      });
      agoraClient.current?.leave();
    };
  }, [roomId]);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800">
        <h2 className="text-white text-lg font-semibold">
          Video Chat ({participantCount} participants)
        </h2>
        <div className="flex items-center space-x-4">
          {/* Controls */}
          <button
            onClick={() => {
              localAudioTrack?.setEnabled(!isAudioMuted);
              setIsAudioMuted(!isAudioMuted);
            }}
            className={`p-2 rounded-full ${isAudioMuted ? 'bg-red-500' : 'bg-gray-600'}`}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={isAudioMuted ? "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" : "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"} 
              />
            </svg>
          </button>
          <button
            onClick={() => {
              localVideoTrack?.setEnabled(!isVideoMuted);
              setIsVideoMuted(!isVideoMuted);
            }}
            className={`p-2 rounded-full ${isVideoMuted ? 'bg-red-500' : 'bg-gray-600'}`}
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={isVideoMuted ? "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" : "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"}
              />
            </svg>
          </button>
          <button
            onClick={onLeave}
            className="p-2 rounded-full bg-red-500"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Connection State */}
      {connectionState !== 'CONNECTED' && (
        <div className="bg-yellow-100 text-yellow-800 p-2 text-sm text-center">
          {connectionState === 'CONNECTING' && 'Connecting to video server...'}
          {connectionState === 'DISCONNECTED' && 'Disconnected from video server. Trying to reconnect...'}
          {connectionState === 'RECONNECTING' && 'Reconnecting to video server...'}
        </div>
      )}

      {/* Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Local Video */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <div ref={localVideoRef} className="absolute inset-0"></div>
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
            You {isVideoMuted && '(Camera Off)'}
          </div>
        </div>

        {/* Remote Videos */}
        {Object.entries(remoteUsers).map(([uid, user]) => (
          <div key={uid} className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <div id={`remote-video-${uid}`} className="absolute inset-0"></div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
              {user.name || `User ${uid}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}