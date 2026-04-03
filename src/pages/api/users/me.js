import clientPromise from '../auth/mongodb';

/**
 * Returns public user information for the current session.
 *
 * Requires a valid sessionId cookie.
 */
export default async function getCurrentUserHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'studentious');
    const users = db.collection('users');

    const user = await users.findOne({ sessionId });
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).json({
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName || '',
      role: user.role || 'student',
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
