import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();
    const events = await Event.find().sort({ createdAt: -1 });
    return NextResponse.json(events);
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
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
