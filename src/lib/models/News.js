import mongoose from 'mongoose';

const NewsSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  content:   { type: String, required: true },
  summary:   { type: String, default: '' },
  category:  { type: String, default: 'General' },
  image:     { type: String, default: '' },
  tags:      [String],
  likes:     { type: Number, default: 0 },
  adminName: { type: String, required: true },
  adminId:   { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const News = mongoose.models.News || mongoose.model('News', NewsSchema);

export default News;
