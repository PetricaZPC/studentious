import clientPromise from '../auth/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const client = await clientPromise;
    const db = client.db('accounts');
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ sessionId });
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    return res.status(200).json({
      createdAt: user.createdAt || new Date(),
      lastSignIn: user.lastSignIn || user.createdAt || new Date()
    });
  } catch (error) {
    console.error('Error fetching user metadata:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}