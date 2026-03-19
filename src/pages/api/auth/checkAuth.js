import clientPromise from './mongodb';

/**
 * Validates the current session and returns basic user information.
 *
 * Requires a valid sessionId cookie.
 */
export default async function checkAuthHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('accounts');
    const users = db.collection('users');

    const user = await users.findOne({ sessionId });
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    res.status(200).json({
      message: 'Authenticated',
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName || '',
      role: user.role || 'student',
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
