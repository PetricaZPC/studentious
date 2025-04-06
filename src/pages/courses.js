import { useState } from 'react';
import Layout from '../components/layout/Layout';
import Sidebar from '../components/layout/Sidebar';
import PublicCoursesContent from '../components/courses/PublicCoursesContent';
import PersonalCoursesContent from '../components/courses/PersonalCoursesContent';
import { Tab } from '@headlessui/react';
import { useAuth } from '@/pages/api/context/AuthContext';

export default function Courses() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Layout>
      <Sidebar />
      <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 pl-0 md:pl-64 transition-all duration-300 overflow-y-auto">
        {/* Mobile sidebar toggle - keep this from your existing design */}
        <div className="fixed top-4 left-4 z-40 md:hidden">
          <button 
            onClick={() => document.body.classList.toggle('sidebar-open')}
            className="p-2 rounded-full bg-white shadow-md text-indigo-600 hover:bg-indigo-50"
            aria-label="Toggle sidebar"
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Main content */}
        <div className="px-4 py-8 sm:px-6 lg:px-8 pb-32 relative">
          {/* Header with gradient */}
          <div className="relative mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-xl opacity-90"></div>
            <div className="absolute inset-0 bg-pattern opacity-10"></div>
            <div className="relative px-6 py-10 sm:px-10 sm:py-14 text-center">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
                Courses
              </h1>
              <p className="max-w-2xl mx-auto text-blue-100 text-lg">
                Discover public courses or manage your own course materials
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500"></div>
          </div>
          
          {/* Tabs */}
          <div className="max-w-7xl mx-auto">
            <Tab.Group onChange={setActiveTab} defaultIndex={0}>
              <Tab.List className="flex space-x-1 rounded-xl bg-white p-1 shadow-md mb-8">
                <Tab
                  className={({ selected }) =>
                    `w-full rounded-lg py-3 text-sm font-medium leading-5 transition-colors
                    ${selected 
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'
                    }`
                  }
                >
                  Public Courses
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `w-full rounded-lg py-3 text-sm font-medium leading-5 transition-colors
                    ${selected 
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'
                    }`
                  }
                >
                  My Courses
                </Tab>
              </Tab.List>
              
              <Tab.Panels>
                <Tab.Panel>
                  <PublicCoursesContent />
                </Tab.Panel>
                <Tab.Panel>
                  {user ? (
                    <PersonalCoursesContent />
                  ) : (
                    <div className="bg-white rounded-xl shadow-xl p-8 text-center">
                      <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold text-gray-800 mb-2">Sign In Required</h2>
                      <p className="text-gray-600 mb-6">Please sign in to manage your courses</p>
                      <button
                        onClick={() => window.location.href = '/login'}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Sign In
                      </button>
                    </div>
                  )}
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>
      </div>
    </Layout>
  );
}