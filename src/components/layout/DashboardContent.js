import { useAuth } from "@/pages/api/context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function DashboardContent() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/events/list');
      const allEvents = response.data.events || [];
      setEvents(allEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  // Filter events for different sections
  const filterEvents = (events) => {
    const today = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7);

    return {
      upcomingEvents: events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate <= oneWeekFromNow && event.creatorId !== user.uid;
      }),
      yourEvents: events.filter(event => event.creatorId === user.id || event.creatorEmail===user.email),
      pastEvents: events.filter(event => new Date(event.date) < today)
    };
  };

  const { upcomingEvents, yourEvents, pastEvents } = filterEvents(events);

  const renderEventCard = (event) => {
    const eventDate = new Date(event.date);
    const today = new Date();
    const isToday = eventDate.toDateString() === today.toDateString();
    const isParticipant = event.participants.includes(user.email);

    return (
      <div
        key={event.id}
        className={`
          bg-white dark:bg-gray-800 
          shadow-md hover:shadow-lg 
          rounded-lg p-4 mb-4 
          border-l-4 ${isToday ? 'border-blue-500' : 'border-transparent'}
          transition-all duration-200
        `}
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {event.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">{event.description}</p>
          </div>
          {isToday && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
              Today
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {eventDate.toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>

          <div
            className={`flex items-center text-sm font-medium ${
              isParticipant
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isParticipant ? (
              <>
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {event.creatorId === user.uid || event.creatorEmail===user.email ? 'You created this' : 'You are participating'}
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Not participating
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex space-x-2">
          {!isParticipant && event.uploadedBy !== user.uid && (
            <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors">
              Join Event
            </button>
          )}
          <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-md transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200">
            View Details
          </button>
          {event.uploadedBy === user.uid && (
            <button className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md transition-colors">
              Manage
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderSection = (title, events, emptyMessage) => {
    if (loading) return <LoadingSpinner className="my-8" />;
    if (error) return <p className="text-red-500">{error}</p>;
    if (events.length === 0) return <p className="text-gray-500">{emptyMessage}</p>;
    
    return (
      <div className="space-y-4 overflow-y-auto max-h-96">
        {events.map(renderEventCard)}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl space-y-8">
      {/* Your Events Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Your Events
        </h2>
        {renderSection(
          "Your Events",
          yourEvents,
          "You haven't created any events yet."
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Upcoming Events (Next 7 Days)
        </h2>
        {renderSection(
          "Upcoming Events",
          upcomingEvents,
          "No upcoming events in the next week."
        )}
      </section>

      <details className="border rounded-lg overflow-hidden">
        <summary className="bg-gray-50 dark:bg-gray-800 p-4 cursor-pointer list-none">
          <h2 className="text-xl font-semibold inline-flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Past Events
          </h2>
        </summary>
        <div className="p-4">
          {renderSection(
            "Past Events",
            pastEvents,
            "No past events to display."
          )}
        </div>
      </details>
    </div>
  );
}