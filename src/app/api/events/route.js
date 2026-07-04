import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();
    const events = await Event.find().sort({ createdAt: -1 }).lean();
    
    const Comment = (await import('@/lib/models/Comment')).default;
    const eventsWithComments = await Promise.all(events.map(async (ev) => {
      const commentsCount = await Comment.countDocuments({ postId: ev._id });
      return { ...ev, commentsCount };
    }));

    return NextResponse.json(eventsWithComments);
  } catch (error) {
    console.error('Fetch events error:', error);
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

    const { title, description, date, time, location, category, image, tags } = await req.json();
    if (!title || !description || !date) {
      return NextResponse.json({ error: 'Title, description and date are required.' }, { status: 400 });
    }

    const newEvent = new Event({
      title,
      description,
      date,
      time,
      location,
      category: category || 'General',
      image: image || '',
      tags: tags || [],
      adminName: decoded.name,
      adminId: decoded.id
    });

    await newEvent.save();

    // Create a global notification
    try {
      const Notification = (await import('@/lib/models/Notification')).default;
      await new Notification({
        title: `New Event: ${newEvent.title}`,
        message: `${decoded.name} published a new event in ${newEvent.category}`,
        type: 'event',
        link: `/events/${newEvent._id}`
      }).save();
    } catch (err) {
      console.error('Failed to create notification:', err);
    }

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

