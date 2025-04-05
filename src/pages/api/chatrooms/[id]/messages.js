import connectDB from '@/utils/connectDB'
import Chatroom from '@/models/Chatroom'

export default async function handler(req, res) {
  const { id } = req.query
  
  if (!id) {
    return res.status(400).json({ message: "Chatroom ID is required" })
  }
  
  // Simple dev authentication
  const userId = 'dev-user-id'
  const userName = 'Dev User'
  
  try {
    await connectDB()
    
    // Get chatroom
    const chatroom = await Chatroom.findById(id)
    
    if (!chatroom) {
      return res.status(404).json({ message: "Chatroom not found" })
    }
    
    if (req.method === 'GET') {
      // Return messages
      return res.status(200).json({ 
        messages: chatroom.messages || []
      })
    }
    
    if (req.method === 'POST') {
      // Add a new message
      const { content } = req.body
      
      if (!content) {
        return res.status(400).json({ message: "Message content is required" })
      }
      
      const newMessage = {
        content,
        senderId: userId,
        senderName: userName,
        timestamp: new Date()
      }
      
      // Add message to the chatroom
      chatroom.messages.push(newMessage)
      
      // Update lastMessage for preview
      chatroom.lastMessage = {
        content,
        timestamp: new Date()
      }
      
      await chatroom.save()
      
      return res.status(201).json({ 
        message: newMessage
      })
    }
    
    return res.status(405).json({ message: "Method not allowed" })
  } catch (error) {
    console.error(`Error in chatroom/${id}/messages API:`, error)
    return res.status(500).json({ message: "Server error" })
  }
}