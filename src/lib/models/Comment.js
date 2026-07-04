import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  content:    { type: String, required: true },
  postType:   { type: String, required: true, enum: ['event', 'news'] },
  postId:     { type: mongoose.Schema.Types.ObjectId, required: true },
  authorName: { type: String, required: true },
  authorId:   { type: String, required: true },
  createdAt:  { type: Date, default: Date.now }
});

const Comment = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);

export default Comment;
