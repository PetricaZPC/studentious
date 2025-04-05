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

    // Get events the user has joined
    const eventsCollection = db.collection('events');
    const events = await eventsCollection
      .find({ participants: user._id.toString() })
      .toArray();
    
    return res.status(200).json({ events });
  } catch (error) {
    console.error('Error fetching user events:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}