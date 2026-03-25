import clientPromise from './mongodb';
import { hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { serialize } from 'cookie';
import { sendWelcomeEmail } from '../../../utils/sendWelcomeEmail';

/**
 * Registers a new user and creates a session cookie.
 *
 * Expects { email, password, name } in the request body.
 */
export default async function signupHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password, name } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'studentious');
    const users = db.collection('users');

    const existingUser = await users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await hash(password, 10);
    const sessionId = uuidv4();

    const newUser = {
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName: name || '',
      createdAt: new Date(),
      sessionId,
      interests: [],
    };

    const insertResult = await users.insertOne(newUser);

    const cookie = serialize('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'strict',
    });

    res.setHeader('Set-Cookie', cookie);

    await sendWelcomeEmail(email, name);

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: insertResult.insertedId.toString(),
        email,
        fullName: name || '',
        role: 'student',
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Error creating user' });
  }
}
