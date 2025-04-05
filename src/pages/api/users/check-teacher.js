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

    const isTeacher = user.role === 'teacher';
    
    return res.status(200).json({ isTeacher });
  } catch (error) {
    console.error('Error checking teacher status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}