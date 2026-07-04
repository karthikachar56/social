import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import News from '@/lib/models/News';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { action } = await req.json(); // 'like' or 'unlike'
    const inc = action === 'unlike' ? -1 : 1;
    
    const news = await News.findByIdAndUpdate(id, { $inc: { likes: inc } }, { new: true });
    if (!news) {
      return NextResponse.json({ error: 'News article not found.' }, { status: 404 });
    }
    return NextResponse.json({ likes: news.likes });
  } catch (error) {
    console.error('Like news error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
