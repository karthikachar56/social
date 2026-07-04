import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId:    { type: String, default: null }, // If null, it is a global notification for all users
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  type:      { type: String, default: 'general' }, // 'event', 'news', 'comment', 'general'
  link:      { type: String, default: '' },
  readBy:    [{ type: String }], // Array of user IDs who have read this notification
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export default Notification;
