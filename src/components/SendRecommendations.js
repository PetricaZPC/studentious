import { useState } from 'react';

export default function SendRecommendations() {
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: null
  });

  const sendRecommendations = async () => {
    setStatus({ loading: true, error: null, success: null });

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send recommendations');
      }

      setStatus({
        loading: false,
        success: `Recommendations sent to ${data.results.filter(r => r.status === 'success').length} users`,
        error: null
      });
    } catch (error) {
      setStatus({
        loading: false,
        error: error.message,
        success: null
      });
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Send Event Recommendations</h2>
      
      <button
        onClick={sendRecommendations}
        disabled={status.loading}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors duration-200"
      >
        {status.loading ? 'Sending...' : 'Send Recommendations'}
      </button>

      {status.success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md">
          ✓ {status.success}
        </div>
      )}

      {status.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md">
          ✕ {status.error}
        </div>
      )}
    </div>
  );
}