import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Notification from '@/lib/models/Notification';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (decoded.role === 'user') {
      const dbUser = await User.findById(decoded.id);
      if (dbUser && dbUser.banned) {
        return NextResponse.json({ error: 'Account suspended.' }, { status: 403 });
      }
    }

    // Fetch private notifications for this user AND global notifications
    const notifications = await Notification.find({
      $or: [
        { userId: decoded.id },
        { userId: null },
        { userId: '' }
      ]
    }).sort({ createdAt: -1 }).limit(30);

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (decoded.role === 'user') {
      const dbUser = await User.findById(decoded.id);
      if (dbUser && dbUser.banned) {
        return NextResponse.json({ error: 'Account suspended.' }, { status: 403 });
      }
    }

    const { id, markAll } = await req.json();

    if (markAll) {
      // Mark all notifications as read for this user
      await Notification.updateMany(
        {
          $or: [
            { userId: decoded.id },
            { userId: null },
            { userId: '' }
          ],
          readBy: { $ne: decoded.id }
        },
        { $addToSet: { readBy: decoded.id } }
      );
      return NextResponse.json({ message: 'All notifications marked as read.' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    const updated = await Notification.findByIdAndUpdate(
      id,
      { $addToSet: { readBy: decoded.id } },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
