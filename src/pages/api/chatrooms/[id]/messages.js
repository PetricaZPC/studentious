import connectDB from '@/utils/connectDB'
import Chatroom from '@/models/Chatroom'
import { v4 as uuidv4 } from 'uuid' // Install this package: npm install uuid

export default async function handler(req, res) {
  const { id } = req.query
  
  if (!id) {
    return res.status(400).json({ message: "Chatroom ID is required" })
  }
  
  // Create a unique session ID for each browser session
  let userId = req.cookies.chatUserId
  let userName = req.cookies.chatUserName || 'User'
  
  // If no userId cookie exists, create one
  if (!userId) {
    userId = `user-${uuidv4().substring(0, 8)}`
    // Generate a random username with a sequential number
    userName = `User-${Math.floor(Math.random() * 10000)}`
    
    // Set cookies to persist this identity in this browser
    res.setHeader('Set-Cookie', [
      `chatUserId=${userId}; Path=/; Max-Age=86400; SameSite=Lax`,
      `chatUserName=${userName}; Path=/; Max-Age=86400; SameSite=Lax`
    ])
  }
  
  try {
    await connectDB()
    
    // Get chatroom
    const chatroom = await Chatroom.findById(id)
    
    if (!chatroom) {
      return res.status(404).json({ message: "Chatroom not found" })
    }
    
    if (req.method === 'GET') {
      // Return messages and user info
      return res.status(200).json({ 
        messages: chatroom.messages || [],
        currentUser: { id: userId, name: userName }
      })
    }
    
    if (req.method === 'POST') {
      // Add a new message
      const { content, senderName } = req.body
      
      if (!content) {
        return res.status(400).json({ message: "Message content is required" })
      }
      
      // Use the provided name or the one from cookie
      const displayName = senderName || userName
      
      const newMessage = {
        content,
        senderId: userId,
        senderName: displayName,
        timestamp: new Date()
      }
      
      // Add message to chatroom
      chatroom.messages.push(newMessage)
      
      // Update lastMessage for previews
      chatroom.lastMessage = {
        content,
        timestamp: new Date()
      }
      
      await chatroom.save()
      
      return res.status(201).json({ 
        message: newMessage,
        currentUser: { id: userId, name: displayName }
      })
    }
    
    return res.status(405).json({ message: "Method not allowed" })
  } catch (error) {
    console.error(`Error in chatroom/${id}/messages API:`, error)
    return res.status(500).json({ message: "Server error" })
  }
}