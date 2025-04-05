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

  const agoraClient = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    const initializeAgora = async () => {
      try {
        // Initialize Agora client
        agoraClient.current = AgoraRTC.createClient({ 
          mode: 'rtc',
          codec: 'vp8'
        });

        // Get Agora token
        const response = await fetch(`/api/agora/token?channelName=${roomId}`);
        const { token, appId } = await response.json();

        // Join channel
        const uid = await agoraClient.current.join(appId, roomId, token, null);

        // Create and publish tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        await agoraClient.current.publish([audioTrack, videoTrack]);

        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
        
        // Play local video
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

        // Handle remote users
        agoraClient.current.on('user-published', async (user, mediaType) => {
          await agoraClient.current.subscribe(user, mediaType);
          
          if (mediaType === 'video') {
            setRemoteUsers(prev => ({
              ...prev,
              [user.uid]: { ...prev[user.uid], videoTrack: user.videoTrack }
            }));
            
            user.videoTrack.play(`remote-video-${user.uid}`);
          }
          
          if (mediaType === 'audio') {
            setRemoteUsers(prev => ({
              ...prev,
              [user.uid]: { ...prev[user.uid], audioTrack: user.audioTrack }
            }));
            user.audioTrack.play();
          }

          setParticipantCount(Object.keys(remoteUsers).length + 1);
        });

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
              User {uid}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}