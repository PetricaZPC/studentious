import { useState, useEffect, useRef } from 'react';
import { useAuth } from './api/context/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';
import Sidebar from '@/components/layout/Sidebar';
import AuthGuard from './api/AuthGuard';

export default function EditAccount() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      setDisplayName(user.fullName || ''); 
      fetchProfileImage();
    }
  }, [user, router]);

  const fetchProfileImage = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.photoURL) {
          setPreviewUrl(data.photoURL);
        }
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
        fullName: displayName
      };
      
      // Process image if selected
      if (selectedImage) {
        const base64Image = await convertImageToBase64(selectedImage);
        if (base64Image.length > 150000) {
          throw new Error('Image still too large after compression');
        }
        updateData.photoURL = base64Image;
      }
      
      console.log('Sending update with data:', updateData);
      
      // Update profile
      const response = await fetch('/api/users/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData),
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Profile update response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      
      setMessage('Profile updated successfully!');
      
      // CRITICAL: This must be a synchronous series of operations
      try {
        console.log('Starting refresh process...');
        
        // 1. Force refresh user data in auth context
        await refreshUser();
        console.log('Auth user refreshed');
        
        // 2. Clear ALL caches
        localStorage.removeItem('profile_data');
        sessionStorage.clear();
        
        // 3. Clear any session-level browser cache
        await fetch('/api/users/clear-cache', {
          method: 'POST',
          credentials: 'include'
        }).catch(e => console.log('Cache clear API call error (ignorable):', e));
        
        // 4. Wait before redirecting to ensure all updates have propagated
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Redirecting to account page with cache busting...');
        
        // 5. Redirect with heavy cache busting
        const timestamp = Date.now();
        window.location.href = `/account?updated=${timestamp}&nocache=true`;
        
        // Don't use router.push as it might preserve some state
        // router.push(`/account?updated=${timestamp}&nocache=true`);
      } catch (refreshError) {
        console.error('Error during refresh sequence:', refreshError);
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <AuthGuard>
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
    </AuthGuard>
  );
}