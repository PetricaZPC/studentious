import clientPromise from '../auth/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { teacherPassword } = req.body;
    
    if (teacherPassword !== '1234') {
      return res.status(401).json({ message: 'Invalid teacher password' });
    }

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

    // Update user to be a teacher
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { role: 'teacher' } }
    );
    
    return res.status(200).json({ message: 'Successfully upgraded to teacher role' });
  } catch (error) {
    console.error('Error upgrading to teacher:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}