import clientPromise from '../auth/mongodb';

/**
 * Updates the authenticated user's profile.
 *
 * Accepts partial profile updates: { fullName, interests, photoURL }.
 * Requires a valid sessionId cookie.
 */
export default async function updateUserProfileHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const sessionId = req.cookies.sessionId;
  if (!sessionId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { fullName, interests, photoURL } = req.body ?? {};

  try {
    const client = await clientPromise;
    const db = client.db('accounts');
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ sessionId });
    if (!existingUser) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (interests !== undefined) updates.interests = interests;

    if (Object.keys(updates).length > 0) {
      await usersCollection.updateOne({ _id: existingUser._id }, { $set: updates });
    }

    if (photoURL) {
      const profiles = db.collection('userProfiles');
      await profiles.updateOne(
        { userId: existingUser._id.toString() },
        { $set: { photoURL, updatedAt: new Date() } },
        { upsert: true }
      );
    }

    const updatedUser = await usersCollection.findOne({ _id: existingUser._id });

    return res.status(200).json({
      message: 'Profile updated successfully',
      fullName: updatedUser?.fullName || '',
      interests: updatedUser?.interests || [],
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
