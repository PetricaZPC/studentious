import connectDB from '@/utils/connectDB'
import Chatroom from '@/models/Chatroom'
import { getToken } from "next-auth/jwt"

export default async function handler(req, res) {
  // Simplified authentication that works even if next-auth isn't fully set up
  let userId = null
  
  try {
    // First try to get the token through next-auth
    const token = await getToken({ req })
    if (token) {
      userId = token.id || token.sub
    } 
    // Fallback: check for Authorization header
    else if (req.headers.authorization) {
      const authToken = req.headers.authorization.split(' ')[1]
      // Simple check - in a real app you'd verify this token
      if (authToken) {
        userId = 'demo-user-id' // Placeholder for testing
      }
    }
    
    // For development - allow basic testing without auth
    if (!userId && process.env.NODE_ENV === 'development') {
      userId = 'dev-user-id'
    }
  } catch (err) {
    console.error('Auth error:', err)
    // In dev mode, proceed with a test user ID
    if (process.env.NODE_ENV === 'development') {
      userId = 'dev-user-id'
    }
  }
  
  // Connect to the database
  try {
    await connectDB()
  } catch (err) {
    console.error('Database connection error:', err)
    return res.status(500).json({ message: "Failed to connect to database" })
  }
  
  switch (req.method) {
    case 'GET':
      try {
        // Get all chatrooms with basic filtering
        const chatrooms = await Chatroom.find({
          $or: [
            { isPublic: true },
            { participants: userId },
            { createdBy: userId }
          ]
        }).sort({ updatedAt: -1 })
        
        // Format the response
        const formattedChatrooms = chatrooms.map(room => ({
          id: room._id.toString(),
          name: room.name,
          type: room.type || 'General',
          lastMessage: room.lastMessage?.content || null,
          lastMessageTime: room.lastMessage?.timestamp || null,
          unreadCount: 0,
          participants: room.participants?.length || 1
        }))
        
        return res.status(200).json({ chatrooms: formattedChatrooms })
      } catch (error) {
        console.error("Error fetching chatrooms:", error)
        return res.status(500).json({ message: "Error fetching chatrooms" })
      }
      
    case 'POST':
      try {
        // Validate input
        const { name, type, description, isPublic = true, eventId = null } = req.body
        
        if (!name) {
          return res.status(400).json({ message: "Chatroom name is required" })
        }
        
        // Create new chatroom with safe fallbacks
        const newChatroom = await Chatroom.create({
          name,
          type: type || 'General',
          description: description || '',
          eventId: eventId || null,
          isPublic: isPublic !== undefined ? isPublic : true,
          createdBy: userId,
          participants: [userId]
        })
        
        return res.status(201).json({ 
          chatroom: {
            id: newChatroom._id.toString(),
            name: newChatroom.name,
            type: newChatroom.type,
            description: newChatroom.description,
            isPublic: newChatroom.isPublic,
            eventId: newChatroom.eventId
          }
        })
      } catch (error) {
        console.error("Error creating chatroom:", error)
        return res.status(500).json({ message: "Error creating chatroom" })
      }
      
    default:
      return res.status(405).json({ message: "Method not allowed" })
  }
}