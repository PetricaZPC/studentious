import clientPromise from '../auth/mongodb';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import { v4 as uuidv4 } from 'uuid';
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
    // Get channel name
    const { channel } = req.query;
    
    if (!channel) {
      return res.status(400).json({ message: "Channel name is required" });
    }
    
    // Get or create a unique browser identity
    let userId = req.cookies.chatUserId;
    let userName = req.cookies.chatUserName;
    
    if (!userId) {
      userId = `user-${uuidv4().substring(0, 8)}`;
      userName = `User-${Math.floor(Math.random() * 10000)}`;
      
      // Set cookies to persist this identity
      res.setHeader('Set-Cookie', [
        `chatUserId=${userId}; Path=/; Max-Age=86400; SameSite=Lax`,
        `chatUserName=${userName}; Path=/; Max-Age=86400; SameSite=Lax`
      ]);
    }
    
    // Configure Agora
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    
    if (!appId || !appCertificate) {
      return res.status(500).json({ message: "Agora credentials not configured" });
    }
    
    // Create a numeric UID derived from user ID
    // Extract numbers from userId and ensure uniqueness
    const uidStr = userId.replace(/[^0-9]/g, '');
    const uid = parseInt(uidStr.substring(0, 8) || Math.floor(Math.random() * 100000));
    
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Generate the Agora token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channel,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    return res.status(200).json({
      appId,
      token,
      uid,
      channel,
      userId,
      userName,
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