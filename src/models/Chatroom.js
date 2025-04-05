import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  senderId: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ChatroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['Event', 'Course', 'General'],
    default: 'General'
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  participants: [{
    type: String
  }],
  createdBy: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  messages: [MessageSchema],
  lastMessage: {
    content: String,
    timestamp: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// This is important for Next.js - prevents creating duplicate models
export default mongoose.models.Chatroom || mongoose.model('Chatroom', ChatroomSchema);