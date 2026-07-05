import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Event from '@/lib/models/Event';
import News from '@/lib/models/News';
import { verifyToken } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== 'user') {
      return NextResponse.json({ error: 'Unauthorized. User login required.' }, { status: 401 });
    }

    const { id } = await params;
    const { postType } = await req.json();

    if (!['event', 'news'].includes(postType)) {
      return NextResponse.json({ error: 'Invalid postType' }, { status: 400 });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.banned) {
      return NextResponse.json({ error: 'Account suspended.' }, { status: 403 });
    }

    // Initialize arrays if they don't exist
    if (!user.savedEvents) user.savedEvents = [];
    if (!user.savedNews) user.savedNews = [];

    // Convert string array items to strings for safe comparison
    const eventIdsStr = user.savedEvents.map(eid => eid.toString());
    const newsIdsStr = user.savedNews.map(nid => nid.toString());

    let saved = false;
    if (postType === 'event') {
      const idx = eventIdsStr.indexOf(id);
      if (idx > -1) {
        user.savedEvents.splice(idx, 1);
      } else {
        user.savedEvents.push(id);
        saved = true;
      }
    } else {
      const idx = newsIdsStr.indexOf(id);
      if (idx > -1) {
        user.savedNews.splice(idx, 1);
      } else {
        user.savedNews.push(id);
        saved = true;
      }
    }

    await user.save();

    // Fetch populated user to return
    const updatedUser = await User.findById(decoded.id)
      .select('-password')
      .populate('savedEvents')
      .populate('savedNews');

    return NextResponse.json({ saved, user: updatedUser });
  } catch (error) {
    console.error('Save post error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
