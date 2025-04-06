import { useAuth } from "@/pages/api/context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";
import AuthGuard from "@/pages/api/AuthGuard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function TodayEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventsOfToday, setEventsOfToday] = useState([]);

  // Fetch events from the API
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/events/list');
      const allEvents = response.data.events || [];
      setEvents(allEvents);

      // Filter today's events
      const today = new Date().toDateString();
      const todayEvents = allEvents.filter(
        (event) => new Date(event.date).toDateString() === today
      );
      setEventsOfToday(todayEvents);
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

  // Render individual event cards
  const renderEventCard = (event) => {
    const eventDate = new Date(event.date);
    const isParticipant = event.participants.includes(user.email);

    return (
      <div
        key={event.id}
        className={`
          bg-white dark:bg-gray-800 
          shadow-md hover:shadow-lg 
          rounded-lg p-4 mb-4 
          border-l-4 border-blue-500 
          transition-all duration-200
        `}
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {event.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {event.description}
            </p>
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
            Today
          </span>
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
            {eventDate.toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          <div
            className={`flex items-center text-sm font-medium ${
              isParticipant
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
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
                {event.creatorId === user.uid ||
                event.creatorEmail === user.email
                  ? "You created this"
                  : "You are participating"}
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 24 24"
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
          {!isParticipant && event.creatorId !== user.uid && (
            <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors">
              Join Event
            </button>
          )}
          <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-md transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200">
            View Details
          </button>
          {event.creatorId === user.uid && (
            <button className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md transition-colors">
              Manage
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <AuthGuard>
      {loading && <LoadingSpinner />}
      {error && <div className="text-red-500">{error}</div>}
      <div className="flex flex-col space-y-4">
        {eventsOfToday.length > 0 ? (
          eventsOfToday.map((event) => renderEventCard(event))
        ) : (
          <div className="text-gray-500 dark:text-gray-400">
            No events for today
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
