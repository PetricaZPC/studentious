import clientPromise from '../auth/mongodb';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get channel name from the query
    const { channelName, deviceId } = req.query;
    
    if (!channelName) {
      return res.status(400).json({ message: "Channel name is required" });
    }

    // Generate a unique UID for this user
    // Make the uid calculation more random but still numeric
    const generateNumericUid = (deviceId) => {
      // For consistent user IDs across sessions on the same device
      if (deviceId) {
        // Use only the deviceId for hashing to keep the same ID across sessions
        let hash = 0;
        for (let i = 0; i < deviceId.length; i++) {
          hash = ((hash << 5) - hash) + deviceId.charCodeAt(i);
          hash |= 0;
        }
        
        // Add the current timestamp's last 4 digits to ensure uniqueness between calls
        const timeComponent = Date.now() % 10000;
        
        // Important: Make sure this is a positive 7-digit number by taking modulo and adding offset
        return ((Math.abs(hash) % 9000000) + 1000000) ^ timeComponent;
      } else {
        // Add current timestamp to avoid collisions between different users
        return Math.floor(1000000 + Math.random() * 9000000);
      }
    };

    const uid = generateNumericUid(deviceId);

    // Get credentials from environment variables
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    
    if (!appID || !appCertificate) {
      return res.status(500).json({ message: "Agora credentials not configured" });
    }
    
    // Set expiration time (1 hour)
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    // Generate token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );
    
    // Include TURN server info for NAT traversal
    return res.status(200).json({
      appId: appID,
      token,
      uid,
      channel: channelName,
      userName: `User-${uid.toString().slice(-4)}`,
      turnServer: {
        url: 'turn:global.turn.twilio.com:3478?transport=udp',
        username: `${uid}`,
        credential: token.substring(0, 16)
      },
      timestamp: Date.now(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error("Error generating Agora token:", error);
    return res.status(500).json({ 
      message: "Error generating token", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}