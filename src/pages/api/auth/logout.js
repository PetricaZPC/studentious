import clientPromise from './mongodb';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const sessionId = req.cookies.sessionId;
    
    if (sessionId) {
      // Clear the session ID from the database
      const client = await clientPromise;
      const db = client.db('accounts');
      const users = db.collection('users');
      
      await users.updateOne(
        { sessionId },
        { $unset: { sessionId: "" } }
      );
      
      // Clear the cookie
      const cookie = serialize('sessionId', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        expires: new Date(0),
        path: '/',
        sameSite: 'strict'
      });
      
      res.setHeader('Set-Cookie', cookie);
    }
    
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
