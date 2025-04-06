import clientPromise from '../auth/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('accounts');
    
    // Fetch public courses
    const coursesCollection = db.collection('courses');
    const courses = await coursesCollection
      .find({ isPublic: true })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({ courses });
  } catch (error) {
    console.error('Error fetching public courses:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}