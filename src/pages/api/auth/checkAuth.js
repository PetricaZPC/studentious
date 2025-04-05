import clientPromise from './mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const client = await clientPromise;
    const db = client.db('accounts'); 
    const users = db.collection('users'); 

    const user = await users.findOne({ sessionId });
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Return user info (but not password)
    res.status(200).json({ 
      message: "Authenticated", 
      email: user.email,
      fullName: user.fullName || ''
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ message: "Server error" });
  }
}