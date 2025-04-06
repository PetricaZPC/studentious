import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "./api/context/AuthContext";
import Link from "next/link";
import { MdEdit, MdLogout, MdEvent, MdMessage, MdStar, MdSettings } from "react-icons/md"; 
import Head from "next/head";
import { useRouter } from 'next/router';
import AuthGuard from './api/AuthGuard';
import Layout from "../components/layout/Layout";
import Sidebar from "../components/layout/Sidebar";

function BecomeTeacher({ user, onSuccess }) {
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [teacherPassword, setTeacherPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const checkedRef = useRef(false);
  
  useEffect(() => {
    // Only check once per component mount
    if (!user || checkedRef.current) return;
    
    const checkTeacherStatus = async () => {
      try {
        checkedRef.current = true;
        
        const response = await fetch('/api/users/check-teacher', {
          method: 'GET',
          credentials: 'include',
          // Add cache control headers to prevent browser cache
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsTeacher(data.isTeacher);
        }
      } catch (error) {
        console.error('Error checking teacher status:', error);
      }
    };
    
    checkTeacherStatus();
    
    // Clean up function
    return () => {
      checkedRef.current = false;
    };
  }, [user]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    if (teacherPassword !== '1234') {
      setError('Invalid teacher password');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/users/become-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ teacherPassword }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update role');
      }
      
      setSuccess('Your account has been upgraded to teacher status!');
      setTeacherPassword('');
      setIsTeacher(true);
      
      if (onSuccess) onSuccess();
      
      setTimeout(() => {
        setShowTeacherForm(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error updating user role:', error);
      setError('Failed to update your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (isTeacher) {
    return (
      <div className="transition-all hover:bg-gray-50 p-3 rounded-lg">
        <label className="block text-sm font-medium text-gray-500 mb-1">Teacher Status</label>
        <div className="flex items-center">
          <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-md">
            Teacher
          </span>
          <p className="ml-2 text-gray-600 text-sm">You have teacher privileges</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="transition-all hover:bg-gray-50 p-3 rounded-lg">
      <label className="block text-sm font-medium text-gray-500 mb-1">Teacher Status</label>
      
      {!showTeacherForm ? (
        <button
          onClick={() => setShowTeacherForm(true)}
          className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
        >
          Become a Teacher
        </button>
      ) : (
        <div className="mt-2">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="password"
                value={teacherPassword}
                onChange={(e) => setTeacherPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Enter teacher password"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the teacher password to verify your teacher status.
              </p>
            </div>
            
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            
            {success && (
              <div className="text-green-600 text-sm">{success}</div>
            )}
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowTeacherForm(false)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function Account() {
  const { user, logout, refreshUser } = useAuth();
  const [currentUser, setCurrentUser] = useState(user);
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [eventsJoined, setEventsJoined] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [userMeta, setUserMeta] = useState({
    creationTime: null,
    lastSignInTime: null
  });

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      setError('Failed to log out');
    }
  };

  useEffect(() => {
    if (user) {
      const fetchCurrentUserData = async () => {
        try {
          // Check if we're coming from an update
          const isUpdated = router.query.updated !== undefined;
          
          console.log('Account page loading, isUpdated:', isUpdated);
          console.log('Current user from context:', user);
          
          if (isUpdated) {
            // Completely fresh load of all user data
            console.log('Performing complete user data refresh');
            
            // 1. Refresh auth context user data
            const freshData = await refreshUser();
            console.log('Fresh user data from context refresh:', freshData);
            
            // 2. Get profile data directly from API with cache busting
            const timestamp = Date.now();
            const profileResponse = await fetch(`/api/users/profile?fresh=true&t=${timestamp}`, {
              credentials: 'include',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              console.log('Fresh profile data from API:', profileData);
              
              // 3. Set current user from BOTH data sources
              setCurrentUser({
                ...user,
                ...(freshData || {}),
                ...profileData
              });
              
              // Set profile image if available
              if (profileData.photoURL) {
                setProfileImage(profileData.photoURL);
              }

              console.log('Updated local state with combined data');
            }
            
            // 4. Remove the updated parameter to prevent future refreshes, but keep the page
            const { updated, ...restQuery } = router.query;
            router.replace(
              { pathname: router.pathname, query: restQuery }, 
              undefined, 
              { shallow: true }
            );
          } else {
            // Normal page load - refresh data once anyway
            console.log('Normal page load - setting currentUser from context');
            
            // Still fetch fresh data, but less aggressively
            const profileResponse = await fetch('/api/users/profile', {
              credentials: 'include'
            });
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              
              setCurrentUser({
                ...user,
                ...profileData
              });
              
              if (profileData.photoURL) {
                setProfileImage(profileData.photoURL);
              }
            } else {
              // Fallback to just user context
              setCurrentUser(user);
            }
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
          // Fallback to just using the context user
          setCurrentUser(user);
        }
      };
      
      fetchCurrentUserData();
    }
  }, [user, router.query.updated, refreshUser, router]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      setCurrentUser(user);
      
      // Fetch user metadata
      const fetchUserMeta = async () => {
        try {
          const response = await fetch('/api/users/metadata', {
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserMeta({
              creationTime: data.createdAt,
              lastSignInTime: data.lastSignIn
            });
          }
        } catch (error) {
          console.error('Error fetching user metadata:', error);
        }
      };
      
      fetchUserMeta();
    }
  }, [user, router]);

  useEffect(() => {
    if (user) {
      const fetchProfileImage = async () => {
        try {
          const response = await fetch('/api/users/profile', {
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.photoURL) {
              setProfileImage(data.photoURL);
            }
          }
        } catch (error) {
          console.error('Error fetching profile image:', error);
        }
      };
      fetchProfileImage();
    }
  }, [user]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/users/events', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setEventsJoined(data.events);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchRecentActivities = async () => {
    if (!user) return;
    
    try {
      setLoadingActivities(true);
      
      const response = await fetch('/api/users/activities', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentActivities(data.activities);
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecentActivities();
    }
  }, [user]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  const AccountContent = () => (
    <div className="w-full max-w-6xl mx-auto">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 animate-fadeIn" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="relative mb-20 sm:mb-24">
        <div className="bg-gradient-to-r from-purple-800 via-purple-700 to-purple-600 rounded-xl h-36 sm:h-48 w-full shadow-md"></div>
        <div className="absolute transform -translate-y-1/2 left-1/2 -translate-x-1/2 sm:left-8 sm:translate-x-0 flex flex-col sm:flex-row items-center sm:items-end">
          <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg overflow-hidden ${
            !profileImage ? 'bg-gray-200 flex items-center justify-center' : ''
          }`}>
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-5xl">👤</span>
            )}
          </div>
          <div className="mt-2 sm:mt-0 sm:ml-4 sm:mb-2 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 sm:text-gray-800">
              {currentUser?.fullName || currentUser?.email || "My Account"}
            </h1>
            <p className="text-gray-600 sm:text-gray-600">{currentUser?.email}</p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-8 justify-center sm:justify-end">
        <Link 
          href="/editAccount"
          className="px-4 py-2 bg-white text-purple-600 rounded-lg flex items-center border border-purple-200 shadow-sm hover:bg-purple-50 transition-colors font-medium"
        >
          <MdEdit className="mr-1.5 text-lg" /> Edit Profile
        </Link>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center shadow-sm hover:bg-red-600 transition-colors font-medium"
        >
          <MdLogout className="mr-1.5 text-lg" /> Logout
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Account Details</h2>
              <Link href="/editAccount" className="text-sm text-purple-600 hover:text-purple-800">
                <MdEdit className="inline mr-1" size={16} /> Edit
              </Link>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="transition-all hover:bg-gray-50 p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                  <p className="text-gray-800 font-medium">{currentUser?.email}</p>
                </div>
                <div className="transition-all hover:bg-gray-50 p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Display Name</label>
                  <p className="text-gray-800 font-medium">{currentUser?.fullName || "Not set"}</p>
                </div>
                <div className="transition-all hover:bg-gray-50 p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Account Created</label>
                  <p className="text-gray-800 font-medium">
                    {userMeta.creationTime 
                      ? new Date(userMeta.creationTime).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : "Not available"}
                  </p>
                </div>
                <div className="transition-all hover:bg-gray-50 p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Last Sign In</label>
                  <p className="text-gray-800 font-medium">
                    {userMeta.lastSignInTime
                      ? new Date(userMeta.lastSignInTime).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : "Not available"}
                  </p>
                </div>
                <div className="transition-all hover:bg-gray-50 p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Interests</label>
                  <p className="text-gray-800 font-medium">
                    {currentUser?.interests?.length > 0
                      ? currentUser.interests.join(', ') // Display interests as a comma-separated list
                      : "Not set"}
                  </p>
                </div>
                <BecomeTeacher 
                  user={currentUser} 
                  onSuccess={() => {
                    window.location.reload();
                  }} 
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
            </div>
            <div className="p-6">
              {loadingActivities ? (
                <div className="text-center py-6">
                  <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading activities...</p>
                </div>
              ) : recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity._id} className="p-3 rounded-lg border border-gray-100 hover:bg-purple-50 transition-colors">
                      <div className="flex items-center mb-2">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <MdEvent className="text-xl text-purple-600" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-800">{activity.title}</p>
                          <p className="text-xs text-gray-500">
                            {activity.isCreator ? 'Created' : 'Joined'} on {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      )}
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {activity.time}
                        </span>
                        <Link 
                          href={`/calendar?event=${activity._id}`}
                          className="text-xs text-purple-600 hover:text-purple-800"
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-50 rounded-full mb-4">
                    <MdEvent className="text-3xl text-purple-600" />
                  </div>
                  <p className="text-gray-600">No recent activity to show.</p>
                  <Link 
                    href="/calendar" 
                    className="mt-3 inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    <MdEvent className="mr-1.5" /> Browse Events
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">Stats</h2>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <MdEvent className="text-xl text-purple-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm text-gray-500">Events Joined</p>
                    <p className="text-2xl font-semibold text-gray-800">{eventsJoined.length}</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <MdMessage className="text-xl text-blue-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm text-gray-500">Messages</p>
                    <p className="text-2xl font-semibold text-gray-800">0</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <MdStar className="text-xl text-yellow-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm text-gray-500">Achievements</p>
                    <p className="text-2xl font-semibold text-gray-800">0</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">Recommendations</h2>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div className="p-3 rounded-lg border border-gray-100 hover:bg-purple-50 transition-colors cursor-pointer">
                  <div className="flex items-center mb-2">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <MdEvent className="text-xl text-purple-600" />
                    </div>
                    <p className="ml-3 font-medium text-gray-800">Advanced Mathematics</p>
                  </div>
                  <p className="text-sm text-gray-600">Based on your profile, this course might help you with your studies.</p>
                  <div className="mt-2 flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">Popular</span>
                    </div>
                    <Link href="#" className="text-xs text-purple-600 hover:text-purple-800">Learn more</Link>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg border border-gray-100 hover:bg-purple-50 transition-colors cursor-pointer">
                  <div className="flex items-center mb-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <MdEvent className="text-xl text-blue-600" />
                    </div>
                    <p className="ml-3 font-medium text-gray-800">Study Group: Final Exams</p>
                  </div>
                  <p className="text-sm text-gray-600">Join other students preparing for final examinations this week.</p>
                  <div className="mt-2 flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">Today</span>
                    </div>
                    <Link href="/calendar" className="text-xs text-purple-600 hover:text-purple-800">View event</Link>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg border border-gray-100 hover:bg-purple-50 transition-colors cursor-pointer">
                  <div className="flex items-center mb-2">
                    <div className="bg-yellow-100 p-2 rounded-lg">
                      <MdEvent className="text-xl text-yellow-600" />
                    </div>
                    <p className="ml-3 font-medium text-gray-800">Programming Fundamentals</p>
                  </div>
                  <p className="text-sm text-gray-600">Learn the basics of programming with this interactive course.</p>
                  <div className="mt-2 flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">Recommended</span>
                    </div>
                    <Link href="#" className="text-xs text-purple-600 hover:text-purple-800">Learn more</Link>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <Link href="/calendar" className="text-sm text-purple-600 font-medium hover:text-purple-800">
                  View all recommendations →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AuthGuard>
      <Head>
        <title>Account | Studentious</title>
        <meta name="description" content="Manage your account settings" />
      </Head>
      
      <Layout>
        <Sidebar />
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-gray-50">
          <AccountContent />
        </div>
      </Layout>
    </AuthGuard>
  );
}