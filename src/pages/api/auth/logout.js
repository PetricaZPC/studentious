import clientPromise from './mongodb';
import { serialize } from 'cookie';

/**
 * Logs out the current user by clearing the session ID and expiring the session cookie.
 *
 * Requires a sessionId cookie to identify the active session.
 */
export default async function logoutHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    return res.status(200).json({ message: 'Logged out successfully' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'studentious');
    const users = db.collection('users');

    await users.updateOne({ sessionId }, { $unset: { sessionId: '' } });

    const cookie = serialize('sessionId', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      expires: new Date(0),
      path: '/',
      sameSite: 'strict',
    });

    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
