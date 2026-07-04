import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { action } = await req.json(); // 'like' or 'unlike'
    const inc = action === 'unlike' ? -1 : 1;
    
    const ev = await Event.findByIdAndUpdate(id, { $inc: { likes: inc } }, { new: true });
    if (!ev) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }
    return NextResponse.json({ likes: ev.likes });
  } catch (error) {
    console.error('Like event error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
