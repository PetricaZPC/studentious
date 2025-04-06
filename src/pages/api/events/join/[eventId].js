import clientPromise from '../../auth/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { eventId } = req.query;
    console.log("Received eventId:", eventId); // Debugging: Log the event ID

    if (!eventId || !ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid Event ID' });
    }

    const sessionId = req.cookies.sessionId;
    console.log("Received sessionId:", sessionId); // Debugging: Log the session ID

    if (!sessionId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const client = await clientPromise;
    const db = client.db('accounts');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ sessionId });
    console.log("Fetched user:", user); // Debugging: Log the user

    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const eventsCollection = db.collection('events');
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });
    console.log("Fetched event:", event); // Debugging: Log the event

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const userId = user.id || user._id.toString();
    if (event.participants.includes(userId)) {
      return res.status(400).json({ message: 'User already joined this event' });
    }

    if (event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json({ message: 'Event is full' });
    }

    const updateResult = await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      {
        $push: { participants: userId },
        $inc: { currentParticipants: 1 },
      }
    );

    console.log("Update result:", updateResult);

    if (updateResult.modifiedCount === 0) {
      throw new Error('Failed to update the event');
    }

    console.log("User successfully joined the event");
    return res.status(200).json({ message: 'Successfully joined event' });
  } catch (error) {
    console.error('Error joining event:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}