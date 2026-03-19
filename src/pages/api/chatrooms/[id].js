import connectDB from '@/utils/connectDB'
import Chatroom from '@/models/Chatroom'
import { getUserFromSession } from '@/utils/session';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ message: 'Chatroom ID is required' });
  }

  const sessionUser = await getUserFromSession(req);
  if (!sessionUser) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    await connectDB();

    if (req.method === 'GET') {
      const chatroom = await Chatroom.findById(id);
      if (!chatroom) {
        return res.status(404).json({ message: 'Chatroom not found' });
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
          createdAt: chatroom.createdAt,
        },
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error in chatroom/[id] API:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}
