import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import News from '@/lib/models/News';
import Comment from '@/lib/models/Comment';
import { verifyToken } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const item = await News.findById(id);
    if (!item) {
      return NextResponse.json({ error: 'News article not found.' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    console.error('Fetch single news error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const body = await req.json();
    const updatedNews = await News.findByIdAndUpdate(id, body, { new: true });
    if (!updatedNews) {
      return NextResponse.json({ error: 'News article not found.' }, { status: 404 });
    }
    return NextResponse.json(updatedNews);
  } catch (error) {
    console.error('Update news error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const deletedNews = await News.findByIdAndDelete(id);
    if (!deletedNews) {
      return NextResponse.json({ error: 'News article not found.' }, { status: 404 });
    }
    
    // Clean up related comments
    await Comment.deleteMany({ postId: id, postType: 'news' });

    return NextResponse.json({ message: 'News article deleted successfully.' });
  } catch (error) {
    console.error('Delete news error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
