import clientPromise from '../auth/mongodb';

// In-memory cache to store session lookup results
const sessionCache = new Map();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // IMPORTANT: Change to no-cache for profile requests
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Always clear cached user data with ?fresh=true parameter
    if (req.query.fresh === 'true') {
      sessionCache.delete(`session:${sessionId}`);
    }
    
    // Check if we already looked up this session recently
    const cacheKey = `session:${sessionId}`;
    const cachedUser = req.query.fresh !== 'true' ? sessionCache.get(cacheKey) : null;
    let user;
    
    const client = await clientPromise;
    const db = client.db('accounts');
    
    if (cachedUser) {
      user = cachedUser;
    } else {
      const usersCollection = db.collection('users');
      
      // Optimize query - only get the fields we need
      user = await usersCollection.findOne(
        { sessionId }, 
        { projection: { _id: 1, fullName: 1, email: 1 } }
      );
      
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Cache the user for a shorter period - 10 seconds
      sessionCache.set(cacheKey, user);
      setTimeout(() => sessionCache.delete(cacheKey), 10000); // 10 seconds instead of 60
    }

    // Get user profile info with optimized query
    const userProfilesCollection = db.collection('userProfiles');
    const profile = await userProfilesCollection.findOne(
      { userId: user._id.toString() },
      { projection: { photoURL: 1, bio: 1, interests: 1 } }
    );
    
    // Skip ETag mechanism for now to ensure fresh data
    /* 
    const etag = `W/"${Buffer.from(JSON.stringify(user._id)).toString('base64')}"`;
    res.setHeader('ETag', etag);
    
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }
    */
    
    console.log('Sending profile data with fullName:', user.fullName); // Add this log
    
    return res.status(200).json({
      fullName: user.fullName || '', 
      email: user.email,
      photoURL: profile?.photoURL || null,
      bio: profile?.bio || '',
      interests: profile?.interests || []
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}