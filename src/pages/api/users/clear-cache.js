import clientPromise from '../auth/mongodb';

// Access global session cache
const sessionCache = global.sessionCache || new Map();
global.sessionCache = sessionCache;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Clear any cached session data
    if (sessionCache.has(`session:${sessionId}`)) {
      sessionCache.delete(`session:${sessionId}`);
      console.log('Cleared session cache for:', sessionId);
    }

    // Set cache control headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.status(200).json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}