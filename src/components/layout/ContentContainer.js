import { useState, useEffect } from 'react';
import { useAuth } from '@/pages/api/context/AuthContext';

/**
 * ContentContainer - A flexible container component that can display different types of content
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} props.type - Container type: 'event', 'dashboard', or 'basic' (default)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.fetchEvents - Whether to fetch events (for dashboard type)
 * @param {Object} props.customProps - Any additional props to pass to the container
 */
export default function ContentContainer({ 
  children, 
  type = 'basic', 
  className = '', 
  fetchEvents = false,
  ...customProps 
}) {
  const { getAllEvents, user } = useAuth();
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [loading, setLoading] = useState(fetchEvents);

  // Fetch events if dashboard mode is enabled and fetchEvents is true
  useEffect(() => {
    if (type === 'dashboard' && fetchEvents && user) {
      const loadEvents = async () => {
        try {
          setLoading(true);
          const events = await getAllEvents();
          
          if (events && Array.isArray(events)) {
            const joined = events.filter(event => event.attendees && event.attendees.includes(user.uid));
            const available = events.filter(event => !event.attendees || !event.attendees.includes(user.uid));
            
            setJoinedEvents(joined);
            setAvailableEvents(available);
          }
        } catch (error) {
          console.error("Error fetching events:", error);
        } finally {
          setLoading(false);
        }
      };

      loadEvents();
    }
  }, [getAllEvents, user, type, fetchEvents]);

  // Base container styles
  const baseContainerClasses = "h-screen w-full flex overflow-hidden select-none bg-gray-100 dark:bg-gray-900";

  // Determine the container based on type
  const renderContainer = () => {
    switch (type) {
      case 'event':
        return (
          <div className={`${baseContainerClasses} ${className}`} {...customProps}>
            <div className="flex flex-col w-full h-full">
              <div className="flex-grow overflow-y-auto">{children}</div>
            </div>
          </div>
        );
        
      case 'dashboard':
        return (
          <div className={`bg-white p-6 ${className}`} id="main-content" {...customProps}>
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

            {loading ? (
              <div className="text-center text-gray-500">Loading events...</div>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Courses I Joined</h2>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <p>No courses joined yet.</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Courses Available</h2>
                  <div className="bg-gray-100 p-4 rounded shadow">
                    <p>No courses available yet.</p>
                  </div>
                </div>

                {fetchEvents && (
                  <>
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold mb-4">Events I Joined</h2>
                      <div className="bg-gray-100 p-4 rounded shadow">
                        {joinedEvents.length > 0 ? (
                          joinedEvents.map((event) => (
                            <div key={event.id} className="mb-4">
                              <h3 className="text-lg font-medium">{event.title}</h3>
                              <p className="text-gray-600">{event.description}</p>
                            </div>
                          ))
                        ) : (
                          <p>No events joined yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="mb-8">
                      <h2 className="text-xl font-semibold mb-4">Events Available</h2>
                      <div className="bg-gray-100 p-4 rounded shadow">
                        {availableEvents.length > 0 ? (
                          availableEvents.map((event) => (
                            <div key={event.id} className="mb-4">
                              <h3 className="text-lg font-medium">{event.title}</h3>
                              <p className="text-gray-600">{event.description}</p>
                            </div>
                          ))
                        ) : (
                          <p>No events available yet.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
                
                {children}
              </>
            )}
          </div>
        );
        
      default: // 'basic'
        return (
          <div className={className} {...customProps}>
            {children}
          </div>
        );
    }
  };

  return renderContainer();
}