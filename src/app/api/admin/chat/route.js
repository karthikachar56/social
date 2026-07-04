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

    const { searchParams } = new URL(req.url);
    const recipientId = searchParams.get('recipientId');

    let query = {};
    if (recipientId && recipientId !== 'group') {
      // Fetch private messages between current admin and recipientId
      query = {
        $or: [
          { senderId: decoded.id, recipientId: recipientId },
          { senderId: recipientId, recipientId: decoded.id }
        ]
      };
    } else {
      // Group chat
      query = {
        $or: [
          { recipientId: null },
          { recipientId: '' }
        ]
      };
    }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
      
    return NextResponse.json(messages.reverse());
  } catch (error) {
    console.error('Fetch chat error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { text, recipientId, recipientName } = await req.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message text is required.' }, { status: 400 });
    }

    const newMessage = new ChatMessage({
      senderId: decoded.id,
      senderName: decoded.name,
      text: text.trim(),
      recipientId: recipientId || null,
      recipientName: recipientName || null
    });

    await newMessage.save();
    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Save chat error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
