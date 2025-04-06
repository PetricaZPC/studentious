import clientPromise from '../auth/mongodb';
import { ObjectId } from 'mongodb';

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

    const { courseId, isPublic } = req.body;
    
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    // Verify the course belongs to the user
    const coursesCollection = db.collection('courses');
    const course = await coursesCollection.findOne({ 
      _id: new ObjectId(courseId),
      uploadedBy: user.email
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found or you do not have permission to modify it' });
    }

    // Update the course
    await coursesCollection.updateOne(
      { _id: new ObjectId(courseId) },
      { $set: { isPublic } }
    );

    return res.status(200).json({
      message: 'Course updated successfully'
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}