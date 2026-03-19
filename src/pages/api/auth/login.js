import clientPromise from './mongodb';
import { compare } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { serialize } from 'cookie';

/**
 * Authenticates a user and issues a session cookie.
 *
 * Expects { email, password } in the request body.
 */
export default async function loginHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('accounts');
    const users = db.collection('users');

    const existingUser = await users.findOne({ email: email.toLowerCase() });
    if (!existingUser) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatch = await compare(password, existingUser.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const sessionId = uuidv4();
    await users.updateOne({ _id: existingUser._id }, { $set: { sessionId } });

    const cookie = serialize('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'strict',
    });

    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({
      message: 'Login successful',
      id: existingUser._id.toString(),
      email: existingUser.email,
      fullName: existingUser.fullName || '',
      role: existingUser.role || 'student',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
