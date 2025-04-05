import { useState, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

export default function AgoraTest() {
  const [status, setStatus] = useState('Not started');
  const [logs, setLogs] = useState([]);
  
  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toISOString().slice(11, 19)} - ${message}`]);
  };
  
  const runTest = async () => {
    setStatus('Starting test...');
    addLog('Test started');
    
    try {
      // 1. Try to create Agora client
      addLog('Creating Agora client...');
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      addLog('Agora client created successfully');
      
      // 2. Try to fetch token
      addLog('Fetching token...');
      const testChannel = 'test-' + Math.floor(Math.random() * 1000000);
      const tokenResponse = await fetch(`/api/agora/token?channel=${testChannel}`, {
        credentials: 'include'
      });
      
      if (!tokenResponse.ok) {
        throw new Error(`Token fetch failed: ${tokenResponse.status}`);
      }
      
      const tokenData = await tokenResponse.json();
      addLog(`Token obtained for channel: ${testChannel}`);
      
      // 3. Try to join channel
      addLog('Joining channel...');
      await client.join(
        tokenData.appId,
        tokenData.channel,
        tokenData.token,
        tokenData.uid
      );
      addLog('Successfully joined channel!');
      
      // 4. Try to create and publish tracks
      addLog('Creating audio and video tracks...');
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      addLog('Tracks created successfully');
      
      addLog('Publishing tracks...');
      await client.publish(tracks);
      addLog('Tracks published successfully');
      
      // 5. Clean up
      addLog('Test completed successfully, cleaning up...');
      tracks.forEach(track => track.close());
      await client.leave();
      addLog('Clean up completed');
      
      setStatus('Test passed!');
    } catch (error) {
      addLog(`ERROR: ${error.message}`);
      setStatus(`Test failed: ${error.message}`);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <button 
          onClick={runTest}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-2"
        >
          Run Connectivity Test
        </button>
        <div className={`p-2 rounded ${
          status === 'Test passed!' ? 'bg-green-100 text-green-800' : 
          status.includes('failed') ? 'bg-red-100 text-red-800' : 
          'bg-gray-100 text-gray-800'
        }`}>
          Status: {status}
        </div>
      </div>
      
      <div className="border rounded p-4 bg-black text-green-400 font-mono text-sm h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-gray-500">Logs will appear here...</p>
        ) : (
          logs.map((log, i) => <div key={i}>{log}</div>)
        )}
      </div>
      
      <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded">
        <h3 className="font-bold">Troubleshooting Tips:</h3>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Make sure your browser allows camera and microphone access</li>
          <li>Check if your firewall allows WebSocket connections (wss://)</li>
          <li>Verify that your Agora App ID and Certificate are correctly set in .env</li>
          <li>Some corporate networks block WebRTC traffic</li>
          <li>Try using a different browser or network connection</li>
        </ul>
      </div>
    </div>
  );
}