import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Comment from '@/lib/models/Comment';
import { verifyToken } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const comments = await Comment.find({ postId: id }).sort({ createdAt: -1 });
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required to post comments.' }, { status: 401 });
    }

    const { content, postType } = await req.json();
    if (!content || !postType) {
      return NextResponse.json({ error: 'Comment content and post type are required.' }, { status: 400 });
    }

    const newComment = new Comment({
      content: content.trim(),
      postId: id,
      postType,
      authorName: decoded.name,
      authorId: decoded.id
    });

    await newComment.save();
    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
