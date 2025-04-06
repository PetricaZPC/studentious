import React from 'react';
import { useAuth } from "@/pages/api/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { smartFetch, clearCache } from '@/utils/apiCache';

// Create a memoized component to avoid unnecessary re-renders
const Sidebar = React.memo(function Sidebar() {
  const { user, refreshUser } = useAuth();
  const [currentUser, setCurrentUser] = useState(user || {});
  const [profileImage, setProfileImage] = useState(null);
  const router = useRouter();
  const profileFetchedRef = useRef(false);
  
  const pathname = usePathname();
  
  // Updated path checks to match your actual routes
  const isDashboard = pathname === "/";
  const isCalendar = pathname === "/calendar";
  const isCourses = pathname === "/courses"; 
  const isChatrooms = pathname === "/chatrooms" || pathname?.startsWith("/chatrooms"); // Check for both exact and nested chatroom routes
  const isResources = pathname === "/resources";
  const isAccount = pathname === "/account";

  // Create a stable fetch function with improved caching
  const fetchProfileData = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    // Skip if we already have data and this isn't a forced refresh
    if (profileFetchedRef.current && !forceRefresh) return;
    
    try {
      // Mark as fetched immediately to prevent parallel requests
      profileFetchedRef.current = true;
      
      // Use our optimized fetch utility with caching
      const profileData = await smartFetch('/api/users/profile', {
        credentials: 'include',
        skipCache: forceRefresh // Skip cache on forced refresh
      });
      
      // Safely update state with new data
      setCurrentUser(prevUser => ({
        ...prevUser,
        ...user,
        ...profileData
      }));
      
      if (profileData?.photoURL) {
        setProfileImage(profileData.photoURL);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Reset fetched flag on error to allow retry
      if (forceRefresh) {
        profileFetchedRef.current = false;
      }
    }
  }, [user]);

  // Fetch profile once on mount or user change
  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
    
    // Reset on unmount
    return () => {
      profileFetchedRef.current = false;
    };
  }, [fetchProfileData, user]);
  
  // Handle profile updates (only when ?updated parameter exists)
  useEffect(() => {
    // Only refresh if user exists
    if (user) {
      const loadProfileData = async () => {
        // Check if we're coming from an update operation
        const isUpdated = router.query.updated !== undefined;
        
        try {
          // Add cache busting if coming from update
          const timestamp = isUpdated ? Date.now() : '';
          const apiUrl = isUpdated 
            ? `/api/users/profile?t=${timestamp}` 
            : '/api/users/profile';
          
          const options = {
            credentials: 'include',
            headers: isUpdated ? {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            } : {}
          };
          
          // Fetch profile data with potential cache busting
          const response = await fetch(apiUrl, options);
          
          if (response.ok) {
            const profileData = await response.json();
            
            // Update user data with profile info
            setCurrentUser({
              ...user,
              ...profileData
            });
            
            if (profileData.photoURL) {
              setProfileImage(profileData.photoURL);
            }
          }
        } catch (error) {
          console.error('Error loading profile data:', error);
        }
      };
      
      loadProfileData();
    }
  }, [user, router.query.updated]);

  return (
    <nav className="w-64 fixed left-0 top-0 h-full bg-white p-6 border-r border-gray-200 shadow-sm flex flex-col">
      {/* Logo with text */}
      <div className="flex items-center justify-center mb-8">
        <div className="h-10 w-10 flex items-center justify-center mr-3">
          <img src="/favicon.ico" alt="Logo" className="h-8 w-8" />
        </div>
        <span className="text-xl font-semibold text-gray-800">Studentious</span>
      </div>

      {/* Navigation Links */}
      <ul className="space-y-2 flex-1">
        <NavItem
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          }
          label="Dashboard"
          active={isDashboard}
          href="/"
        />
        <NavItem
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          }
          label="Chatrooms"
          active={isChatrooms} // Updated to use the correct variable
          href="/chatrooms"
        />
        <NavItem
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          }
          label="Courses"
          active={isCourses}
          href="/courses"
        />
        <NavItem
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          label="Calendar"
          active={isCalendar}
          href="/calendar"
        />
        <NavItem
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
          label="Resources"
          active={isResources}
          href="/resources"
        />
      </ul>

      {/* User Profile & Help */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
          {profileImage ? (
            <img
              src={profileImage}
              alt="Profile"
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          <Link href="/account">
            <div>
              <p className="text-sm font-medium text-gray-700">{currentUser?.fullName || currentUser?.email || 'User'}</p>
            </div>
          </Link>
        </div>
        <div className="mt-4 flex items-center p-2 rounded-lg hover:bg-gray-100 cursor-pointer text-gray-600 hover:text-blue-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-3"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm">Help & Support</span>
        </div>
      </div>
    </nav>
  );
});

// Reusable NavItem component
function NavItem({ icon, label, active = false, href }) {
  return (
    <li>
      <Link
        href={href || (label !== "Dashboard" ? `/${label.toLowerCase()}` : "/")}
        className={`flex items-center p-3 rounded-lg ${
          active
            ? "bg-blue-50 text-blue-600"
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <span className={`mr-3 ${active ? "text-blue-500" : "text-gray-400"}`}>
          {icon}
        </span>
        <span className="font-medium">{label}</span>
        {active && (
          <span className="ml-auto h-2 w-2 bg-blue-500 rounded-full"></span>
        )}
      </Link>
    </li>
  );
}

export default Sidebar;
