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

    // Use device fingerprint to create a consistent ID for this user on this device
    const userIdBase = deviceId || req.headers['user-agent'] || 'anonymous';
    
    // Generate a numeric UID from the user ID
    // Extract digits and ensure it's within 32-bit range
    let uidStr = '';
    for (let i = 0; i < userIdBase.length; i++) {
      const code = userIdBase.charCodeAt(i);
      uidStr += (code % 10).toString();
      if (uidStr.length >= 8) break;
    }
    
    // Ensure UID is a valid number and unique
    const uid = parseInt(uidStr) || Math.floor(100000 + Math.random() * 900000);
    
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
      userId: userIdBase.substring(0, 8),
      userName: `User-${uid.toString().substring(0, 4)}`,
      turnServer: {
        url: 'turn:global.turn.twilio.com:3478?transport=udp',
        username: uid.toString(),
        credential: token.substring(0, 16)
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error generating Agora token:", error);
    return res.status(500).json({ 
      message: "Error generating token", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}