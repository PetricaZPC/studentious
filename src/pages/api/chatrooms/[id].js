import connectDB from '@/utils/connectDB'
import Chatroom from '@/models/Chatroom'
import { getToken } from "next-auth/jwt"

export default async function handler(req, res) {
  // Get chatroom ID from URL
  const { id } = req.query
  
  if (!id) {
    return res.status(400).json({ message: "Chatroom ID is required" })
  }
  
  // Simple authentication (same as in index.js)
  let userId = 'dev-user-id' // For development testing
  
  try {
    await connectDB()
    
    if (req.method === 'GET') {
      // Get a single chatroom
      const chatroom = await Chatroom.findById(id)
      
      if (!chatroom) {
        return res.status(404).json({ message: "Chatroom not found" })
      }
      
      return res.status(200).json({ 
        chatroom: {
          id: chatroom._id.toString(),
          name: chatroom.name,
          type: chatroom.type,
          description: chatroom.description,
          isPublic: chatroom.isPublic,
          participants: chatroom.participants?.length || 1,
          createdBy: chatroom.createdBy,
          createdAt: chatroom.createdAt
        } 
      })
    }
    
    // Handle other methods like PUT for updates and DELETE
    
    return res.status(405).json({ message: "Method not allowed" })
  } catch (error) {
    console.error(`Error in chatroom/${id} API:`, error)
    return res.status(500).json({ message: "Server error" })
  }
}