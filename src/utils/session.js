import clientPromise from '../pages/api/auth/mongodb';

/**
 * Retrieves the authenticated user record based on session cookie.
 *
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<null | { _id: any; email: string; fullName?: string; role?: string }>} 
 */
export async function getUserFromSession(req) {
  const sessionId = req.cookies?.sessionId;
  if (!sessionId) return null;

  const client = await clientPromise;
  const db = client.db('accounts');
  const users = db.collection('users');

  const user = await users.findOne(
    { sessionId },
    { projection: { _id: 1, email: 1, fullName: 1, role: 1 } }
  );

  return user;
}
