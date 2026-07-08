import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { action } = await req.json(); // 'like' or 'unlike'
    
    let ev;
    if (action === 'unlike') {
      ev = await Event.findOneAndUpdate(
        { _id: id, likes: { $gt: 0 } },
        { $inc: { likes: -1 } },
        { new: true }
      );
      if (!ev) {
        ev = await Event.findById(id);
      }
    } else {
      ev = await Event.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true });
    }

    if (!ev) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }
    return NextResponse.json({ likes: ev.likes || 0 });
  } catch (error) {
    console.error('Like event error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
