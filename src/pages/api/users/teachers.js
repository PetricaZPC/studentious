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

    // Get user from session
    const client = await clientPromise;
    const db = client.db('accounts');
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ sessionId });
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Fetch all teachers
    const teachers = await usersCollection.find({ role: 'teacher' }).toArray();
    
    // Remove sensitive information
    const sanitizedTeachers = teachers.map(teacher => ({
      _id: teacher._id,
      email: teacher.email,
      fullName: teacher.fullName || '',
    }));
    
    return res.status(200).json({ teachers: sanitizedTeachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}