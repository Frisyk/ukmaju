import mongoose, { Schema } from 'mongoose';

const MessageSchema = new Schema({
  id: String,
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const ChatSessionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  messagesCount: {
    type: Number,
    default: 0
  },
  messages: [MessageSchema]
}, {
  timestamps: true
});

export default mongoose.models.ChatSession || mongoose.model('ChatSession', ChatSessionSchema); 