import { useState, useEffect, useRef } from 'react';
import { useAuth } from './api/context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { auth, db } from './api/config/firebaseConfig';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Cookies from 'js-cookie';
import imageCompression from 'browser-image-compression';
import Sidebar from '@/components/layout/Sidebar';

export default function EditAccount() {
  const { user } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);


  useEffect(() => {
    if (user) {
      console.log('User object:', {
        displayName: user.displayName,
        email: user.email,
        metadata: user.metadata
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      setDisplayName(user.displayName || ''); 
      console.log('Current user display name:', user.displayName); 
      fetchProfileImage();
    }
  }, [user, router]);

  const fetchProfileImage = async () => {
    try {
      const docRef = doc(db, 'userProfiles', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().photoURL) {
        setPreviewUrl(docSnap.data().photoURL);
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
    }
  };

  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 0.1, // 100KB
      maxWidthOrHeight: 500,
      useWebWorker: true
    };

    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Error compressing image:', error);
      throw new Error('Failed to compress image');
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setLoading(true);
        const compressedFile = await compressImage(file);
        setSelectedImage(compressedFile);

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result;
          setPreviewUrl(base64String);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        setError('Failed to process image. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleImageUpload = async (file, userId) => {
    if (!file || !userId) return null;

    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64String = reader.result;
            if (base64String.length > 150000) {
              reject(new Error('Image still too large after compression'));
              return;
            }
            
            await setDoc(doc(db, 'userProfiles', userId), {
              photoURL: base64String,
              updatedAt: serverTimestamp()
            }, { merge: true });
            
            resolve(base64String);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload image');
    }
  };

  useEffect(() => {
    const savedImage = Cookies.get('profileImage');
    if (savedImage) {
      setPhotoURL(savedImage);
      setPreviewUrl(savedImage);
    }
  }, []);

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
      if (displayName !== user.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: displayName
        });
      }

      if (selectedImage) {
        await handleImageUpload(selectedImage, user.uid);
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
  };

  return (
    <>
      <Head>
        <title>Edit Account | Studentious</title>
        <meta name="description" content="Edit your account settings" />
      </Head>
      <Sidebar />
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Profile</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            {message && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Profile Picture
                </label>
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-4xl">👤</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-sm text-purple-600 border border-purple-600 rounded-md hover:bg-purple-50"
                  >
                    Choose Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="Enter your display name"
                />
              </div>

              <div className="flex items-center justify-between mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                
                <Link
                  href="/account"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}