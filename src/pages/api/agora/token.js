import clientPromise from '../auth/mongodb';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  // Set CORS headers to ensure the API works from different origins during dev
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // SIMPLIFIED AUTH FOR DEVELOPMENT
    // This will allow the endpoint to work during development
    let userId = 'dev-user';
    let userName = 'Development User';
    
    if (process.env.NODE_ENV === 'production') {
      // In production, use proper auth
      const sessionId = req.cookies.sessionId;
      if (!sessionId) {
        return res.status(401).json({ message: "You must be logged in." });
      }

      // Validate sessionId in DB
      const client = await clientPromise;
      const db = client.db('accounts');
      const user = await db.collection('users').findOne({ sessionId });
      if (!user) {
        return res.status(401).json({ message: "You must be logged in." });
      }
      userId = user._id.toString();
      userName = user.name || user.email;
    }

    const { channelName } = req.query;
    if (!channelName) {
      return res.status(400).json({ message: "Channel name is required" });
    }

    // Get Agora credentials from environment variables
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return res.status(500).json({ message: "Agora credentials not configured" });
    }

    // Generate a UID for this user in this channel
    const uid = Math.floor(Math.random() * 100000);
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Generate the Agora token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    return res.status(200).json({
      appId,
      token,
      uid,
      channelName,
      userId,
      userName,
      timestamp: Date.now(), // Add timestamp for debugging
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