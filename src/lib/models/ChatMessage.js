import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
  senderId:      { type: String, required: true },
  senderName:    { type: String, required: true },
  recipientId:   { type: String, default: null }, // If null, this is global admin group chat
  recipientName: { type: String, default: null },
  text:          { type: String, required: true },
  read:          { type: Boolean, default: false }, // Tracks if recipient has viewed the message
  createdAt:     { type: Date, default: Date.now }
});

const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);

export default ChatMessage;
