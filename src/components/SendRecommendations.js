import { useState, useEffect } from 'react';
import { useAuth } from '@/pages/api/context/AuthContext';

export default function SendRecommendations() {
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: null,
  });

  const [events, setEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [email, setEmail] = useState('');
  const { user } = useAuth();

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events/list'); 
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const toggleEventSelection = (eventId) => {
    setSelectedEvents((prevSelected) =>
      prevSelected.includes(eventId)
        ? prevSelected.filter((id) => id !== eventId)
        : [...prevSelected, eventId]
    );
  };

  // Send recommendations
  const sendRecommendations = async () => {
    if (!email) {
      setStatus({ loading: false, error: 'Please enter an email address.', success: null });
      return;
    }

    if (selectedEvents.length === 0) {
      setStatus({ loading: false, error: 'Please select at least one event.', success: null });
      return;
    }

    setStatus({ loading: true, error: null, success: null });

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, events: selectedEvents }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send recommendations');
      }

      setStatus({
        loading: false,
        success: `Recommendations sent successfully to ${email}`,
        error: null,
      });
      setSelectedEvents([]);
      setEmail('');
    } catch (error) {
      setStatus({
        loading: false,
        error: error.message,
        success: null,
      });
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Send Event Recommendations</h2>

      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Recipient Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter recipient's email"
        />
      </div>

      {/* Event List */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Select Events</h3>
        {events.length === 0 ? (
          <p className="text-gray-500">No events available.</p>
        ) : (
          <ul className="space-y-2">
            {events.map((event) => ((event.creatorId===user.id || event.creatorEmail===user.email) &&(
              <li key={event.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`event-${event.id}`}
                  checked={selectedEvents.includes(event.id)}
                  onChange={() => toggleEventSelection(event.id)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor={`event-${event.id}`} className="ml-2 text-sm text-gray-700">
                  {event.title} - {new Date(event.date).toLocaleDateString()}
                </label>
              </li>)
            ))}
          </ul>
        )}
      </div>

      {/* Send Button */}
      <button
        onClick={sendRecommendations}
        disabled={status.loading}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors duration-200"
      >
        {status.loading ? 'Sending...' : 'Send Recommendations'}
      </button>

      {/* Success Message */}
      {status.success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md">
          ✓ {status.success}
        </div>
      )}

      {/* Error Message */}
      {status.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md">
          ✕ {status.error}
        </div>
      )}
    </div>
  );
}