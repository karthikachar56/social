import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  date:        { type: String, required: true },
  time:        { type: String, default: '' },
  location:    { type: String, default: '' },
  category:    { type: String, default: 'General' },
  image:       { type: String, default: '' },
  tags:        [String],
  likes:       { type: Number, default: 0 },
  adminName:   { type: String, required: true },
  adminId:     { type: String, required: true },
  createdAt:   { type: Date, default: Date.now }
});

const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

export default Event;
