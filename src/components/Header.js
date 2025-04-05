import React, { useState } from 'react';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = []; // Replace with your notifications data

  const markNotificationAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
      fetchNotifications(); // Refresh notifications
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  return (
    <nav className="px-6 py-4 bg-white shadow">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="flex justify-between items-center">
          <div>
            <a href="/" className="text-xl font-bold text-gray-800 md:text-2xl">
              <span className="text-purple-700">Student</span>
              ious
            </a>
          </div>
          <div>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button" 
              className="block text-gray-800 hover:text-gray-600 focus:text-gray-600 focus:outline-none md:hidden"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2z"/>
              </svg>
            </button>
          </div>
        </div>
        <div className={`flex-col md:flex md:flex-row md:-mx-4 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <a href="/" className="my-1 text-gray-800 hover:text-purple-700 md:mx-4 md:my-0">Home</a>
          <a href="#" className="my-1 text-gray-800 hover:text-purple-700 md:mx-4 md:my-0">Blog</a>
          <a href="/calendar" className="my-1 text-gray-800 hover:text-purple-700 md:mx-4 md:my-0">Calendar</a>
          <a href="/account" className="my-1 text-gray-800 hover:text-purple-700 md:mx-4 md:my-0">Account</a>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2"
            >
              <span className="sr-only">Notifications</span>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                  <div className="mt-4 space-y-4">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div key={notification.id} className="flex items-start space-x-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                            <div className="mt-2 flex space-x-4">
                              <button
                                onClick={() => joinEvent(notification.eventId)}
                                className="text-sm text-purple-600 hover:text-purple-500"
                              >
                                Join Event
                              </button>
                              <button
                                onClick={() => markNotificationAsRead(notification.id)}
                                className="text-sm text-gray-500 hover:text-gray-400"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No new notifications</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
