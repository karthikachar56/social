import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';
import Comment from '@/lib/models/Comment';
import { verifyToken } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }
    return NextResponse.json(event);
  } catch (error) {
    console.error('Fetch single event error:', error);
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
    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    if (event.adminId !== decoded.id) {
      return NextResponse.json({ error: 'Unauthorized. You can only modify your own events.' }, { status: 403 });
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
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

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    if (event.adminId !== decoded.id) {
      return NextResponse.json({ error: 'Unauthorized. You can only delete your own events.' }, { status: 403 });
    }

    await Event.findByIdAndDelete(id);
    
    // Clean up related comments
    await Comment.deleteMany({ postId: id, postType: 'event' });

    return NextResponse.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
