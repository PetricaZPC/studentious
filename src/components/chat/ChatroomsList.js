import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function ChatroomsList({ chatrooms, loading, error, activeChatroom }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newChatroomName, setNewChatroomName] = useState('')
  const [newChatroomType, setNewChatroomType] = useState('General')
  const [newChatroomDescription, setNewChatroomDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Filter chatrooms based on search term
  const filteredChatrooms = chatrooms?.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []
  
  // Group chatrooms by type
  const groupedChatrooms = filteredChatrooms.reduce((acc, room) => {
    const group = room.type || 'General'
    if (!acc[group]) acc[group] = []
    acc[group].push(room)
    return acc
  }, {})
  
  // Handle create chatroom
  const handleCreateChatroom = async (e) => {
    e.preventDefault()
    
    if (!newChatroomName.trim()) {
      setErrorMessage("Please enter a chatroom name")
      return
    }
    
    try {
      setIsSubmitting(true)
      setErrorMessage('')
      
      const response = await fetch('/api/chatrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newChatroomName,
          type: newChatroomType,
          description: newChatroomDescription,
          isPublic
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create chatroom')
      }
      
      // Close modal and reset form
      setShowCreateModal(false)
      setNewChatroomName('')
      setNewChatroomType('General')
      setNewChatroomDescription('')
      setIsPublic(true)
      
      // Navigate to the new chatroom
      router.push(`/chatrooms?roomId=${data.chatroom.id}`)
      
      // You might want to update the chatrooms list here or refetch
    } catch (err) {
      console.error('Error creating chatroom:', err)
      setErrorMessage(err.message || 'Failed to create chatroom')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Chatrooms</h2>
        
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search chatrooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Display error if one occurred */}
      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 border-l-4 border-red-500">
          {error}
        </div>
      )}
      
      {/* Loading state */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        /* Chatrooms list */
        <div className="flex-1 overflow-y-auto">
          {!Array.isArray(chatrooms) || Object.keys(groupedChatrooms).length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {searchTerm ? 'No chatrooms matching your search' : 'No chatrooms available'}
            </div>
          ) : (
            Object.entries(groupedChatrooms).map(([groupName, rooms]) => (
              <div key={groupName} className="mb-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                  {groupName}
                </div>
                <ul>
                  {rooms.map(room => (
                    <li key={room.id}>
                      <Link 
                        href={`/chatrooms?roomId=${room.id}`}
                        className={`block px-4 py-3 hover:bg-gray-50 ${activeChatroom === room.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-gray-900">{room.name}</div>
                            <div className="text-sm text-gray-500 truncate">{room.lastMessage || 'No messages yet'}</div>
                          </div>
                          
                          {/* Unread messages badge */}
                          {room.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                              {room.unreadCount}
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Create new chatroom button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Chatroom
        </button>
      </div>
      
      {/* Create Chatroom Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-96">
            <form onSubmit={handleCreateChatroom} className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Chatroom</h3>
              
              {errorMessage && (
                <div className="text-sm text-red-600 mb-4">{errorMessage}</div>
              )}
              
              <div className="mb-4">
                <label htmlFor="chatroomName" className="block text-sm font-medium text-gray-700">Chatroom Name</label>
                <input
                  id="chatroomName"
                  type="text"
                  value={newChatroomName}
                  onChange={(e) => setNewChatroomName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="chatroomType" className="block text-sm font-medium text-gray-700">Chatroom Type</label>
                <select
                  id="chatroomType"
                  value={newChatroomType}
                  onChange={(e) => setNewChatroomType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="General">General</option>
                  <option value="Event">Event</option>
                  <option value="Course">Course</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="chatroomDescription" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="chatroomDescription"
                  value={newChatroomDescription}
                  onChange={(e) => setNewChatroomDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-indigo-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Public Chatroom</span>
                </label>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`ml-2 px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}