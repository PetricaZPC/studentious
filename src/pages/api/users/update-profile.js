import clientPromise from '../auth/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const sessionId = req.cookies.sessionId;
    if (!sessionId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const client = await clientPromise;
    const db = client.db('accounts');
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ sessionId });
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { fullName, photoURL } = req.body;
    
    console.log('BEFORE UPDATE - Current user fullName:', user.fullName);
    console.log('Updating user profile with fullName:', fullName);
    
    // Update user data with fullName in the users collection
    if (fullName !== undefined) {
      const result = await usersCollection.updateOne(
        { _id: user._id },
        { $set: { fullName: fullName } }
      );
      
      console.log('MongoDB update result:', result);
    }
    
    // If there's a photo URL, store it in the userProfiles collection
    if (photoURL) {
      const userProfilesCollection = db.collection('userProfiles');
      await userProfilesCollection.updateOne(
        { userId: user._id.toString() },
        { 
          $set: { 
            photoURL,
            updatedAt: new Date()
          } 
        },
        { upsert: true }
      );
    }
    
    // Clear the session cache after update
    if (global.sessionCache) {
      global.sessionCache.delete(`session:${sessionId}`);
    }
    
    // Fetch the updated user to confirm changes
    const updatedUser = await usersCollection.findOne({ _id: user._id });
    console.log('AFTER UPDATE - Updated user fullName:', updatedUser.fullName);
    
    return res.status(200).json({ 
      message: 'Profile updated successfully',
      fullName: updatedUser.fullName || fullName
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Excerpt from editAccount.js that needs to be updated
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!user) {
    setError('You must be logged in to update your profile');
    return;
  }

  if (!displayName.trim()) {
    setError('Display name cannot be empty');
    return;
  }

  setError('');
  setLoading(true);
  setMessage('');

  try {
    const updateData = {
      fullName: displayName // Make sure this is sent as fullName
    };
    
    if (selectedImage) {
      const base64Image = await convertImageToBase64(selectedImage);
      if (base64Image.length > 150000) {
        throw new Error('Image still too large after compression');
      }
      updateData.photoURL = base64Image;
    }
    
    console.log('Sending update with data:', updateData); // Add this for debugging
    
    const response = await fetch('/api/users/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData),
      credentials: 'include'
    });
    
    const data = await response.json(); // Get the response data
    console.log('Profile update response:', data); // Log it
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }
    
    setMessage('Profile updated successfully!');
    setTimeout(() => {
      router.push('/account');
    }, 2000);
  } catch (err) {
    console.error('Profile update error:', err);
    setError(err.message || 'Failed to update profile');
  } finally {
    setLoading(false);
  }
}
