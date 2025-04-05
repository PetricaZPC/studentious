import clientPromise from './mongodb';
import { compare } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const client = await clientPromise;
    const db = client.db('accounts');
    const users = db.collection('users');

    // Find user by email
    const user = await users.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare passwords
    const passwordMatch = await compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate a session ID
    const sessionId = uuidv4();
    
    // Update user with new session ID
    await users.updateOne(
      { _id: user._id },
      { $set: { sessionId: sessionId } }
    );

    // Set cookie
    const cookie = serialize('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'strict'
    });

    res.setHeader('Set-Cookie', cookie);
    
    return res.status(200).json({
      message: 'Login successful',
      email: user.email
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
