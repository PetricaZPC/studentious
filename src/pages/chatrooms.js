import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Sidebar from "@/components/layout/Sidebar"
import ChatroomView from '@/components/chat/ChatroomView'
import VideoChat from '@/components/chat/VideoChat'
import { useAuth } from './api/context/AuthContext'
import AuthGuard from './api/AuthGuard'

export default function Chatrooms() {
  const router = useRouter()
  const { roomId, mode } = router.query
  const { user } = useAuth()
  const [chatrooms, setChatrooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategoryTab, setActiveCategoryTab] = useState('all')
  
  // Fetch available chatrooms
  useEffect(() => {
    const fetchChatrooms = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/chatrooms')
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch chatrooms')
        }
        
        setChatrooms(data.chatrooms)
      } catch (err) {
        console.error('Error fetching chatrooms:', err)
        setError('Failed to load chatrooms')
      } finally {
        setLoading(false)
      }
    }
    
    fetchChatrooms()
  }, [])

  // Filter and group rooms based on type and search
  const filteredRooms = chatrooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Group rooms by type
  const roomsByType = filteredRooms.reduce((acc, room) => {
    const type = room.type || 'General'
    if (!acc[type]) acc[type] = []
    acc[type].push(room)
    return acc
  }, {})
  
  // Get active rooms to display based on selected tab
  const activeRooms = activeCategoryTab === 'all' 
    ? filteredRooms 
    : roomsByType[activeCategoryTab] || []

  // Create new chatroom handler
  const handleCreateRoom = () => {
    setShowCreateModal(true)
  }
  
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <Head>
          <title>{roomId ? `Chat: ${roomId}` : 'Chatrooms'} | Studentious</title>
          <meta name="description" content="Chat with fellow students and participate in event discussions" />
        </Head>
        
        {/* Main sidebar */}
        <Sidebar />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col pl-0 md:pl-64 h-full">
          {/* Fixed mobile menu button */}
          <div className="fixed top-4 left-4 z-40 md:hidden">
            <button 
              onClick={() => document.body.classList.toggle('sidebar-open')}
              className="p-2 rounded-full bg-white shadow-md text-indigo-600 hover:bg-indigo-50 transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          
          {/* Chat container with improved spacing and responsive design */}
          <div className="flex flex-1 overflow-hidden p-0 md:p-4">
            {/* Chatrooms list sidebar with improved styling */}
            <div className={`${roomId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0 flex-col bg-white border-r border-gray-200 rounded-none md:rounded-l-xl shadow-sm overflow-hidden`}>
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-semibold text-gray-800">Chatrooms</h1>
                  <button 
                    onClick={handleCreateRoom}
                    className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                    aria-label="Create new chatroom"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search chatrooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pr-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-colors"
                  />
                  <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Category tabs - more subtle design */}
              <div className="flex border-b border-gray-100">
                <button 
                  onClick={() => setActiveCategoryTab('all')} 
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeCategoryTab === 'all' ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-600 hover:text-indigo-500'}`}
                >
                  All
                </button>
                {Object.keys(roomsByType).map(type => (
                  <button 
                    key={type}
                    onClick={() => setActiveCategoryTab(type)}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeCategoryTab === type ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-600 hover:text-indigo-500'}`}
                  >
                    {type === 'General' ? 'Gen' : type.charAt(0).toUpperCase()}
                  </button>
                ))}
              </div>
              
              {/* Rooms list - cleaner, more minimal styling */}
              <div className="flex-1 overflow-y-auto py-2">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                  </div>
                ) : error ? (
                  <div className="mx-4 p-3 text-sm text-red-700 bg-red-50 rounded-lg border-l-4 border-red-500">
                    {error}
                  </div>
                ) : activeRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center h-40 px-4">
                    <p className="text-gray-500 mb-4">No chatrooms found</p>
                    <button 
                      onClick={handleCreateRoom}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      Create New Chatroom
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 px-2">
                    {activeRooms.map(room => (
                      <div 
                        key={room.id}
                        onClick={() => router.push(`/chatrooms?roomId=${room.id}`)}
                        className={`flex items-center p-3 rounded-lg cursor-pointer group transition-all duration-150
                          ${room.id === roomId 
                            ? 'bg-indigo-50 text-indigo-800' 
                            : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mr-3
                          ${room.type === 'Course' ? 'bg-green-100 text-green-700' : 
                            room.type === 'Event' ? 'bg-purple-100 text-purple-700' : 
                            room.type === 'Study Group' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          <span className="text-sm font-medium">{room.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{room.name}</span>
                            {room.unreadCount > 0 && (
                              <span className="ml-2 min-w-[20px] h-5 flex items-center justify-center bg-indigo-500 text-white text-xs font-bold rounded-full px-1.5">
                                {room.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {room.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                        <button 
                          className="p-1 ml-2 text-gray-400 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle options menu
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Improved chat/video area with responsive styling */}
            <div className="flex-1 flex flex-col bg-white rounded-none md:rounded-r-xl shadow-sm overflow-hidden">
              {roomId ? (
                <div className="h-full flex flex-col overflow-hidden">
                  {/* Improved chat header */}
                  {!mode === 'video' && (
                    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
                      <button 
                        onClick={() => router.push('/chatrooms')}
                        className="md:hidden mr-3 p-1.5 rounded-full text-gray-500 hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3
                          ${chatrooms.find(c => c.id === roomId)?.type === 'Course' ? 'bg-green-100 text-green-700' : 
                          chatrooms.find(c => c.id === roomId)?.type === 'Event' ? 'bg-purple-100 text-purple-700' : 
                          chatrooms.find(c => c.id === roomId)?.type === 'Study Group' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          <span className="text-lg font-medium">
                            {(chatrooms.find(c => c.id === roomId)?.name || 'Chat').charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h2 className="font-medium text-lg text-gray-800">
                            {chatrooms.find(c => c.id === roomId)?.name || 'Chat'}
                          </h2>
                          <p className="text-xs text-gray-500">
                            {chatrooms.find(c => c.id === roomId)?.type || 'General'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center ml-auto">
                        {mode !== 'video' && (
                          <button
                            onClick={() => router.push(`/chatrooms?roomId=${roomId}&mode=video`)}
                            className="flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Video Chat
                          </button>
                        )}
                        
                        <button className="ml-2 p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Enhanced Chat/Video content wrapper */}
                  <div className="flex-1 flex flex-col h-full">
                    {mode === 'video' ? (
                      <div className="h-full flex flex-col"> 
                        {/* Video chat header with action buttons */}
                        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 px-4 py-3 flex items-center">
                          <button 
                            onClick={() => router.push(`/chatrooms?roomId=${roomId}`)}
                            className="mr-3 p-1.5 rounded-full text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          
                          <div className="flex items-center">
                            <div className="bg-white bg-opacity-20 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                              <span className="text-lg font-medium text-white">
                                {(chatrooms.find(c => c.id === roomId)?.name || 'Chat').charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h2 className="font-medium text-lg text-white">
                                {chatrooms.find(c => c.id === roomId)?.name || 'Chat'} - Video
                              </h2>
                              <p className="text-xs text-indigo-200">
                                Live video session in progress
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Video chat component wrapper */}
                        <div className="flex-1 flex">
                          <VideoChat roomId={roomId} onLeave={() => router.push(`/chatrooms?roomId=${roomId}`)} />
                        </div>
                      </div>
                    ) : (
                      <ChatroomView roomId={roomId} />
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-white">
                  <div className="text-center max-w-md p-8">
                    <div className="relative w-24 h-24 mx-auto mb-6 transform transition-all duration-700 hover:scale-105">
                      <div className="absolute inset-0 bg-indigo-100 rounded-full opacity-70 animate-pulse"></div>
                      <svg className="absolute inset-0 w-full h-full text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.864 9.864 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Select a Chatroom</h2>
                    <p className="text-gray-600 mb-6">Choose a chatroom from the list or create a new one to start the conversation.</p>
                    <button 
                      onClick={handleCreateRoom}
                      className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      Create New Chatroom
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Create Chatroom Modal - cleaner styling */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden transform transition-all duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Create New Chatroom</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <label htmlFor="chatroomName" className="block text-sm font-medium text-gray-700 mb-1">Chatroom Name*</label>
                  <input
                    id="chatroomName"
                    type="text"
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    placeholder="Enter chatroom name"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="chatroomType" className="block text-sm font-medium text-gray-700 mb-1">Chatroom Type</label>
                  <select
                    id="chatroomType"
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  >
                    <option value="General">General</option>
                    <option value="Course">Course</option>
                    <option value="Event">Event</option>
                    <option value="Study Group">Study Group</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="chatroomDescription" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    id="chatroomDescription"
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    placeholder="What's this chatroom about?"
                    rows={3}
                  />
                </div>
                
                <div className="mb-5">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      defaultChecked
                    />
                    <span className="ml-2 text-sm text-gray-700">Public Chatroom</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">Public chatrooms are visible to all users. Private chatrooms are invite-only.</p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    onClick={() => {
                      // Handle creation logic
                      setShowCreateModal(false)
                    }}
                  >
                    Create Chatroom
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}