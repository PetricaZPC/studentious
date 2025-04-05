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

    // Get user's recent activities (events joined)
    const eventsCollection = db.collection('events');
    const events = await eventsCollection
      .find({ participants: user._id.toString() })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    const activities = events.map(event => ({
      _id: event._id,
      type: 'event',
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      timestamp: event.createdAt,
      isCreator: event.creatorId === user._id.toString()
    }));
    
    return res.status(200).json({ activities });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}