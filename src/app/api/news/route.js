import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import News from '@/lib/models/News';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();
    const news = await News.find().sort({ createdAt: -1 });
    return NextResponse.json(news);
  } catch (error) {
    console.error('Fetch news error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const { title, content, summary, category, image, tags } = await req.json();
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 });
    }

    const newNews = new News({
      title,
      content,
      summary: summary || '',
      category: category || 'General',
      image: image || '',
      tags: tags || [],
      adminName: decoded.name,
      adminId: decoded.id
    });

    await newNews.save();
    return NextResponse.json(newNews, { status: 201 });
  } catch (error) {
    console.error('Create news error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

