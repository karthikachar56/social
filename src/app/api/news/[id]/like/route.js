import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import News from '@/lib/models/News';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { action } = await req.json(); // 'like' or 'unlike'
    
    let news;
    if (action === 'unlike') {
      news = await News.findOneAndUpdate(
        { _id: id, likes: { $gt: 0 } },
        { $inc: { likes: -1 } },
        { new: true }
      );
      if (!news) {
        news = await News.findById(id);
      }
    } else {
      news = await News.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true });
    }

    if (!news) {
      return NextResponse.json({ error: 'News article not found.' }, { status: 404 });
    }
    return NextResponse.json({ likes: news.likes || 0 });
  } catch (error) {
    console.error('Like news error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
