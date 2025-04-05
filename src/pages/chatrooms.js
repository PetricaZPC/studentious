import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Sidebar from "@/components/layout/Sidebar"
import ChatroomsList from '@/components/chat/ChatroomsList'
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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Head>
          <title>{roomId ? `Chat: ${roomId}` : 'Chatrooms'} | Studentious</title>
          <meta name="description" content="Chat with fellow students and participate in event discussions" />
        </Head>
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          
          <div className="flex-1 pl-0 md:pl-64 pt-16 transition-all duration-300 flex">
            {/* Mobile sidebar toggle */}
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
            
            {/* Chatrooms List (shown when no specific room is selected) */}
            <div className={`w-80 border-r border-gray-200 bg-white ${roomId ? 'hidden md:block' : 'w-full md:w-80'}`}>
              <ChatroomsList 
                chatrooms={chatrooms} 
                loading={loading} 
                error={error} 
                activeChatroom={roomId}
              />
            </div>
            
            {/* Active Chatroom or Video Chat */}
            {roomId && (
              <div className="flex-1 flex flex-col">
                {mode === 'video' ? (
                  <VideoChat roomId={roomId} />
                ) : (
                  <ChatroomView roomId={roomId} />
                )}
              </div>
            )}
            
            {/* Empty state when no room is selected on larger screens */}
            {!roomId && (
              <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                  <div className="mx-auto h-24 w-24 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-xl font-medium text-gray-900">Select a chatroom</h3>
                  <p className="mt-2 text-sm text-gray-500">Choose a chatroom from the left to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}