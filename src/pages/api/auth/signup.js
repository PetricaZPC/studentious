import clientPromise from './mongodb';
import { hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, fullName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const client = await clientPromise;
    const db = client.db('accounts');
    const users = db.collection('users');

    // Check if user already exists
    const existingUser = await users.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);
    
    // Generate a session ID
    const sessionId = uuidv4();

    // Create user
    const newUser = {
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName: fullName || '',
      createdAt: new Date(),
      sessionId,
      intersts: [],
    };

    const result = await users.insertOne(newUser);

    // Set cookie
    const cookie = serialize('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'strict'
    });

    res.setHeader('Set-Cookie', cookie);
    
    return res.status(201).json({
      message: 'User created',
      email: newUser.email
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}