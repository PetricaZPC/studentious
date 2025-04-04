import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../config/firebaseConfig";
import { doc, getDoc } from 'firebase/firestore';
import Link from "next/link";
import { MdEdit, MdLogout } from "react-icons/md"; 
import Header from "@/components/Header";
import Head from "next/head";
import { useRouter } from 'next/router';
import AuthGuard from '../components/AuthGuard';

export default function Account() {
  const { user, logout } = useAuth(); 
  const [currentUser, setCurrentUser] = useState(user);
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const router = useRouter();

  // Add handleLogout function
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      setError('Failed to log out');
    }
  };

  useEffect(() => {
    // Redirect if not authenticated
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

  // Show loading state while checking auth
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

return (
    <AuthGuard>
        <Head>
            <title>Account | Studentious</title>
            <meta name="description" content="Manage your account settings" />
        </Head>
        <Header />
        <div className="min-h-screen bg-gray-100">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            <div className="w-full text-white">
                <div className="bg-purple-600 w-full h-[250px]">
                    <div className="container mx-auto px-4 py-8">
                        <div className="flex items-center">
                            <div className={`w-24 h-24 rounded-full border-2 border-white shadow-md overflow-hidden ${
                                !profileImage ? 'bg-gray-700 flex items-center justify-center' : ''
                            }`}>
                                {profileImage ? (
                                    <img
                                        src={profileImage}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-4xl">👤</span>
                                )}
                            </div>
                            <div className="ml-4">
                                <h1 className="text-3xl md:text-5xl font-bold">
                                    {currentUser?.displayName || "My Account"}
                                </h1>
                                <p className="text-gray-100">{currentUser?.email}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-4">
                            <Link 
                                href="/editAccount"
                                className="px-4 py-2 bg-white text-purple-600 rounded-md flex items-center hover:bg-gray-100 transition-colors"
                            >
                                <MdEdit className="mr-2" /> Edit Profile
                            </Link>

                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-500 text-white rounded-md flex items-center hover:bg-red-600 transition-colors"
                            >
                                <MdLogout className="mr-2" /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Account Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-600">Email</label>
                            <p className="text-gray-800">{currentUser?.email}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Display Name</label>
                            <p className="text-gray-800">{currentUser?.displayName || "Not set"}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Account Created</label>
                            <p className="text-gray-800">
                                {currentUser?.metadata?.creationTime 
                                    ? new Date(currentUser.metadata.creationTime).toLocaleDateString() 
                                    : "Not available"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AuthGuard>
);
}