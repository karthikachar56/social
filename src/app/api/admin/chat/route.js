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

    const messages = await ChatMessage.find()
      .sort({ createdAt: -1 })
      .limit(50);
      
    // Return messages in chronological order (oldest to newest)
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

    const { text } = await req.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Message text is required.' }, { status: 400 });
    }

    const newMessage = new ChatMessage({
      senderId: decoded.id,
      senderName: decoded.name,
      text: text.trim()
    });

    await newMessage.save();
    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Save chat error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
