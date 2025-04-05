import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/pages/api/context/AuthContext'
import Image from 'next/image'

export default function ChatroomView({ roomId }) {
  const router = useRouter()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [room, setRoom] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const messagesEndRef = useRef(null)
  const pollingIntervalRef = useRef(null)
  const lastMessageTimestampRef = useRef(null)
  
  // Fetch chatroom details and messages
  useEffect(() => {
    const fetchChatroom = async () => {
      try {
        setLoading(true)
        
        // Fetch room details
        const roomResponse = await fetch(`/api/chatrooms/${roomId}`)
        const roomData = await roomResponse.json()
        
        if (!roomResponse.ok) {
          throw new Error(roomData.message || 'Failed to fetch chatroom details')
        }
        
        setRoom(roomData.chatroom)
        
        // Fetch messages
        await fetchMessages()
      } catch (err) {
        console.error('Error fetching chatroom data:', err)
        setError('Failed to load chatroom')
      } finally {
        setLoading(false)
      }
    }
    
    if (roomId) {
      fetchChatroom()
      // Setup real-time syncing
      setupMessagePolling()
    }
    
    // Cleanup function
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    }
  }, [roomId])
  
  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const response = await fetch(`/api/chatrooms/${roomId}/messages`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load messages')
      }
      
      // Update the last message timestamp for polling logic
      if (data.messages && data.messages.length > 0) {
        const latestMessage = data.messages[data.messages.length - 1];
        lastMessageTimestampRef.current = new Date(latestMessage.timestamp).getTime();
      }
      
      setMessages(data.messages || [])
      
      // Store current user information from response
      if (data.currentUser) {
        setCurrentUser(data.currentUser)
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
      if (!silent) setError('Failed to load messages')
    } finally {
      if (!silent) setLoading(false)
    }
  }
  
  // Setup polling for new messages
  const setupMessagePolling = () => {
    // Poll for new messages every 3 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages(true); // Silent fetch to avoid loading indicators
    }, 3000);
  }
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  const sendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return
    
    try {
      // Get user name from auth context or fallback options
      const senderName = user?.name || user?.displayName || user?.email || currentUser?.name || 'Anonymous User';
      
      const response = await fetch(`/api/chatrooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          // Use proper ID from current user
          senderId: currentUser?.id || user?.id,
          senderName: senderName
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message')
      }
      
      // Add the new message to the list
      const messageWithName = {
        ...data.message,
        senderName: senderName  // Ensure name is set for immediate display
      };
      
      setMessages(prev => [...prev, messageWithName])
      
      // Clear the input field
      setNewMessage('')
      
      // Immediately fetch messages to sync with other users
      setTimeout(() => fetchMessages(true), 500);
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Failed to send message. Please try again.')
    }
  }
  
  const startVideoChat = () => {
    router.push(`/chatrooms?roomId=${roomId}&mode=video`)
  }

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900">Error</h3>
          <p className="mt-2 text-gray-500">{error}</p>
          <button 
            onClick={() => router.back()} 
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center">
          <button 
            onClick={() => router.push('/chatrooms')}
            className="md:hidden mr-2 p-2 rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{room?.name}</h2>
            <p className="text-sm text-gray-500">{room?.participants} participants</p>
          </div>
        </div>
        
        {/* Video chat button */}
        <button
          onClick={startVideoChat}
          className="flex items-center px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Start Video
        </button>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading && messages.length > 0 && (
          <div className="flex justify-center">
            <div className="animate-spin h-4 w-4 border-b-2 border-indigo-600 rounded-full"></div>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="h-16 w-16 text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`mb-4 flex ${message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-xs sm:max-w-sm md:max-w-md rounded-lg px-4 py-2 ${
                  message.senderId === currentUser?.id 
                    ? 'bg-indigo-100 text-indigo-900 rounded-br-none' 
                    : 'bg-gray-200 text-gray-900 rounded-bl-none'
                }`}
              >
                {/* Always show sender name for all messages */}
                <div className={`text-xs font-semibold ${
                  message.senderId === currentUser?.id 
                    ? 'text-indigo-700 text-right' 
                    : 'text-indigo-600'
                } mb-1`}>
                  {message.senderId === currentUser?.id ? 'You' : message.senderName || 'Unknown User'}
                </div>
                <p className="text-sm">{message.content}</p>
                <div className="text-xs text-gray-500 mt-1 text-right">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={sendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}