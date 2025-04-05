import clientPromise from '../../auth/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { eventId } = req.query;
    
    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    const sessionId = req.cookies.sessionId;
    if (!sessionId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Get user from session
    const client = await clientPromise;
    const db = client.db('accounts');
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ sessionId });
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Get the event
    const eventsCollection = db.collection('events');
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if the user is the creator
    const userId = user.id || user._id.toString();
    if (event.creatorId !== userId) {
      return res.status(403).json({ message: 'Only the event creator can delete this event' });
    }
    
    // Delete the event
    await eventsCollection.deleteOne({ _id: new ObjectId(eventId) });
    
    // Delete related notifications
    const notificationsCollection = db.collection('notifications');
    await notificationsCollection.deleteMany({ eventId: eventId });
    
    return res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}