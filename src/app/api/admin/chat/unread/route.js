import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatMessage from '@/lib/models/ChatMessage';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Find all unread messages sent to this admin
    const unreadMessages = await ChatMessage.find({
      recipientId: decoded.id,
      read: false
    });

    return NextResponse.json(unreadMessages);
  } catch (error) {
    console.error('Fetch unread chats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
