import clientPromise from '../auth/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
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

    const {
      title,
      description,
      date,
      time,
      location,
      maxParticipants,
      startTime,
      endTime
    } = req.body;
    
    if (!title || !date || !time || !maxParticipants) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Determine if this is a teacher event
    const userRole = user.role === 'teacher' ? 'teacher' : 'student';

    // Create event
    const eventsCollection = db.collection('events');
    const eventData = {
      title,
      description: description || '',
      date,
      time,
      location: location || '',
      maxParticipants: parseInt(maxParticipants),
      currentParticipants: 1,
      participants: [user.id || user._id.toString()],
      creatorId: user.id || user._id.toString(),
      creatorName: user.fullName || user.email || 'Anonymous',
      creatorEmail: user.email || 'unknown@email.com',
      creatorRole: userRole,
      createdAt: new Date(),
      startTime,
      endTime
    };
    
    const result = await eventsCollection.insertOne(eventData);
    
    // Create notifications
    const allUsers = await usersCollection.find({ _id: { $ne: user._id } }).toArray();
    
    const notificationsCollection = db.collection('notifications');
    const notificationPromises = allUsers.map(recipient => {
      return notificationsCollection.insertOne({
        userId: recipient._id.toString(),
        eventId: result.insertedId.toString(),
        type: 'newEvent',
        title: `New Event: ${title}`,
        message: `${user.fullName || user.email || 'Someone'} created a new event: ${title}`,
        creatorName: user.fullName || user.email || 'Anonymous',
        eventDetails: {
          title,
          description: description || '',
          date,
          time,
          startTime,
          endTime,
        },
        read: false,
        createdAt: new Date()
      });
    });
    
    await Promise.all(notificationPromises);
    
    return res.status(201).json({ 
      message: 'Event created successfully',
      eventId: result.insertedId.toString()
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}