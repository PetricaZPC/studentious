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

  // Helper function to update participant count
  const updateParticipantCount = () => {
    // Need to manually count since remoteUsers state might not be updated yet
    const count = 1 + Object.keys(agoraClient.current.remoteUsers).length;
    console.log(`Updating participant count to ${count} (remote users: ${JSON.stringify(Object.keys(agoraClient.current.remoteUsers))})`);
    setParticipantCount(count);
  };

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

        // Add user-joined listener BEFORE joining
        agoraClient.current.on('user-joined', async (user) => {
          console.log(`User ${user.uid} joined the channel`);
          
          // Immediately add user to remoteUsers with placeholder data
          setRemoteUsers(prev => ({
            ...prev,
            [user.uid]: { 
              ...prev[user.uid], 
              uid: user.uid,
              name: `User-${user.uid}`,
              hasJoined: true
            }
          }));
          
          // Update participant count immediately when someone joins
          updateParticipantCount();
        });

        // Add user-published handler BEFORE joining
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
              [user.uid]: { 
                ...prev[user.uid], 
                videoTrack: user.videoTrack, 
                name: userName 
              }
            }));
            
            setTimeout(() => {
              try {
                const videoContainer = document.getElementById(`remote-video-${user.uid}`);
                if (videoContainer && user.videoTrack) {
                  user.videoTrack.play(videoContainer);
                }
              } catch (err) {
                console.warn(`Error playing video for user ${user.uid}:`, err);
              }
            }, 200);
          }
          
          if (mediaType === 'audio') {
            console.log(`Processing audio track for remote user ${user.uid}`);
            
            setRemoteUsers(prev => ({
              ...prev,
              [user.uid]: { 
                ...prev[user.uid], 
                audioTrack: user.audioTrack, 
                name: userName,
                hasAudio: true
              }
            }));
            
            // Important: Make sure audio is played properly
            try {
              if (user.audioTrack) {
                console.log(`Playing audio for user ${user.uid}`);
                // Make sure volume is set high enough
                user.audioTrack.setVolume(100);
                user.audioTrack.play();
              }
            } catch (audioPlayError) {
              console.error(`Error playing audio for user ${user.uid}:`, audioPlayError);
            }
          }
          
          // Update participant count
          updateParticipantCount();
        };

        agoraClient.current.on('user-published', handleUserPublished);

        // Add user-left handler BEFORE joining
        agoraClient.current.on('user-left', (user) => {
          console.log(`User ${user.uid} left the channel`);
          
          setRemoteUsers(prev => {
            const next = { ...prev };
            delete next[user.uid];
            return next;
          });
          
          // Update participant count
          updateParticipantCount();
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

        // Force a reconnection of all participants after a brief delay
        setTimeout(() => {
          console.log("Running delayed participant check...");
          
          // Re-check remote users
          const currentRemoteUsers = agoraClient.current.remoteUsers;
          console.log(`Delayed check found ${currentRemoteUsers.length} remote users`);
          
          // Force update participant count
          updateParticipantCount();
          
          // If we still don't see any remote users but expect to,
          // try toggling the local tracks to trigger network activity
          if (currentRemoteUsers.length === 0 && participantCount > 1) {
            console.log("No remote users found but expecting some. Refreshing local tracks...");
            if (localAudioTrack) {
              localAudioTrack.setMuted(true);
              setTimeout(() => localAudioTrack.setMuted(false), 500);
            }
          }
        }, 3000);

        // IMPORTANT: Add this to detect users already in the channel
        console.log("Checking for existing users in channel...");
        // Get existing users in the channel
        const remoteUsersInChannel = agoraClient.current.remoteUsers;
        console.log(`Found ${remoteUsersInChannel.length} existing users in channel`);

        // Process any users already in the channel
        if (remoteUsersInChannel.length > 0) {
          for (const remoteUser of remoteUsersInChannel) {
            console.log(`Processing existing user: ${remoteUser.uid}`);
            // Add to remoteUsers state
            setRemoteUsers(prev => ({
              ...prev,
              [remoteUser.uid]: { 
                uid: remoteUser.uid,
                name: `User-${remoteUser.uid}`,
                hasJoined: true
              }
            }));
            
            // Subscribe to their media
            if (remoteUser.hasVideo) {
              await agoraClient.current.subscribe(remoteUser, 'video');
              console.log(`Subscribed to existing user's video: ${remoteUser.uid}`);
            }
            
            if (remoteUser.hasAudio) {
              await agoraClient.current.subscribe(remoteUser, 'audio');
              console.log(`Subscribed to existing user's audio: ${remoteUser.uid}`);
            }
          }
          
          // Update participant count to include existing users
          updateParticipantCount();
        }

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

        // Update the audio track creation and handling sections

        // Replace the current audio track creation with this more robust approach:
        try {
          // Create audio track separately with refined settings
          console.log('Creating audio track with enhanced settings...');
          const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
            encoderConfig: {
              sampleRate: 48000,
              stereo: false,
              bitrate: 128
            },
            AEC: false,
            ANS: true,
            AGC: true
          });

          // Force re-permission for microphone access
          try {
            console.log('Requesting explicit microphone permission...');
            await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Microphone permission granted');
          } catch (permError) {
            console.error('Microphone permission error:', permError);
          }

          // Create video track separately
          console.log('Creating video track...');
          const videoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: 'standard',
            facingMode: 'user'
          });
          
          // Set tracks in state
          setLocalAudioTrack(audioTrack);
          setLocalVideoTrack(videoTrack);
          
          // Play local video only (not audio to avoid echo)
          if (localVideoRef.current) {
            videoTrack.play(localVideoRef.current);
          }
          
          // IMPORTANT: Only use setEnabled OR setMuted, not both!
          // Let's use setEnabled for consistency
          await audioTrack.setEnabled(true);
          await videoTrack.setEnabled(true);
          
          // Publish tracks
          console.log('Publishing tracks...');
          try {
            await agoraClient.current.publish([audioTrack, videoTrack]);
            console.log('All tracks published successfully');
          } catch (publishError) {
            console.error('Failed to publish tracks:', publishError);
            
            // Try publishing tracks separately
            try {
              console.log('Trying to publish audio track separately...');
              await agoraClient.current.publish(audioTrack);
              console.log('Audio track published successfully');
              
              try {
                console.log('Trying to publish video track separately...');
                await agoraClient.current.publish(videoTrack);
                console.log('Video track published successfully');
              } catch (videoError) {
                console.error('Failed to publish video track:', videoError);
              }
            } catch (audioError) {
              console.error('Failed to publish audio track:', audioError);
            }
          }
        } catch (err) {
          console.error('Error creating media tracks:', err);
          setError(`Could not access your camera or microphone: ${err.message}`);
          setLoading(false);
        }

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

  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    
    console.log = function(...args) {
      if (typeof args[0] === 'string' && (
        args[0].includes('audio level') || 
        args[0].includes('microphone') ||
        args[0].includes('Microphone') ||
        args[0].includes('Audio') ||
        args[0].includes('audio')
      )) {
        return; // Suppress these messages
      }
      return originalLog.apply(console, args);
    };
    
    console.warn = function(...args) {
      if (typeof args[0] === 'string' && (
        args[0].includes('microphone') || 
        args[0].includes('Microphone') ||
        args[0].includes('audio') ||
        args[0].includes('Audio')
      )) {
        return; // Suppress these messages
      }
      return originalWarn.apply(console, args);
    };
    
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header with controls */}
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-40 backdrop-filter backdrop-blur-sm border-b border-gray-700">
        <h2 className="text-white text-lg font-semibold flex items-center">
          <svg className="w-5 h-5 mr-2 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
          </svg>
          Video Chat ({participantCount} participants)
        </h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (localAudioTrack) {
                try {
                  const newMutedState = !isAudioMuted;
                  localAudioTrack.setEnabled(!newMutedState);
                  setIsAudioMuted(newMutedState);
                } catch (err) {
                  console.error('Error toggling audio:', err);
                }
              }
            }}
            className={`p-3 rounded-full transition-all duration-200 transform hover:scale-105 ${isAudioMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={isAudioMuted 
                  ? "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" 
                  : "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"} 
              />
            </svg>
          </button>
          <button
            onClick={() => {
              localVideoTrack?.setEnabled(!isVideoMuted);
              setIsVideoMuted(!isVideoMuted);
            }}
            className={`p-3 rounded-full transition-all duration-200 transform hover:scale-105 ${isVideoMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={isVideoMuted ? "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" : "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"}
              />
            </svg>
          </button>
          <button
            onClick={onLeave}
            className="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Connection State */}
      {connectionState !== 'CONNECTED' && (
        <div className="bg-yellow-400 text-yellow-900 p-2 text-sm text-center font-medium animate-pulse">
          {connectionState === 'CONNECTING' && 'Connecting to video server...'}
          {connectionState === 'DISCONNECTED' && 'Disconnected from video server. Trying to reconnect...'}
          {connectionState === 'RECONNECTING' && 'Reconnecting to video server...'}
        </div>
      )}

      {/* Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
        {/* Local Video */}
        <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-lg ring-2 ring-indigo-500 transform transition-transform duration-300 hover:scale-[1.02]">
          <div ref={localVideoRef} className="absolute inset-0"></div>
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
            <div className="flex items-center justify-between">
              <div className="text-white text-sm px-2 py-1 rounded-lg bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm">
                You {isVideoMuted && '(Camera Off)'}
              </div>
              {isAudioMuted ? (
                <div className="rounded-full bg-red-500 p-1">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                </div>
              ) : (
                <div className="rounded-full bg-green-500 p-1">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Remote Videos */}
        {Object.entries(remoteUsers).map(([uid, user]) => (
          <div 
            key={uid} 
            className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-lg transform transition-transform duration-300 hover:scale-[1.02]"
          >
            <div id={`remote-video-${uid}`} className="absolute inset-0"></div>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
              <div className="flex items-center justify-between">
                <div className="text-white text-sm px-2 py-1 rounded-lg bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm">
                  {user.name || `User ${uid}`}
                </div>
                {user.hasAudio ? (
                  <div className="rounded-full bg-green-500 p-1">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                ) : (
                  <div className="rounded-full bg-red-500 p-1">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Empty state when no one else has joined */}
        {Object.keys(remoteUsers).length === 0 && (
          <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video shadow-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
            <div className="text-center text-gray-400 p-6">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm mb-3">Waiting for others to join...</p>
              <p className="text-xs">Share the room link to invite others</p>
            </div>
          </div>
        )}
      </div>

      {/* Information bar at the bottom */}
      <div className="py-2 px-4 bg-gray-800 text-gray-400 text-xs flex justify-between items-center">
        <div>Room ID: {roomId}</div>
        <div className="flex items-center">
          <div className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></div>
          <span>Session active • {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}