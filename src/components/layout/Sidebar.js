import {auth ,db} from "@/pages/api/config/firebaseConfig";
import { useAuth } from "@/pages/api/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePathname } from 'next/navigation'
import { isMatch } from "date-fns";

export default function Sidebar() {
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState(user);
  const [profileImage, setProfileImage] = useState(null);
  const isDashboard = usePathname() === "/";
  const isCalendar = usePathname() === "/calendar";
  const isCourses = usePathname() === "/courses";
  const isMessages = usePathname() === "/messages";
  const isResources = usePathname() === "/resources";
  const isAccount = usePathname() === "/account";
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
  
  return (
    <nav className="w-64 fixed left-0 top-0 h-full bg-white p-6 border-r border-gray-200 shadow-sm flex flex-col">
      {/* Logo with text */}
      <div className="flex items-center justify-center mb-8">
        <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold text-lg">S</span>
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
          label="Messages"
          active={isMessages}
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
          active={isMessages}
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
        />
      </ul>

      {/* User Profile & Help */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
          {
            currentUser.photoURL  ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover"
              />
            )
            :
            (
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
            )

          }
          

          <a href="/account">
            <div>
              <p className="text-sm font-medium text-gray-700">{currentUser.fullName}</p>
              <p className="text-xs text-gray-500">Student</p>
            </div>
          </a>
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
}

// Reusable NavItem component
function NavItem({ icon, label, active = false }) {
  return (
    <li>
      <a
        href={(label!=="Dashboard") ? `/${label.toLowerCase()}` : "/"}
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
      </a>
    </li>
  );
}
