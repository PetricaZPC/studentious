import React, { useEffect, useState } from "react";
import { useAuth } from "./api/context/AuthContext";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./api/config/firebaseConfig";
import { doc, getDoc } from 'firebase/firestore';
import Link from "next/link";
import { MdEdit, MdLogout, MdEvent, MdMessage, MdStar, MdSettings } from "react-icons/md"; 
import Head from "next/head";
import { useRouter } from 'next/router';
import AuthGuard from './api/AuthGuard';
import Layout from "../components/layout/Layout";
import Sidebar from "../components/layout/Sidebar";
import RightPanel from "../components/layout/RightPanel";

export default function Account() {
  const { user, logout, getEvents } = useAuth(); // Access getEvents from useAuth
  const [currentUser, setCurrentUser] = useState(user);
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [eventsJoined, setEventsJoined] = useState([]);

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
    if (!user) {
      router.push('/login');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (updatedUser) => {
      if (updatedUser) {
        setCurrentUser(updatedUser);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [user, router]);

  useEffect(() => {
    if (user) {
      const fetchProfileImage = async () => {
        try {
          const docRef = doc(db, 'userProfiles', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().photoURL) {
            setProfileImage(docSnap.data().photoURL);
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
        const events = await getEvents(); // Use getEvents from AuthContext
        setEventsJoined(events);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    if (user) {
      fetchEvents();
    }
  }, [user, getEvents]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  // Main content component for the account page
  const AccountContent = () => (
    <div className="w-full max-w-6xl mx-auto">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 animate-fadeIn" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Cleaner profile header with better responsive design */}
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
              {currentUser?.displayName || "My Account"}
            </h1>
            <p className="text-gray-600 sm:text-gray-600">{currentUser?.email}</p>
          </div>
        </div>
      </div>
      
      {/* Action buttons - repositioned for better flow */}
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
      
      {/* Main content grid - improved for better content fit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Details Card - Improved layout and spacing */}
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
                  <p className="text-gray-800 font-medium">{currentUser?.displayName || "Not set"}</p>
                </div>
                <div className="transition-all hover:bg-gray-50 p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Account Created</label>
                  <p className="text-gray-800 font-medium">
                    {currentUser?.metadata?.creationTime 
                      ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
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
                    {currentUser?.metadata?.lastSignInTime
                      ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : "Not available"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Activity Section - Enhanced visual design */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
            </div>
            <div className="p-6">
              {/* You could add real activity items here */}
              <div className="text-center py-6 text-gray-500">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-50 rounded-full mb-4">
                  <MdEvent className="text-3xl text-purple-600" />
                </div>
                <p className="text-gray-600">Your recent activity will appear here.</p>
                <Link href="/calendar" className="mt-3 inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                  <MdEvent className="mr-1.5" /> Browse Events
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column for stats and recommendations */}
        <div className="col-span-1 space-y-6">
          {/* Stats Card - Improved visual styling */}
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
                    {console.log(eventsJoined.length)}
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
          
          {/* Recommendations Card - Enhanced with interactive styling */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800">Recommendations</h2>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                {/* Course recommendation */}
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
                
                {/* Event recommendation */}
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
                
                {/* Course recommendation */}
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